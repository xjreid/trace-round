package com.traceround.backend.submission;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class SubmissionDtos {

    private SubmissionDtos() {
    }

    public record Received(
        int questionCount,
        int discussionMessageCount,
        int codeLength,
        String language,
        String problemSlug
    ) {
    }

    public record SubmissionResponse(
        String id,
        String sessionId,
        String feedbackId,
        String status,
        Received received
    ) {
    }

    public record Scores(int communication, int approach, int codeQuality) {
    }

    public record QuestionFeedbackResponse(
        String id,
        String title,
        String summary,
        Scores scores,
        List<String> recommendations
    ) {
    }

    public record FeedbackResponse(
        String id,
        String status,
        Instant interviewDate,
        int questionCount,
        String overallSummary,
        List<QuestionFeedbackResponse> questions
    ) {
    }

    public record Metrics(int totalInterviews, Map<String, Double> averages) {
    }

    public record SubmissionSummary(
        String id,
        Instant interviewDate,
        int questionCount,
        List<String> questionTitles,
        double overallScore
    ) {
    }

    public record Pagination(String nextCursor) {
    }

    public record SubmissionsResponse(
        Metrics metrics,
        List<SubmissionSummary> submissions,
        Pagination pagination
    ) {
    }
}
