package com.traceround.backend.code;

import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class HttpCodeExecutionClient implements CodeExecutionClient {

    private static final Set<String> ALLOWED_LANGUAGES =
        Set.of("JavaScript", "Python", "Java", "C++");

    private final RestClient restClient;

    public HttpCodeExecutionClient(
        RestClient.Builder builder,
        @Value("${traceround.code-runner.base-url}") String baseUrl
    ) {
        this.restClient = builder.baseUrl(baseUrl).build();
    }

    @Override
    public CodeExecutionResult execute(String language, String code) {
        if (!ALLOWED_LANGUAGES.contains(language)) {
            return new CodeExecutionResult(
                "error",
                "Unsupported language",
                language + " is not enabled by TraceRound.",
                0,
                0
            );
        }
        try {
            CodeExecutionResult result = restClient.post()
                .uri("/execute")
                .body(Map.of("language", language, "code", code))
                .retrieve()
                .body(CodeExecutionResult.class);
            return result == null ? CodeExecutionResult.unavailable() : result;
        } catch (RestClientException exception) {
            return CodeExecutionResult.unavailable();
        }
    }
}
