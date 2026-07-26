package com.traceround.backend.ai;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.ObjectMapper;

class GeminiProviderConfigurationTests {

    private final ApplicationContextRunner contextRunner =
        new ApplicationContextRunner()
            .withBean(ObjectMapper.class, ObjectMapper::new)
            .withBean(RestClient.Builder.class, RestClient::builder)
            .withUserConfiguration(
                InterviewPromptFactory.class,
                StructuredFeedbackParser.class,
                MockInterviewAiClient.class,
                GeminiInterviewAiClient.class
            );

    @Test
    void selectsGeminiThroughTheSharedInterviewAiContract() {
        contextRunner
            .withPropertyValues(
                "traceround.ai.provider=gemini",
                "traceround.ai.api-key=test-key",
                "traceround.ai.model=gemini-test-model",
                "traceround.ai.timeout-seconds=5",
                "traceround.ai.gemini.base-url=https://gemini.test"
            )
            .run(context -> {
                assertThat(context).hasNotFailed();
                assertThat(context).hasSingleBean(InterviewAiClient.class);
                assertThat(context.getBean(InterviewAiClient.class))
                    .isInstanceOf(GeminiInterviewAiClient.class);
            });
    }

    @Test
    void refusesToStartGeminiWithoutASecret() {
        contextRunner
            .withPropertyValues(
                "traceround.ai.provider=gemini",
                "traceround.ai.api-key=",
                "traceround.ai.model=gemini-test-model",
                "traceround.ai.timeout-seconds=5",
                "traceround.ai.gemini.base-url=https://gemini.test"
            )
            .run(context ->
                assertThat(context.getStartupFailure())
                    .hasRootCauseInstanceOf(IllegalStateException.class)
                    .hasStackTraceContaining(
                        "TRACEROUND_AI_API_KEY is empty"
                    )
            );
    }
}
