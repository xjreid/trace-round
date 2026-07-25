package com.traceround.backend.interview;

import com.traceround.backend.ai.InterviewAiClient;
import com.traceround.backend.ai.InterviewAiClient.TranscriptMessage;
import com.traceround.backend.auth.CurrentUserService;
import com.traceround.backend.code.CodeExecutionClient;
import com.traceround.backend.code.CodeExecutionClient.CodeExecutionResult;
import com.traceround.backend.interview.InterviewDtos.Durations;
import com.traceround.backend.interview.InterviewDtos.MessageResponse;
import com.traceround.backend.interview.InterviewDtos.QuestionSession;
import com.traceround.backend.interview.InterviewDtos.SessionResponse;
import com.traceround.backend.problem.Problem;
import com.traceround.backend.problem.ProblemRepository;
import com.traceround.backend.user.AppUser;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class InterviewService {

    private final ProblemRepository problems;
    private final InterviewSessionRepository sessions;
    private final InterviewQuestionRepository questions;
    private final ChatMessageRepository messages;
    private final CurrentUserService currentUsers;
    private final InterviewAiClient ai;
    private final CodeExecutionClient codeExecution;

    public InterviewService(
        ProblemRepository problems,
        InterviewSessionRepository sessions,
        InterviewQuestionRepository questions,
        ChatMessageRepository messages,
        CurrentUserService currentUsers,
        InterviewAiClient ai,
        CodeExecutionClient codeExecution
    ) {
        this.problems = problems;
        this.sessions = sessions;
        this.questions = questions;
        this.messages = messages;
        this.currentUsers = currentUsers;
        this.ai = ai;
        this.codeExecution = codeExecution;
    }

    @Transactional(readOnly = true)
    public List<String> selectProblems(Set<String> categories, int count) {
        List<Problem> matching = new ArrayList<>(problems.findByCategoryIn(categories));
        Collections.shuffle(matching);
        if (matching.size() < count) {
            List<Problem> others = new ArrayList<>(problems.findAll());
            others.removeIf(problem -> categories.contains(problem.getCategory()));
            Collections.shuffle(others);
            matching.addAll(others);
        }
        return matching.stream().limit(count).map(Problem::getSlug).toList();
    }

    @Transactional
    public SessionResponse startSingle(String slug, Authentication authentication) {
        Problem problem = requireProblem(slug);
        return createSession(List.of(problem), Set.of(problem.getCategory()), false, authentication);
    }

    @Transactional
    public SessionResponse startCustom(
        List<String> slugs,
        Set<String> categories,
        int questionCount,
        Authentication authentication
    ) {
        if (slugs.size() != questionCount || new HashSet<>(slugs).size() != slugs.size()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "The selected problem list must contain the requested number of unique problems."
            );
        }
        List<Problem> selected = slugs.stream().map(this::requireProblem).toList();
        return createSession(selected, categories, true, authentication);
    }

    @Transactional
    public MessageResponse sendMessage(
        UUID sessionId,
        String problemSlug,
        String content,
        Authentication authentication
    ) {
        InterviewSession session = requireAccessibleSession(sessionId, authentication);
        ensureActive(session);
        InterviewQuestion question = requireQuestion(sessionId, problemSlug);
        ChatMessage userMessage = messages.save(new ChatMessage(question, "user", content.trim()));
        question.addMessage(userMessage);

        List<TranscriptMessage> transcript = question.getMessages().stream()
            .map(message -> new TranscriptMessage(message.getRole(), message.getContent()))
            .toList();
        String response = ai.respond(question.getProblem(), content, transcript);
        ChatMessage interviewer = messages.save(
            new ChatMessage(question, "interviewer", response)
        );
        question.addMessage(interviewer);
        return MessageResponse.from(interviewer);
    }

    @Transactional(readOnly = true)
    public CodeExecutionResult runCode(
        UUID sessionId,
        String problemSlug,
        String language,
        String code,
        Authentication authentication
    ) {
        InterviewSession session = requireAccessibleSession(sessionId, authentication);
        ensureActive(session);
        requireQuestion(sessionId, problemSlug);
        return codeExecution.execute(language, code);
    }

    @Transactional
    public InterviewSession prepareSubmission(
        UUID sessionId,
        List<InterviewDtos.AnswerRequest> answers,
        Authentication authentication
    ) {
        InterviewSession session = requireAccessibleSession(sessionId, authentication);
        ensureActive(session);
        Set<String> expectedSlugs = session.getQuestions().stream()
            .map(question -> question.getProblem().getSlug())
            .collect(java.util.stream.Collectors.toSet());
        Set<String> submittedSlugs = answers.stream()
            .map(InterviewDtos.AnswerRequest::problemSlug)
            .collect(java.util.stream.Collectors.toSet());
        if (
            answers.size() != session.getQuestions().size()
                || !submittedSlugs.equals(expectedSlugs)
        ) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Every interview question must be included exactly once."
            );
        }
        for (InterviewDtos.AnswerRequest answer : answers) {
            InterviewQuestion question = requireQuestion(sessionId, answer.problemSlug());
            question.complete(answer.language(), answer.code(), answer.endedBy());
        }
        session.markSubmitted();
        return session;
    }

    private SessionResponse createSession(
        List<Problem> selected,
        Set<String> categories,
        boolean custom,
        Authentication authentication
    ) {
        AppUser user = currentUsers.find(authentication).orElse(null);
        InterviewSession session = sessions.save(
            new InterviewSession(user, custom, categories)
        );
        List<QuestionSession> questionResponses = new ArrayList<>();

        for (int index = 0; index < selected.size(); index++) {
            Problem problem = selected.get(index);
            InterviewQuestion question = questions.save(
                new InterviewQuestion(session, problem, index + 1)
            );
            session.addQuestion(question);
            ChatMessage initial = messages.save(new ChatMessage(
                question,
                "interviewer",
                ai.initialMessage(problem, index + 1, selected.size())
            ));
            question.addMessage(initial);
            questionResponses.add(new QuestionSession(
                problem.getSlug(),
                List.of(MessageResponse.from(initial))
            ));
        }

        Durations durations =
            new Durations(session.getDiscussionSeconds(), session.getCodingSeconds());
        QuestionSession first = questionResponses.getFirst();
        return new SessionResponse(
            session.getId().toString(),
            selected.size() == 1 ? selected.getFirst().getSlug() : null,
            session.getStatus(),
            selected.size(),
            durations,
            selected.size() == 1 ? first.initialMessages() : List.of(),
            questionResponses
        );
    }

    private Problem requireProblem(String slug) {
        return problems.findById(slug).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found.")
        );
    }

    private InterviewQuestion requireQuestion(UUID sessionId, String problemSlug) {
        return questions.findBySessionIdAndProblemSlug(sessionId, problemSlug)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "The problem is not part of this interview."
                )
            );
    }

    private InterviewSession requireAccessibleSession(
        UUID id,
        Authentication authentication
    ) {
        InterviewSession session = sessions.findDetailedById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview session not found.")
        );
        if (session.getUser() != null) {
            Optional<AppUser> currentUser = currentUsers.find(authentication);
            if (
                currentUser.isEmpty()
                    || !currentUser.get().getId().equals(session.getUser().getId())
            ) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied.");
            }
        }
        return session;
    }

    private void ensureActive(InterviewSession session) {
        if ("completed".equals(session.getStatus())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "This interview has already been submitted."
            );
        }
    }
}
