package com.traceround.backend.ai;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import com.traceround.backend.ai.InterviewAiClient.FeedbackDraft;
import com.traceround.backend.ai.InterviewAiClient.TranscriptMessage;
import com.traceround.backend.interview.ChatMessage;
import com.traceround.backend.interview.InterviewQuestion;
import com.traceround.backend.interview.InterviewSession;
import com.traceround.backend.problem.Problem;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.ObjectMapper;

class GeminiInterviewAiClientTests {

    private MockRestServiceServer server;
    private GeminiInterviewAiClient client;
    private Problem problem;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        RestClient.Builder builder = RestClient.builder()
            .baseUrl("https://gemini.test")
            .defaultHeader("x-goog-api-key", "test-key")
            .defaultHeader("Api-Revision", "2026-05-20");
        server = MockRestServiceServer.bindTo(builder).build();
        client = new GeminiInterviewAiClient(
            builder.build(),
            new InterviewPromptFactory(objectMapper),
            new StructuredFeedbackParser(objectMapper),
            "gemini-test-model"
        );
        problem = problem("two-sum", "Two Sum");
    }

    @Test
    void sendsStandardizedConversationContextAndReturnsModelText() {
        server.expect(once(), requestTo("https://gemini.test/v1beta/interactions"))
            .andExpect(method(HttpMethod.POST))
            .andExpect(header("x-goog-api-key", "test-key"))
            .andExpect(header("Api-Revision", "2026-05-20"))
            .andExpect(jsonPath("$.model").value("gemini-test-model"))
            .andExpect(jsonPath("$.store").value(false))
            .andExpect(jsonPath("$.response_format").doesNotExist())
            .andExpect(jsonPath("$.system_instruction", containsString(
                "technical coding interviewer"
            )))
            .andExpect(jsonPath("$.input", containsString("hash map")))
            .andRespond(withSuccess(
                interactionResponse(
                    "That lookup approach is promising. What will each map entry store?"
                ),
                MediaType.APPLICATION_JSON
            ));

        String response = client.respond(
            problem,
            "I would use a hash map.",
            List.of(
                new TranscriptMessage(
                    "interviewer",
                    "How would you approach the problem?"
                ),
                new TranscriptMessage("user", "I would use a hash map.")
            )
        );

        assertEquals(
            "That lookup approach is promising. What will each map entry store?",
            response
        );
        server.verify();
    }

    @Test
    void requestsAndValidatesStructuredFeedbackInQuestionOrder() {
        InterviewQuestion first = completedQuestion(
            problem,
            1,
            "Python",
            "class Solution: pass"
        );
        InterviewQuestion second = completedQuestion(
            problem("valid-parentheses", "Valid Parentheses"),
            2,
            "Java",
            "class Solution {}"
        );
        String structuredFeedback = """
            {
              "overallSummary": "The candidate communicated a workable plan.",
              "questions": [
                {
                  "questionNumber": 2,
                  "summary": "The stack approach was appropriate.",
                  "communication": 7,
                  "approach": 8,
                  "codeQuality": 6,
                  "recommendations": [
                    "Explain mismatched closing brackets.",
                    "Walk through an empty-stack case."
                  ]
                },
                {
                  "questionNumber": 1,
                  "summary": "The lookup strategy reached linear time.",
                  "communication": 8,
                  "approach": 9,
                  "codeQuality": 7,
                  "recommendations": [
                    "State the map invariant first.",
                    "Discuss duplicate values explicitly."
                  ]
                }
              ]
            }
            """;

        server.expect(once(), requestTo("https://gemini.test/v1beta/interactions"))
            .andExpect(method(HttpMethod.POST))
            .andExpect(jsonPath("$.response_format.type").value("text"))
            .andExpect(jsonPath("$.response_format.mime_type").value(
                "application/json"
            ))
            .andExpect(jsonPath(
                "$.response_format.schema.properties.questions.minItems"
            ).value(2))
            .andExpect(jsonPath("$.input", containsString("sourceCode")))
            .andRespond(withSuccess(
                interactionResponse(structuredFeedback),
                MediaType.APPLICATION_JSON
            ));

        FeedbackDraft feedback = client.generateFeedback(List.of(first, second));

        assertEquals(
            "The candidate communicated a workable plan.",
            feedback.overallSummary()
        );
        assertEquals(2, feedback.questions().size());
        assertEquals(
            "The lookup strategy reached linear time.",
            feedback.questions().getFirst().summary()
        );
        assertEquals(9, feedback.questions().getFirst().approach());
        assertEquals(
            "The stack approach was appropriate.",
            feedback.questions().get(1).summary()
        );
        server.verify();
    }

    @Test
    void rejectsMalformedStructuredFeedback() {
        InterviewQuestion question = completedQuestion(
            problem,
            1,
            "Python",
            "class Solution: pass"
        );
        server.expect(once(), requestTo("https://gemini.test/v1beta/interactions"))
            .andRespond(withSuccess(
                interactionResponse("""
                    {
                      "overallSummary": "Incomplete",
                      "questions": []
                    }
                    """),
                MediaType.APPLICATION_JSON
            ));

        AiProviderException exception = assertThrows(
            AiProviderException.class,
            () -> client.generateFeedback(List.of(question))
        );

        assertEquals(
            "The AI provider returned invalid structured feedback.",
            exception.getMessage()
        );
        server.verify();
    }

    @Test
    void translatesGeminiRateLimitsWithoutExposingProviderResponseDetails() {
        server.expect(once(), requestTo("https://gemini.test/v1beta/interactions"))
            .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"error\":{\"message\":\"internal provider detail\"}}"));

        AiProviderException exception = assertThrows(
            AiProviderException.class,
            () -> client.initialMessage(problem, 1, 1)
        );

        assertEquals(
            "Gemini's request limit was reached. Please try again shortly.",
            exception.getMessage()
        );
        server.verify();
    }

    private InterviewQuestion completedQuestion(
        Problem selectedProblem,
        int order,
        String language,
        String code
    ) {
        InterviewSession session = new InterviewSession(
            null,
            order > 1,
            Set.of(selectedProblem.getCategory())
        );
        InterviewQuestion question = new InterviewQuestion(
            session,
            selectedProblem,
            order
        );
        question.addMessage(new ChatMessage(
            question,
            "interviewer",
            "Explain your approach."
        ));
        question.addMessage(new ChatMessage(
            question,
            "user",
            "I will describe the invariant and complexity."
        ));
        question.complete(language, code, "submitted");
        return question;
    }

    private Problem problem(String slug, String title) {
        Problem selectedProblem;
        try {
            var constructor = Problem.class.getDeclaredConstructor();
            constructor.setAccessible(true);
            selectedProblem = constructor.newInstance();
        } catch (ReflectiveOperationException exception) {
            throw new AssertionError(exception);
        }
        ReflectionTestUtils.setField(selectedProblem, "slug", slug);
        ReflectionTestUtils.setField(selectedProblem, "title", title);
        ReflectionTestUtils.setField(selectedProblem, "difficulty", "Easy");
        ReflectionTestUtils.setField(selectedProblem, "category", "Array");
        ReflectionTestUtils.setField(
            selectedProblem,
            "description",
            "Solve the problem using the stated constraints."
        );
        return selectedProblem;
    }

    private String interactionResponse(String text) {
        try {
            String encodedText = new ObjectMapper().writeValueAsString(text);
            return """
                {
                  "status": "completed",
                  "steps": [
                    {
                      "type": "model_output",
                      "content": [
                        {
                          "type": "text",
                          "text": %s
                        }
                      ]
                    }
                  ]
                }
                """.formatted(encodedText);
        } catch (tools.jackson.core.JacksonException exception) {
            throw new AssertionError(exception);
        }
    }
}
