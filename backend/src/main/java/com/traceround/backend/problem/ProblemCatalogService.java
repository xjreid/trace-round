package com.traceround.backend.problem;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Service
public class ProblemCatalogService {

    private final ProblemRepository problems;
    private final StarterCodeFactory starters;
    private final ObjectMapper objectMapper;

    public ProblemCatalogService(
        ProblemRepository problems,
        StarterCodeFactory starters,
        ObjectMapper objectMapper
    ) {
        this.problems = problems;
        this.starters = starters;
        this.objectMapper = objectMapper;
    }

    public List<ProblemSummary> all() {
        return problems.findByEnabledTrueOrderByTitleAsc().stream()
            .map(this::summary)
            .toList();
    }

    public ProblemSummary require(String slug) {
        return summary(requireEntity(slug));
    }

    public Problem requireEntity(String slug) {
        return problems.findBySlugAndEnabledTrue(slug).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found.")
        );
    }

    public ProblemExecutionSpec spec(Problem problem) {
        try {
            return objectMapper.readValue(
                problem.getExecutionSpec(),
                ProblemExecutionSpec.class
            );
        } catch (JacksonException exception) {
            throw new IllegalStateException(
                "Invalid execution specification for " + problem.getSlug(),
                exception
            );
        }
    }

    private ProblemSummary summary(Problem problem) {
        ProblemExecutionSpec spec = spec(problem);
        return new ProblemSummary(
            problem.getSlug(),
            problem.getTitle(),
            problem.getDifficulty(),
            problem.getCategory(),
            problem.getDescription(),
            spec.method(),
            starters.create(spec)
        );
    }

    public record ProblemSummary(
        String slug,
        String title,
        String difficulty,
        String category,
        String desc,
        String methodName,
        Map<String, String> starterCode
    ) {
    }
}
