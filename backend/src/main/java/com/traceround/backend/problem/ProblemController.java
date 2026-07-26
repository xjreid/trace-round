package com.traceround.backend.problem;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/problems")
public class ProblemController {

    private final ProblemCatalogService problems;

    public ProblemController(ProblemCatalogService problems) {
        this.problems = problems;
    }

    @GetMapping
    public List<ProblemCatalogService.ProblemSummary> all() {
        return problems.all();
    }

    @GetMapping("/{slug}")
    public ProblemCatalogService.ProblemSummary one(@PathVariable String slug) {
        return problems.require(slug);
    }
}
