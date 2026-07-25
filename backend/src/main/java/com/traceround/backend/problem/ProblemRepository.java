package com.traceround.backend.problem;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProblemRepository extends JpaRepository<Problem, String> {
    List<Problem> findByCategoryIn(Collection<String> categories);
}
