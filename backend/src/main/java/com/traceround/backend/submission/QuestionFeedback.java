package com.traceround.backend.submission;

import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "question_feedback")
public class QuestionFeedback {

    @Id
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "feedback_id", nullable = false)
    private Feedback feedback;

    @Column(name = "problem_slug")
    private String problemSlug;
    private String title;

    @Column(columnDefinition = "text")
    private String summary;

    @Column(name = "communication_score")
    private int communicationScore;

    @Column(name = "approach_score")
    private int approachScore;

    @Column(name = "code_quality_score")
    private int codeQualityScore;

    @Column(name = "question_order")
    private int questionOrder;

    @ElementCollection
    @jakarta.persistence.CollectionTable(
        name = "question_feedback_recommendations",
        joinColumns = @JoinColumn(name = "question_feedback_id")
    )
    @OrderColumn(name = "recommendation_order")
    @Column(name = "recommendation")
    private List<String> recommendations = new ArrayList<>();

    protected QuestionFeedback() {
    }

    public QuestionFeedback(
        Feedback feedback,
        String problemSlug,
        String title,
        String summary,
        int communicationScore,
        int approachScore,
        int codeQualityScore,
        int questionOrder,
        List<String> recommendations
    ) {
        this.id = UUID.randomUUID();
        this.feedback = feedback;
        this.problemSlug = problemSlug;
        this.title = title;
        this.summary = summary;
        this.communicationScore = communicationScore;
        this.approachScore = approachScore;
        this.codeQualityScore = codeQualityScore;
        this.questionOrder = questionOrder;
        this.recommendations.addAll(recommendations);
    }

    public UUID getId() {
        return id;
    }

    public String getProblemSlug() {
        return problemSlug;
    }

    public String getTitle() {
        return title;
    }

    public String getSummary() {
        return summary;
    }

    public int getCommunicationScore() {
        return communicationScore;
    }

    public int getApproachScore() {
        return approachScore;
    }

    public int getCodeQualityScore() {
        return codeQualityScore;
    }

    public List<String> getRecommendations() {
        return recommendations;
    }
}
