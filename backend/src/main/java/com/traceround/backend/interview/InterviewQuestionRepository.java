package com.traceround.backend.interview;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, UUID> {
    Optional<InterviewQuestion> findBySessionIdAndProblemSlug(UUID sessionId, String problemSlug);
}
