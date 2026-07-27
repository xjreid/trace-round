package com.traceround.backend.code;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.traceround.backend.problem.Problem;
import com.traceround.backend.problem.ProblemExecutionSpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Set;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
@ConditionalOnProperty(
    name = "traceround.code-execution.provider",
    havingValue = "judge0"
)
public class Judge0CodeExecutionClient implements CodeExecutionClient {

    private static final Set<String> ALLOWED_LANGUAGES =
        Set.of("JavaScript", "Python", "Java", "C++");

    private final RestClient client;
    private final Judge0Properties properties;
    private final CodeHarnessFactory harnesses;

    public Judge0CodeExecutionClient(
        RestClient.Builder builder,
        Judge0Properties properties,
        CodeHarnessFactory harnesses
    ) {
        this.properties = properties;
        this.harnesses = harnesses;
        RestClient.Builder configured = builder.baseUrl(properties.getBaseUrl());
        String mode = properties.getAuthMode().toLowerCase();
        if ("rapidapi".equals(mode)) {
            if (!properties.getApiKey().isBlank()) {
                configured.defaultHeader("X-RapidAPI-Key", properties.getApiKey());
            }
            configured.defaultHeader("X-RapidAPI-Host", properties.getApiHost());
        } else if ("token".equals(mode)) {
            if (!properties.getApiKey().isBlank()) {
                configured.defaultHeader("X-Auth-Token", properties.getApiKey());
            }
        } else if (!"none".equals(mode)) {
            throw new IllegalArgumentException(
                "JUDGE0_AUTH_MODE must be rapidapi, token, or none."
            );
        }
        this.client = configured.build();
    }

    @Override
    public CodeExecutionResult execute(
        Problem problem,
        ProblemExecutionSpec spec,
        List<TestCase> testCases,
        String language,
        String code
    ) {
        if (!ALLOWED_LANGUAGES.contains(language)) {
            return error("Unsupported language", language + " is not enabled by TraceRound.", testCases);
        }
        if (code == null || code.isBlank()) {
            return error("No code to run", "Add a solution before running it.", testCases);
        }
        if (properties.getApiKey().isBlank()
            && !"none".equalsIgnoreCase(properties.getAuthMode())) {
            return error(
                "Judge0 setup required",
                "Add JUDGE0_API_KEY to the backend environment and restart Spring Boot.",
                testCases
            );
        }

        try {
            String source = harnesses.build(language, code, spec, testCases);
            SubmissionCreated created = client.post()
                .uri("/submissions?base64_encoded=true&wait=false")
                .header(HttpHeaders.CONTENT_TYPE, "application/json")
                .body(new CreateSubmission(
                    encode(source),
                    properties.languageId(language),
                    properties.getCpuTimeLimitSeconds()
                ))
                .retrieve()
                .body(SubmissionCreated.class);
            if (created == null || created.token() == null || created.token().isBlank()) {
                return error("Judge0 submission failed", "Judge0 did not return a submission token.", testCases);
            }
            return await(created.token(), testCases.size());
        } catch (RestClientException exception) {
            return error(
                "Code runner unavailable",
                "Judge0 could not be reached. Check the API URL, key, host, and plan limits.",
                testCases
            );
        } catch (IllegalArgumentException exception) {
            return error("Invalid execution request", exception.getMessage(), testCases);
        }
    }

    private CodeExecutionResult await(String token, int totalTests) {
        Instant deadline = Instant.now().plusSeconds(properties.getPollTimeoutSeconds());
        while (Instant.now().isBefore(deadline)) {
            Judge0Submission submission = client.get()
                .uri(
                    "/submissions/{token}?base64_encoded=true"
                        + "&fields=stdout,stderr,compile_output,message,status",
                    token
                )
                .retrieve()
                .body(Judge0Submission.class);
            if (submission != null && submission.status() != null
                && submission.status().id() > 2) {
                return map(submission, totalTests);
            }
            pause();
        }
        return new CodeExecutionResult(
            "error",
            "Judge0 response timed out",
            "Judge0 did not finish the submission before TraceRound's polling limit.",
            0,
            totalTests
        );
    }

    private CodeExecutionResult map(Judge0Submission submission, int totalTests) {
        String stdout = decode(submission.stdout());
        String stderr = decode(submission.stderr());
        String compileOutput = decode(submission.compileOutput());
        String message = decode(submission.message());
        CodeExecutionResult harnessResult = CodeHarnessResultParser.parse(
            stdout + "\n" + stderr,
            totalTests
        );
        if (harnessResult != null) return harnessResult;

        int statusId = submission.status().id();
        String description = submission.status().description();
        if (statusId == 6) {
            return new CodeExecutionResult(
                "error", "Compilation failed",
                firstNonBlank(compileOutput, stderr, description), 0, totalTests
            );
        }
        if (statusId == 5) {
            return new CodeExecutionResult(
                "error", "Execution timed out",
                "The solution exceeded the execution time limit.", 0, totalTests
            );
        }
        return new CodeExecutionResult(
            "error",
            "Execution failed",
            limited(firstNonBlank(stderr, compileOutput, message, stdout, description)),
            0,
            totalTests
        );
    }

    private void pause() {
        try {
            Thread.sleep(Duration.ofMillis(properties.getPollIntervalMillis()));
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while waiting for Judge0.", exception);
        }
    }

    private String limited(String value) {
        if (value.length() <= properties.getMaxOutputCharacters()) return value;
        return value.substring(0, properties.getMaxOutputCharacters()) + "\n[output truncated]";
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value.trim();
        }
        return "Judge0 returned no diagnostic output.";
    }

    private static String encode(String value) {
        return Base64.getEncoder().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private static String decode(String value) {
        if (value == null || value.isBlank()) return "";
        try {
            return new String(Base64.getDecoder().decode(value), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException exception) {
            return value;
        }
    }

    private static CodeExecutionResult error(
        String summary,
        String output,
        List<TestCase> testCases
    ) {
        return new CodeExecutionResult("error", summary, output, 0, testCases.size());
    }

    private record CreateSubmission(
        @JsonProperty("source_code") String sourceCode,
        @JsonProperty("language_id") int languageId,
        @JsonProperty("cpu_time_limit") int cpuTimeLimit
    ) {}

    private record SubmissionCreated(String token) {}
    private record Judge0Status(int id, String description) {}
    private record Judge0Submission(
        String stdout,
        String stderr,
        @JsonProperty("compile_output") String compileOutput,
        String message,
        Judge0Status status
    ) {}
}
