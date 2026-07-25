package com.traceround.backend.submission;

import com.traceround.backend.interview.InterviewDtos.SubmitRequest;
import com.traceround.backend.submission.SubmissionDtos.FeedbackResponse;
import com.traceround.backend.submission.SubmissionDtos.SubmissionResponse;
import com.traceround.backend.submission.SubmissionDtos.SubmissionsResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class SubmissionController {

    private final SubmissionService submissions;

    public SubmissionController(SubmissionService submissions) {
        this.submissions = submissions;
    }

    @PostMapping("/interview-sessions/{sessionId}/submit")
    public SubmissionResponse submit(
        @PathVariable UUID sessionId,
        @Valid @RequestBody SubmitRequest request,
        Authentication authentication
    ) {
        return submissions.submit(sessionId, request.answers(), authentication);
    }

    @GetMapping("/feedback/{feedbackId}")
    public FeedbackResponse feedback(
        @PathVariable UUID feedbackId,
        Authentication authentication
    ) {
        return submissions.feedback(feedbackId, authentication);
    }

    @GetMapping("/me/submissions")
    public SubmissionsResponse userSubmissions(
        @RequestParam(defaultValue = "0") int cursor,
        @RequestParam(defaultValue = "4") int limit,
        Authentication authentication
    ) {
        return submissions.userSubmissions(cursor, limit, authentication);
    }

    @GetMapping("/me/submissions/{submissionId}/feedback")
    public FeedbackResponse userSubmissionFeedback(
        @PathVariable UUID submissionId,
        Authentication authentication
    ) {
        return submissions.submissionFeedback(submissionId, authentication);
    }
}
