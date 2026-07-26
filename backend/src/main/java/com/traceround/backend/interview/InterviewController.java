package com.traceround.backend.interview;

import com.traceround.backend.code.CodeExecutionClient.CodeExecutionResult;
import com.traceround.backend.interview.InterviewDtos.MessageRequest;
import com.traceround.backend.interview.InterviewDtos.MessageResponse;
import com.traceround.backend.interview.InterviewDtos.PracticeSelectionRequest;
import com.traceround.backend.interview.InterviewDtos.RunRequest;
import com.traceround.backend.interview.InterviewDtos.SessionResponse;
import com.traceround.backend.interview.InterviewDtos.StartCustomRequest;
import com.traceround.backend.interview.InterviewDtos.StartProblemRequest;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class InterviewController {

    private final InterviewService interviews;

    public InterviewController(InterviewService interviews) {
        this.interviews = interviews;
    }

    @PostMapping("/practice/problem-slugs")
    public List<String> selectProblems(
        @Valid @RequestBody PracticeSelectionRequest request
    ) {
        return interviews.selectProblems(request.categories(), request.questionCount());
    }

    @PostMapping("/interview-sessions/problem")
    public SessionResponse startProblem(
        @Valid @RequestBody StartProblemRequest request,
        Authentication authentication,
        HttpServletRequest httpRequest
    ) {
        return interviews.startSingle(
            request.problemSlug(),
            authentication,
            httpRequest.getRemoteAddr()
        );
    }

    @PostMapping("/interview-sessions/custom")
    public SessionResponse startCustom(
        @Valid @RequestBody StartCustomRequest request,
        Authentication authentication,
        HttpServletRequest httpRequest
    ) {
        return interviews.startCustom(
            request.selectedProblemSlugs(),
            request.categories(),
            request.questionCount(),
            authentication,
            httpRequest.getRemoteAddr()
        );
    }

    @PostMapping("/interview-sessions/{sessionId}/messages")
    public MessageResponse message(
        @PathVariable UUID sessionId,
        @Valid @RequestBody MessageRequest request,
        Authentication authentication,
        HttpServletRequest httpRequest
    ) {
        return interviews.sendMessage(
            sessionId,
            request.problemSlug(),
            request.message(),
            authentication,
            httpRequest.getRemoteAddr()
        );
    }

    @PostMapping("/interview-sessions/{sessionId}/runs")
    public CodeExecutionResult run(
        @PathVariable UUID sessionId,
        @Valid @RequestBody RunRequest request,
        Authentication authentication
    ) {
        return interviews.runCode(
            sessionId,
            request.problemSlug(),
            request.language(),
            request.code(),
            authentication
        );
    }
}
