package com.traceround.backend.problem;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/problems")
public class ProblemController {

    private final ProblemRepository problems;

    public ProblemController(ProblemRepository problems) {
        this.problems = problems;
    }

    @GetMapping
    public List<ProblemResponse> all() {
        return problems.findAll().stream().map(ProblemResponse::from).toList();
    }

    @GetMapping("/{slug}")
    public ProblemResponse one(@PathVariable String slug) {
        return problems.findById(slug)
            .map(ProblemResponse::from)
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found.")
            );
    }

    public record ProblemResponse(
        String slug,
        String title,
        String difficulty,
        String category,
        String desc
    ) {
        static ProblemResponse from(Problem problem) {
            return new ProblemResponse(
                problem.getSlug(),
                problem.getTitle(),
                problem.getDifficulty(),
                problem.getCategory(),
                problem.getDescription()
            );
        }
    }
}
