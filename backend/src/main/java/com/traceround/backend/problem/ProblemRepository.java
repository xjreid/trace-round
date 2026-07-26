package com.traceround.backend.problem;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProblemRepository extends JpaRepository<Problem, String> {
    List<Problem> findByEnabledTrueOrderByTitleAsc();
    Optional<Problem> findBySlugAndEnabledTrue(String slug);
    List<Problem> findByCategoryInAndEnabledTrue(Collection<String> categories);
}
