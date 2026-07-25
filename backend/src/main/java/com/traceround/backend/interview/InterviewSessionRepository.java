package com.traceround.backend.interview;

import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewSessionRepository extends JpaRepository<InterviewSession, UUID> {

    @EntityGraph(attributePaths = {"questions", "questions.problem", "user"})
    java.util.Optional<InterviewSession> findDetailedById(UUID id);
}
