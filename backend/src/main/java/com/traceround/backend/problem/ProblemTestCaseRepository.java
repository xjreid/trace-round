package com.traceround.backend.problem;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProblemTestCaseRepository
    extends JpaRepository<ProblemTestCase, UUID> {

    List<ProblemTestCase> findByProblemSlugOrderByTestOrder(String problemSlug);
}
