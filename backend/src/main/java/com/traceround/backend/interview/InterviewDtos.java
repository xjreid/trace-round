package com.traceround.backend.interview;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Set;

public final class InterviewDtos {

    private InterviewDtos() {
    }

    public record PracticeSelectionRequest(
        @NotEmpty Set<@NotBlank String> categories,
        @Min(1) @Max(3) int questionCount
    ) {
    }

    public record StartProblemRequest(@NotBlank String problemSlug) {
    }

    public record StartCustomRequest(
        @NotEmpty List<@NotBlank String> selectedProblemSlugs,
        @NotEmpty Set<@NotBlank String> categories,
        @Min(1) @Max(3) int questionCount
    ) {
    }

    public record MessageRequest(
        @NotBlank String problemSlug,
        @NotBlank @Size(max = 5000) String message
    ) {
    }

    public record RunRequest(
        @NotBlank String problemSlug,
        @NotBlank String language,
        @NotNull @Size(max = 100_000) String code
    ) {
    }

    public record SubmitRequest(@NotEmpty List<@Valid AnswerRequest> answers) {
    }

    public record AnswerRequest(
        @NotBlank String problemSlug,
        @NotBlank String language,
        @NotNull @Size(max = 100_000) String code,
        @NotBlank String endedBy
    ) {
    }

    public record MessageResponse(String id, String role, String content) {
        static MessageResponse from(ChatMessage message) {
            return new MessageResponse(
                message.getId().toString(),
                message.getRole(),
                message.getContent()
            );
        }
    }

    public record Durations(int discussion, int coding) {
    }

    public record QuestionSession(
        String problemSlug,
        List<MessageResponse> initialMessages
    ) {
    }

    public record SessionResponse(
        String id,
        String problemSlug,
        String status,
        int questionCount,
        Durations durations,
        List<MessageResponse> initialMessages,
        List<QuestionSession> questions
    ) {
    }
}
