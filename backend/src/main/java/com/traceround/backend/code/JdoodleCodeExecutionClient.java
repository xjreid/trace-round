package com.traceround.backend.code;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.traceround.backend.problem.Problem;
import com.traceround.backend.problem.ProblemExecutionSpec;
import java.util.List;
import java.util.Set;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.JsonNode;

@Component
@ConditionalOnProperty(
    name = "traceround.code-execution.provider",
    havingValue = "jdoodle"
)
public class JdoodleCodeExecutionClient implements CodeExecutionClient {

    private static final Set<String> ALLOWED_LANGUAGES =
        Set.of("JavaScript", "Python", "Java", "C++");

    private final RestClient client;
    private final JdoodleProperties properties;
    private final CodeHarnessFactory harnesses;

    public JdoodleCodeExecutionClient(
        RestClient.Builder builder,
        JdoodleProperties properties,
        CodeHarnessFactory harnesses
    ) {
        this.client = builder.baseUrl(properties.getBaseUrl()).build();
        this.properties = properties;
        this.harnesses = harnesses;
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
            return error(
                "Unsupported language",
                language + " is not enabled by TraceRound.",
                testCases
            );
        }
        if (code == null || code.isBlank()) {
            return error(
                "No code to run",
                "Add a solution before running it.",
                testCases
            );
        }
        if (properties.getClientId().isBlank()
            || properties.getClientSecret().isBlank()) {
            return error(
                "JDoodle setup required",
                "Add JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET to the backend environment and restart Spring Boot.",
                testCases
            );
        }

        try {
            JdoodleProperties.Runtime runtime = properties.runtime(language);
            String source = harnesses.build(language, code, spec, testCases);
            JdoodleResponse response = client.post()
                .uri("/execute")
                .header(HttpHeaders.CONTENT_TYPE, "application/json")
                .body(new JdoodleRequest(
                    properties.getClientId(),
                    properties.getClientSecret(),
                    source,
                    "",
                    runtime.language(),
                    runtime.versionIndex(),
                    false
                ))
                .retrieve()
                .body(JdoodleResponse.class);
            if (response == null) {
                return error(
                    "JDoodle execution failed",
                    "JDoodle returned an empty response.",
                    testCases
                );
            }
            return map(response, testCases.size());
        } catch (RestClientException exception) {
            return error(
                "Code runner unavailable",
                "JDoodle could not be reached. Check the client ID, secret, API URL, and daily credit allowance.",
                testCases
            );
        } catch (IllegalArgumentException exception) {
            return error(
                "Invalid execution request",
                exception.getMessage(),
                testCases
            );
        }
    }

    private CodeExecutionResult map(JdoodleResponse response, int totalTests) {
        String output = limited(firstNonBlank(response.output(), response.error()));
        CodeExecutionResult harnessResult =
            CodeHarnessResultParser.parse(output, totalTests);
        if (harnessResult != null) return harnessResult;

        if (output.toLowerCase().contains("jdoodle - timeout")
            || output.toLowerCase().contains("timed out")) {
            return new CodeExecutionResult(
                "error",
                "Execution timed out",
                "The solution exceeded JDoodle's execution time limit.",
                0,
                totalTests
            );
        }
        if (compilationFailed(response.compilationStatus())) {
            return new CodeExecutionResult(
                "error",
                "Compilation failed",
                output,
                0,
                totalTests
            );
        }
        if (response.statusCode() != null && response.statusCode() != 200) {
            return new CodeExecutionResult(
                "error",
                "JDoodle execution failed",
                output,
                0,
                totalTests
            );
        }
        return new CodeExecutionResult(
            "error",
            Boolean.FALSE.equals(response.isExecutionSuccess())
                ? "Execution failed"
                : "No test result",
            output,
            0,
            totalTests
        );
    }

    private boolean compilationFailed(JsonNode status) {
        if (status == null || status.isNull()) return false;
        if (status.isNumber()) return status.intValue() != 0;
        if (status.isBoolean()) return !status.booleanValue();
        String text = status.asText().trim();
        return !text.isEmpty() && !"0".equals(text)
            && !"success".equalsIgnoreCase(text);
    }

    private String limited(String value) {
        if (value.length() <= properties.getMaxOutputCharacters()) return value;
        return value.substring(0, properties.getMaxOutputCharacters())
            + "\n[output truncated]";
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value.trim();
        }
        return "JDoodle returned no diagnostic output.";
    }

    private static CodeExecutionResult error(
        String summary,
        String output,
        List<TestCase> testCases
    ) {
        return new CodeExecutionResult(
            "error",
            summary,
            output,
            0,
            testCases.size()
        );
    }

    private record JdoodleRequest(
        String clientId,
        String clientSecret,
        String script,
        String stdin,
        String language,
        String versionIndex,
        boolean compileOnly
    ) {}

    private record JdoodleResponse(
        String output,
        String error,
        Integer statusCode,
        JsonNode compilationStatus,
        @JsonProperty("isExecutionSuccess") Boolean isExecutionSuccess
    ) {}
}
