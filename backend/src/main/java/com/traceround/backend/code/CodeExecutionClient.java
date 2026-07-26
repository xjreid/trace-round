package com.traceround.backend.code;

import com.traceround.backend.problem.Problem;
import com.traceround.backend.problem.ProblemExecutionSpec;
import java.util.List;

public interface CodeExecutionClient {

    CodeExecutionResult execute(
        Problem problem,
        ProblemExecutionSpec spec,
        List<TestCase> testCases,
        String language,
        String code
    );

    record TestCase(int order, String inputsJson, String expectedJson) {
    }

    record CodeExecutionResult(
        String status,
        String summary,
        String output,
        int passedTests,
        int totalTests
    ) {
        public static CodeExecutionResult unavailable() {
            return new CodeExecutionResult(
                "error",
                "Code runner unavailable",
                "Start the local code-runner with docker compose up -d code-runner.",
                0,
                0
            );
        }
    }
}
