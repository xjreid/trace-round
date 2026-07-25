package com.traceround.backend.submission;

import com.traceround.backend.user.AppUser;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubmissionRepository extends JpaRepository<Submission, UUID> {

    Page<Submission> findByUserOrderByInterviewDateDesc(AppUser user, Pageable pageable);

    long countByUser(AppUser user);

    @EntityGraph(attributePaths = {
        "session",
        "session.questions",
        "session.questions.problem",
        "user"
    })
    Optional<Submission> findDetailedById(UUID id);
}
