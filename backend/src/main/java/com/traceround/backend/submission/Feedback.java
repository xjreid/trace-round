package com.traceround.backend.submission;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "feedback")
public class Feedback {

    @Id
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id", nullable = false, unique = true)
    private Submission submission;

    private String status;

    @Column(name = "overall_summary", columnDefinition = "text")
    private String overallSummary;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "feedback", orphanRemoval = true)
    @OrderBy("questionOrder asc")
    private List<QuestionFeedback> questions = new ArrayList<>();

    protected Feedback() {
    }

    public Feedback(Submission submission, String overallSummary) {
        this.id = UUID.randomUUID();
        this.submission = submission;
        this.status = "completed";
        this.overallSummary = overallSummary;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Submission getSubmission() {
        return submission;
    }

    public String getStatus() {
        return status;
    }

    public String getOverallSummary() {
        return overallSummary;
    }

    public List<QuestionFeedback> getQuestions() {
        return questions;
    }

    public void addQuestion(QuestionFeedback question) {
        questions.add(question);
    }
}
