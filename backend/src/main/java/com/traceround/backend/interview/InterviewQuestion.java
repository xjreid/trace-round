package com.traceround.backend.interview;

import com.traceround.backend.problem.Problem;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "interview_questions")
public class InterviewQuestion {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "problem_slug", nullable = false)
    private Problem problem;

    @Column(name = "question_order", nullable = false)
    private int questionOrder;

    private String language;

    @Column(name = "source_code")
    private String sourceCode;

    @Column(name = "ended_by")
    private String endedBy;

    @OneToMany(mappedBy = "question", orphanRemoval = true)
    @OrderBy("createdAt asc")
    private List<ChatMessage> messages = new ArrayList<>();

    protected InterviewQuestion() {
    }

    public InterviewQuestion(InterviewSession session, Problem problem, int questionOrder) {
        this.id = UUID.randomUUID();
        this.session = session;
        this.problem = problem;
        this.questionOrder = questionOrder;
    }

    public UUID getId() {
        return id;
    }

    public InterviewSession getSession() {
        return session;
    }

    public Problem getProblem() {
        return problem;
    }

    public int getQuestionOrder() {
        return questionOrder;
    }

    public List<ChatMessage> getMessages() {
        return messages;
    }

    public void addMessage(ChatMessage message) {
        messages.add(message);
    }

    public void complete(String language, String sourceCode, String endedBy) {
        this.language = language;
        this.sourceCode = sourceCode;
        this.endedBy = endedBy;
    }

    public String getLanguage() {
        return language;
    }

    public String getSourceCode() {
        return sourceCode;
    }
}
