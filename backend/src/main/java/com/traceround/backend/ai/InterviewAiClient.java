package com.traceround.backend.ai;

import com.traceround.backend.interview.InterviewQuestion;
import com.traceround.backend.problem.Problem;
import java.util.List;

public interface InterviewAiClient {

    String initialMessage(Problem problem, int questionNumber, int totalQuestions);

    String respond(Problem problem, String message, List<TranscriptMessage> transcript);

    FeedbackDraft generateFeedback(List<InterviewQuestion> questions);

    record TranscriptMessage(String role, String content) {
    }

    record FeedbackDraft(String overallSummary, List<QuestionFeedbackDraft> questions) {
    }

    record QuestionFeedbackDraft(
        String summary,
        int communication,
        int approach,
        int codeQuality,
        List<String> recommendations
    ) {
    }
}
