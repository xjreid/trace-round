package com.traceround.backend.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.traceround.backend.ai.InterviewPromptFactory.Prompt;
import com.traceround.backend.interview.InterviewQuestion;
import com.traceround.backend.problem.Problem;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Component
@ConditionalOnProperty(name = "traceround.ai.provider", havingValue = "gemini")
public class GeminiInterviewAiClient implements InterviewAiClient {

    private static final String INTERACTIONS_PATH = "/v1beta/interactions";
    private static final String API_REVISION = "2026-05-20";
    private static final Pattern DOLLAR_COMPLEXITY = Pattern.compile(
        "\\$\\s*\\{?\\s*([OΘΩ]\\s*\\([^$\\n{}]+\\))\\s*}?\\s*\\$"
    );
    private static final Pattern DOLLAR_VARIABLE = Pattern.compile(
        "\\$\\s*([A-Za-z])\\s*\\$"
    );
    private static final Pattern BRACED_COMPLEXITY = Pattern.compile(
        "\\{\\s*([OΘΩ]\\s*\\([^{}\\n]+\\))\\s*}"
    );

    private final RestClient restClient;
    private final InterviewPromptFactory prompts;
    private final StructuredFeedbackParser feedbackParser;
    private final String model;

    @Autowired
    public GeminiInterviewAiClient(
        RestClient.Builder builder,
        InterviewPromptFactory prompts,
        StructuredFeedbackParser feedbackParser,
        @Value("${traceround.ai.gemini.base-url}") String baseUrl,
        @Value("${traceround.ai.api-key}") String apiKey,
        @Value("${traceround.ai.model}") String model,
        @Value("${traceround.ai.timeout-seconds}") int timeoutSeconds
    ) {
        this(
            buildClient(builder, baseUrl, apiKey, timeoutSeconds),
            prompts,
            feedbackParser,
            model
        );
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                "Gemini is selected but TRACEROUND_AI_API_KEY is empty."
            );
        }
    }

    GeminiInterviewAiClient(
        RestClient restClient,
        InterviewPromptFactory prompts,
        StructuredFeedbackParser feedbackParser,
        String model
    ) {
        if (model == null || model.isBlank()) {
            throw new IllegalStateException(
                "Gemini is selected but TRACEROUND_AI_MODEL is empty."
            );
        }
        this.restClient = restClient;
        this.prompts = prompts;
        this.feedbackParser = feedbackParser;
        this.model = model;
    }

    @Override
    public String initialMessage(
        Problem problem,
        int questionNumber,
        int totalQuestions
    ) {
        return generateConversation(
            prompts.initialMessage(problem, questionNumber, totalQuestions)
        );
    }

    @Override
    public String respond(
        Problem problem,
        String message,
        List<TranscriptMessage> transcript
    ) {
        return generateConversation(prompts.response(problem, message, transcript));
    }

    @Override
    public FeedbackDraft generateFeedback(List<InterviewQuestion> questions) {
        if (questions.isEmpty()) {
            throw new IllegalArgumentException(
                "At least one interview question is required for feedback."
            );
        }
        ResponseFormat responseFormat = new ResponseFormat(
            "text",
            "application/json",
            feedbackParser.jsonSchema(questions.size())
        );
        String json = generate(prompts.feedback(questions), responseFormat);
        return feedbackParser.parse(json, questions.size());
    }

    private String generate(Prompt prompt, ResponseFormat responseFormat) {
        InteractionRequest request = new InteractionRequest(
            model,
            prompt.input(),
            prompt.systemInstruction(),
            false,
            responseFormat
        );
        try {
            InteractionResponse response = restClient.post()
                .uri(INTERACTIONS_PATH)
                .body(request)
                .retrieve()
                .body(InteractionResponse.class);
            return extractText(response);
        } catch (RestClientResponseException exception) {
            String message = exception.getStatusCode().value() == 429
                ? "Gemini's request limit was reached. Please try again shortly."
                : "Gemini rejected the AI request.";
            throw new AiProviderException(message, exception);
        } catch (RestClientException exception) {
            throw new AiProviderException(
                "Gemini is currently unavailable. Please try again.",
                exception
            );
        }
    }

    private String generateConversation(Prompt prompt) {
        return normalizeConversationText(generate(prompt, null));
    }

    static String normalizeConversationText(String text) {
        String normalized = text
            .replace("\\mathcal{O}", "O")
            .replace("\\(", "")
            .replace("\\)", "")
            .replace("\\[", "")
            .replace("\\]", "");
        normalized = DOLLAR_COMPLEXITY.matcher(normalized).replaceAll("$1");
        normalized = DOLLAR_VARIABLE.matcher(normalized).replaceAll("$1");
        normalized = BRACED_COMPLEXITY.matcher(normalized).replaceAll("$1");
        return normalized.trim();
    }

    private String extractText(InteractionResponse response) {
        if (response == null || !"completed".equals(response.status())) {
            throw new AiProviderException(
                "Gemini did not complete the AI request."
            );
        }
        String text = response.steps() == null
            ? ""
            : response.steps().stream()
                .filter(step -> "model_output".equals(step.type()))
                .filter(step -> step.content() != null)
                .flatMap(step -> step.content().stream())
                .filter(content -> "text".equals(content.type()))
                .map(ContentBlock::text)
                .filter(Objects::nonNull)
                .reduce("", String::concat)
                .trim();
        if (text.isBlank()) {
            throw new AiProviderException(
                "Gemini returned an empty AI response."
            );
        }
        return text;
    }

    private static RestClient buildClient(
        RestClient.Builder builder,
        String baseUrl,
        String apiKey,
        int timeoutSeconds
    ) {
        int safeTimeout = Math.max(1, Math.min(timeoutSeconds, 120));
        HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(safeTimeout))
            .build();
        JdkClientHttpRequestFactory requestFactory =
            new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(safeTimeout));
        return builder.clone()
            .baseUrl(baseUrl)
            .requestFactory(requestFactory)
            .defaultHeader("x-goog-api-key", apiKey == null ? "" : apiKey)
            .defaultHeader("Api-Revision", API_REVISION)
            .defaultHeader(HttpHeaders.CONTENT_TYPE, "application/json")
            .build();
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private record InteractionRequest(
        String model,
        String input,
        @JsonProperty("system_instruction") String systemInstruction,
        boolean store,
        @JsonProperty("response_format") ResponseFormat responseFormat
    ) {
    }

    private record ResponseFormat(
        String type,
        @JsonProperty("mime_type") String mimeType,
        Map<String, Object> schema
    ) {
    }

    private record InteractionResponse(
        String status,
        List<InteractionStep> steps
    ) {
    }

    private record InteractionStep(String type, List<ContentBlock> content) {
    }

    private record ContentBlock(String type, String text) {
    }
}
