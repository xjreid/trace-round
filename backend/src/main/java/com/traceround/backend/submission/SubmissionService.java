package com.traceround.backend.submission;

import com.traceround.backend.ai.InterviewAiClient;
import com.traceround.backend.ai.InterviewAiClient.FeedbackDraft;
import com.traceround.backend.ai.InterviewAiClient.QuestionFeedbackDraft;
import com.traceround.backend.auth.CurrentUserService;
import com.traceround.backend.interview.InterviewDtos.AnswerRequest;
import com.traceround.backend.interview.InterviewQuestion;
import com.traceround.backend.interview.InterviewService;
import com.traceround.backend.interview.InterviewSession;
import com.traceround.backend.interview.InterviewSessionRepository;
import com.traceround.backend.submission.SubmissionDtos.FeedbackResponse;
import com.traceround.backend.submission.SubmissionDtos.Metrics;
import com.traceround.backend.submission.SubmissionDtos.Pagination;
import com.traceround.backend.submission.SubmissionDtos.QuestionFeedbackResponse;
import com.traceround.backend.submission.SubmissionDtos.Received;
import com.traceround.backend.submission.SubmissionDtos.Scores;
import com.traceround.backend.submission.SubmissionDtos.SubmissionResponse;
import com.traceround.backend.submission.SubmissionDtos.SubmissionSummary;
import com.traceround.backend.submission.SubmissionDtos.SubmissionsResponse;
import com.traceround.backend.user.AppUser;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SubmissionService {

    private final InterviewService interviews;
    private final InterviewSessionRepository sessions;
    private final SubmissionRepository submissions;
    private final FeedbackRepository feedbackRepository;
    private final QuestionFeedbackRepository questionFeedbackRepository;
    private final InterviewAiClient ai;
    private final CurrentUserService currentUsers;

    public SubmissionService(
        InterviewService interviews,
        InterviewSessionRepository sessions,
        SubmissionRepository submissions,
        FeedbackRepository feedbackRepository,
        QuestionFeedbackRepository questionFeedbackRepository,
        InterviewAiClient ai,
        CurrentUserService currentUsers
    ) {
        this.interviews = interviews;
        this.sessions = sessions;
        this.submissions = submissions;
        this.feedbackRepository = feedbackRepository;
        this.questionFeedbackRepository = questionFeedbackRepository;
        this.ai = ai;
        this.currentUsers = currentUsers;
    }

    @Transactional
    public SubmissionResponse submit(
        UUID sessionId,
        List<AnswerRequest> answers,
        Authentication authentication
    ) {
        interviews.prepareSubmission(sessionId, answers, authentication);
        return createSubmission(sessionId);
    }

    private SubmissionResponse createSubmission(UUID sessionId) {
        InterviewSession session = sessions.findDetailedById(sessionId).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview session not found.")
        );
        Submission submission = submissions.save(new Submission(session));
        FeedbackDraft draft = ai.generateFeedback(session.getQuestions());
        Feedback feedback = feedbackRepository.save(
            new Feedback(submission, draft.overallSummary())
        );

        for (int index = 0; index < session.getQuestions().size(); index++) {
            InterviewQuestion question = session.getQuestions().get(index);
            QuestionFeedbackDraft questionDraft = draft.questions().get(index);
            QuestionFeedback questionFeedback = questionFeedbackRepository.save(
                new QuestionFeedback(
                    feedback,
                    question.getProblem().getSlug(),
                    question.getProblem().getTitle(),
                    questionDraft.summary(),
                    questionDraft.communication(),
                    questionDraft.approach(),
                    questionDraft.codeQuality(),
                    index + 1,
                    questionDraft.recommendations()
                )
            );
            feedback.addQuestion(questionFeedback);
        }

        int messageCount = session.getQuestions().stream()
            .mapToInt(question -> question.getMessages().size())
            .sum();
        int codeLength = session.getQuestions().stream()
            .map(InterviewQuestion::getSourceCode)
            .filter(code -> code != null)
            .mapToInt(String::length)
            .sum();
        InterviewQuestion first = session.getQuestions().getFirst();

        return new SubmissionResponse(
            submission.getId().toString(),
            session.getId().toString(),
            feedback.getId().toString(),
            "completed",
            new Received(
                session.getQuestions().size(),
                messageCount,
                codeLength,
                first.getLanguage(),
                first.getProblem().getSlug()
            )
        );
    }

    @Transactional(readOnly = true)
    public FeedbackResponse feedback(UUID feedbackId, Authentication authentication) {
        Feedback feedback = feedbackRepository.findDetailedById(feedbackId)
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Feedback not found.")
            );
        verifyFeedbackAccess(feedback, authentication);
        return mapFeedback(feedback);
    }

    @Transactional(readOnly = true)
    public SubmissionsResponse userSubmissions(
        int cursor,
        int limit,
        Authentication authentication
    ) {
        AppUser user = currentUsers.require(authentication);
        int safeLimit = Math.max(1, Math.min(limit, 20));
        int safeCursor = Math.max(cursor, 0);
        int pageNumber = safeCursor / safeLimit;
        Page<Submission> page = submissions.findByUserOrderByInterviewDateDesc(
            user,
            PageRequest.of(pageNumber, safeLimit)
        );
        List<SubmissionSummary> summaries = page.getContent().stream()
            .map(this::summary)
            .toList();
        List<Submission> all = submissions
            .findByUserOrderByInterviewDateDesc(user, org.springframework.data.domain.Pageable.unpaged())
            .getContent();

        int nextOffset = safeCursor + summaries.size();
        String nextCursor = nextOffset < page.getTotalElements()
            ? Integer.toString(nextOffset)
            : null;
        return new SubmissionsResponse(
            calculateMetrics(all),
            summaries,
            new Pagination(nextCursor)
        );
    }

    @Transactional(readOnly = true)
    public FeedbackResponse submissionFeedback(
        UUID submissionId,
        Authentication authentication
    ) {
        AppUser user = currentUsers.require(authentication);
        Submission submission = submissions.findDetailedById(submissionId)
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found.")
            );
        if (submission.getUser() == null || !submission.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied.");
        }
        Feedback feedback = feedbackRepository.findBySubmissionId(submissionId)
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Feedback not found.")
            );
        return mapFeedback(feedback);
    }

    private void verifyFeedbackAccess(
        Feedback feedback,
        Authentication authentication
    ) {
        AppUser owner = feedback.getSubmission().getUser();
        if (owner == null) {
            return;
        }
        AppUser current = currentUsers.require(authentication);
        if (!owner.getId().equals(current.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied.");
        }
    }

    private FeedbackResponse mapFeedback(Feedback feedback) {
        List<QuestionFeedbackResponse> questions = feedback.getQuestions().stream()
            .map(question -> new QuestionFeedbackResponse(
                question.getProblemSlug(),
                question.getTitle(),
                question.getSummary(),
                new Scores(
                    question.getCommunicationScore(),
                    question.getApproachScore(),
                    question.getCodeQualityScore()
                ),
                List.copyOf(question.getRecommendations())
            ))
            .toList();
        return new FeedbackResponse(
            feedback.getId().toString(),
            feedback.getStatus(),
            feedback.getSubmission().getInterviewDate(),
            questions.size(),
            feedback.getOverallSummary(),
            questions
        );
    }

    private SubmissionSummary summary(Submission submission) {
        Feedback feedback = feedbackRepository.findBySubmissionId(submission.getId())
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Feedback not found.")
            );
        double average = feedback.getQuestions().stream()
            .mapToDouble(this::questionAverage)
            .average()
            .orElse(0);
        return new SubmissionSummary(
            submission.getId().toString(),
            submission.getInterviewDate(),
            feedback.getQuestions().size(),
            feedback.getQuestions().stream().map(QuestionFeedback::getTitle).toList(),
            average
        );
    }

    private Metrics calculateMetrics(List<Submission> history) {
        List<QuestionFeedback> allQuestions = new ArrayList<>();
        for (Submission submission : history) {
            feedbackRepository.findBySubmissionId(submission.getId())
                .ifPresent(feedback -> allQuestions.addAll(feedback.getQuestions()));
        }
        Map<String, Double> averages = new LinkedHashMap<>();
        averages.put(
            "communication",
            allQuestions.stream()
                .mapToInt(QuestionFeedback::getCommunicationScore)
                .average()
                .orElse(0)
        );
        averages.put(
            "approach",
            allQuestions.stream()
                .mapToInt(QuestionFeedback::getApproachScore)
                .average()
                .orElse(0)
        );
        averages.put(
            "codeQuality",
            allQuestions.stream()
                .mapToInt(QuestionFeedback::getCodeQualityScore)
                .average()
                .orElse(0)
        );
        return new Metrics(history.size(), averages);
    }

    private double questionAverage(QuestionFeedback question) {
        return (
            question.getCommunicationScore()
                + question.getApproachScore()
                + question.getCodeQualityScore()
        ) / 3.0;
    }
}
