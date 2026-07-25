package com.traceround.backend.interview;

import com.traceround.backend.user.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "interview_sessions")
public class InterviewSession {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private AppUser user;

    private String status;

    @Column(name = "custom_session", nullable = false)
    private boolean customSession;

    @Column(name = "discussion_seconds", nullable = false)
    private int discussionSeconds;

    @Column(name = "coding_seconds", nullable = false)
    private int codingSeconds;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @ElementCollection
    @jakarta.persistence.CollectionTable(
        name = "interview_session_categories",
        joinColumns = @JoinColumn(name = "session_id")
    )
    @Column(name = "category")
    private Set<String> categories = new LinkedHashSet<>();

    @OneToMany(mappedBy = "session", orphanRemoval = true)
    @OrderBy("questionOrder asc")
    private List<InterviewQuestion> questions = new ArrayList<>();

    protected InterviewSession() {
    }

    public InterviewSession(AppUser user, boolean customSession, Set<String> categories) {
        this.id = UUID.randomUUID();
        this.user = user;
        this.status = "discussion";
        this.customSession = customSession;
        this.discussionSeconds = 5 * 60;
        this.codingSeconds = 20 * 60;
        this.createdAt = Instant.now();
        this.categories.addAll(categories);
    }

    public UUID getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public String getStatus() {
        return status;
    }

    public int getDiscussionSeconds() {
        return discussionSeconds;
    }

    public int getCodingSeconds() {
        return codingSeconds;
    }

    public List<InterviewQuestion> getQuestions() {
        return questions;
    }

    public Set<String> getCategories() {
        return categories;
    }

    public void addQuestion(InterviewQuestion question) {
        questions.add(question);
    }

    public void markSubmitted() {
        status = "completed";
        submittedAt = Instant.now();
    }
}
