package com.traceround.backend.code;

public interface CodeExecutionClient {

    CodeExecutionResult execute(String language, String code);

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
