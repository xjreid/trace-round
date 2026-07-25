package com.traceround.backend.ai;

import com.traceround.backend.interview.InterviewQuestion;
import com.traceround.backend.problem.Problem;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
    name = "traceround.ai.provider",
    havingValue = "mock",
    matchIfMissing = true
)
public class MockInterviewAiClient implements InterviewAiClient {

    @Override
    public String initialMessage(
        Problem problem,
        int questionNumber,
        int totalQuestions
    ) {
        String context = totalQuestions > 1
            ? " This is question " + questionNumber + " of " + totalQuestions + "."
            : "";
        return "Welcome." + context + " Before you code, walk me through how you "
            + "would approach “" + problem.getTitle() + ".” You can also ask any "
            + "clarifying questions about the prompt.";
    }

    @Override
    public String respond(
        Problem problem,
        String message,
        List<TranscriptMessage> transcript
    ) {
        String normalized = message.toLowerCase();
        if (
            normalized.contains("clarif")
                || normalized.contains("assume")
                || normalized.contains("?")
        ) {
            return "Use the constraints exactly as written in the "
                + problem.getTitle()
                + " prompt. You may state any additional reasonable assumption before coding.";
        }
        if (
            normalized.contains("complex")
                || normalized.contains("big o")
                || normalized.contains("time")
        ) {
            return "Good—include both time and space complexity. What input "
                + "characteristic determines the dominant term?";
        }
        if (
            normalized.contains("hash")
                || normalized.contains("map")
                || normalized.contains("set")
        ) {
            return "A lookup structure could be useful. Explain what you would "
                + "store, when you would update it, and the tradeoff involved.";
        }
        return "That sounds like a reasonable direction. Explain the data structure "
            + "you would use and how it affects time and space complexity.";
    }

    @Override
    public FeedbackDraft generateFeedback(List<InterviewQuestion> questions) {
        List<QuestionFeedbackDraft> questionFeedback = new ArrayList<>();
        for (InterviewQuestion question : questions) {
            long userMessages = question.getMessages().stream()
                .filter(message -> "user".equals(message.getRole()))
                .count();
            boolean hasCode = question.getSourceCode() != null
                && !question.getSourceCode().isBlank();
            int communication = clamp(6 + (int) Math.min(userMessages, 3));
            int approach = clamp(6 + (userMessages > 1 ? 1 : 0));
            int codeQuality = hasCode ? 7 : 4;

            questionFeedback.add(new QuestionFeedbackDraft(
                "You communicated a workable direction for "
                    + question.getProblem().getTitle()
                    + " and carried the discussion into an implementation. Continue "
                    + "making edge cases, invariants, and complexity tradeoffs explicit.",
                communication,
                approach,
                codeQuality,
                List.of(
                    "State the complete algorithm and its key invariant before coding.",
                    "Walk through at least one edge case and explain how the code handles it.",
                    "Finish with the time and space complexity."
                )
            ));
        }

        String overall = questions.size() == 1
            ? "You completed a focused technical interview covering clarification, "
                + "solution planning, and implementation."
            : "You completed a " + questions.size() + "-question technical interview. "
                + "Review each question below for focused scores and next steps.";
        return new FeedbackDraft(overall, questionFeedback);
    }

    private int clamp(int score) {
        return Math.max(0, Math.min(score, 10));
    }
}
