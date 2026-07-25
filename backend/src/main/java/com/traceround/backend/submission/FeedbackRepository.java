package com.traceround.backend.submission;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {

    @EntityGraph(attributePaths = {
        "questions",
        "submission",
        "submission.user"
    })
    Optional<Feedback> findDetailedById(UUID id);

    @EntityGraph(attributePaths = {
        "questions",
        "submission",
        "submission.user"
    })
    Optional<Feedback> findBySubmissionId(UUID submissionId);
}
