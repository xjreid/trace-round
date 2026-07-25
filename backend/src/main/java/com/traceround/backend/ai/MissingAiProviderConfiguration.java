package com.traceround.backend.ai;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "traceround.ai.provider", havingValue = "gemini")
public class MissingAiProviderConfiguration {

    @Bean
    InterviewAiClient unconfiguredGeminiClient() {
        throw new IllegalStateException(
            "Gemini is selected but its adapter has not been enabled. "
                + "Use TRACEROUND_AI_PROVIDER=mock until an API key and model are configured."
        );
    }
}
