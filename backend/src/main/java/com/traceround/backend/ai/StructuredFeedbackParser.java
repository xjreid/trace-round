package com.traceround.backend.ai;

import com.traceround.backend.ai.InterviewAiClient.FeedbackDraft;
import com.traceround.backend.ai.InterviewAiClient.QuestionFeedbackDraft;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Component
public class StructuredFeedbackParser {

    private final ObjectMapper objectMapper;

    public StructuredFeedbackParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public FeedbackDraft parse(String json, int expectedQuestionCount) {
        try {
            FeedbackPayload payload = objectMapper.readValue(
                json,
                FeedbackPayload.class
            );
            validate(payload, expectedQuestionCount);
            List<QuestionFeedbackDraft> questions = payload.questions().stream()
                .sorted(Comparator.comparingInt(QuestionPayload::questionNumber))
                .map(question -> new QuestionFeedbackDraft(
                    question.summary().trim(),
                    question.communication(),
                    question.approach(),
                    question.codeQuality(),
                    question.recommendations().stream()
                        .map(String::trim)
                        .toList()
                ))
                .toList();
            return new FeedbackDraft(payload.overallSummary().trim(), questions);
        } catch (JacksonException | IllegalArgumentException exception) {
            throw new AiProviderException(
                "The AI provider returned invalid structured feedback.",
                exception
            );
        }
    }

    public Map<String, Object> jsonSchema(int questionCount) {
        Map<String, Object> score = Map.of(
            "type", "integer",
            "minimum", 0,
            "maximum", 10
        );
        Map<String, Object> question = new LinkedHashMap<>();
        question.put("type", "object");
        question.put("additionalProperties", false);
        question.put("properties", Map.of(
            "questionNumber", Map.of(
                "type", "integer",
                "minimum", 1,
                "maximum", questionCount
            ),
            "summary", Map.of("type", "string"),
            "communication", score,
            "approach", score,
            "codeQuality", score,
            "recommendations", Map.of(
                "type", "array",
                "minItems", 2,
                "maxItems", 4,
                "items", Map.of("type", "string")
            )
        ));
        question.put("required", List.of(
            "questionNumber",
            "summary",
            "communication",
            "approach",
            "codeQuality",
            "recommendations"
        ));

        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("additionalProperties", false);
        schema.put("properties", Map.of(
            "overallSummary", Map.of("type", "string"),
            "questions", Map.of(
                "type", "array",
                "minItems", questionCount,
                "maxItems", questionCount,
                "items", question
            )
        ));
        schema.put("required", List.of("overallSummary", "questions"));
        return schema;
    }

    private void validate(FeedbackPayload payload, int expectedQuestionCount) {
        requireText(payload.overallSummary(), "overallSummary");
        if (
            payload.questions() == null ||
                payload.questions().size() != expectedQuestionCount
        ) {
            throw new IllegalArgumentException(
                "Feedback must contain exactly one result per question."
            );
        }
        Set<Integer> questionNumbers = payload.questions().stream()
            .map(QuestionPayload::questionNumber)
            .collect(Collectors.toSet());
        if (
            questionNumbers.size() != expectedQuestionCount ||
                !questionNumbers.containsAll(
                    java.util.stream.IntStream
                        .rangeClosed(1, expectedQuestionCount)
                        .boxed()
                        .toList()
                )
        ) {
            throw new IllegalArgumentException(
                "Feedback question numbers are incomplete or duplicated."
            );
        }
        for (QuestionPayload question : payload.questions()) {
            requireText(question.summary(), "summary");
            requireScore(question.communication(), "communication");
            requireScore(question.approach(), "approach");
            requireScore(question.codeQuality(), "codeQuality");
            if (
                question.recommendations() == null ||
                    question.recommendations().size() < 2 ||
                    question.recommendations().size() > 4
            ) {
                throw new IllegalArgumentException(
                    "Each question needs two to four recommendations."
                );
            }
            question.recommendations().forEach(recommendation ->
                requireText(recommendation, "recommendation")
            );
        }
    }

    private void requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank.");
        }
    }

    private void requireScore(int score, String field) {
        if (score < 0 || score > 10) {
            throw new IllegalArgumentException(
                field + " must be between 0 and 10."
            );
        }
    }

    private record FeedbackPayload(
        String overallSummary,
        List<QuestionPayload> questions
    ) {
    }

    private record QuestionPayload(
        int questionNumber,
        String summary,
        int communication,
        int approach,
        int codeQuality,
        List<String> recommendations
    ) {
    }
}
