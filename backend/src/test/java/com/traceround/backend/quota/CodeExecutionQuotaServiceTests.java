package com.traceround.backend.quota;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class CodeExecutionQuotaServiceTests {

    @Test
    void enforcesGlobalJudge0DailyLimit() {
        CodeExecutionQuotaProperties properties = properties();
        properties.setDailySubmissions(2);
        CodeExecutionQuotaService quotas = new CodeExecutionQuotaService(
            new FakeCounter(),
            properties,
            "judge0",
            Clock.fixed(Instant.parse("2026-07-27T12:00:00Z"), ZoneOffset.UTC)
        );
        QuotaIdentity first = new QuotaIdentity("first", null);
        QuotaIdentity second = new QuotaIdentity("second", null);
        QuotaIdentity third = new QuotaIdentity("third", null);

        quotas.consume(first);
        quotas.consume(second);
        CodeExecutionQuotaExceededException exception = assertThrows(
            CodeExecutionQuotaExceededException.class,
            () -> quotas.consume(third)
        );
        assertEquals("daily_code_execution_quota", exception.getCode());
        assertEquals(Instant.parse("2026-07-28T00:00:00Z"), exception.getRetryAt());
    }

    @Test
    void doesNotSpendManagedQuotaForLocalRunner() {
        CodeExecutionQuotaProperties properties = properties();
        properties.setDailySubmissions(1);
        CodeExecutionQuotaService quotas = new CodeExecutionQuotaService(
            new FakeCounter(),
            properties,
            "local",
            Clock.fixed(Instant.parse("2026-07-27T12:00:00Z"), ZoneOffset.UTC)
        );
        QuotaIdentity identity = new QuotaIdentity("same", null);
        assertDoesNotThrow(() -> {
            quotas.consume(identity);
            quotas.consume(identity);
        });
    }

    @Test
    void usesJdoodleSpecificDailyLimit() {
        CodeExecutionQuotaProperties properties = properties();
        properties.setDailySubmissions(100);
        properties.setJdoodleDailySubmissions(1);
        CodeExecutionQuotaService quotas = new CodeExecutionQuotaService(
            new FakeCounter(),
            properties,
            "jdoodle",
            Clock.fixed(Instant.parse("2026-07-27T12:00:00Z"), ZoneOffset.UTC)
        );

        quotas.consume(new QuotaIdentity("first", null));
        assertThrows(
            CodeExecutionQuotaExceededException.class,
            () -> quotas.consume(new QuotaIdentity("second", null))
        );
    }

    private CodeExecutionQuotaProperties properties() {
        CodeExecutionQuotaProperties properties = new CodeExecutionQuotaProperties();
        properties.setIpSubmissionsPerDay(100);
        properties.setAccountSubmissionsPerDay(100);
        properties.setIpSubmissionsPerMinute(100);
        properties.setAccountSubmissionsPerMinute(100);
        return properties;
    }

    private static class FakeCounter implements AiQuotaCounter {
        private final Map<String, Integer> values = new HashMap<>();

        @Override
        public boolean consume(
            String bucketKey,
            Instant windowStart,
            int units,
            int limit
        ) {
            String key = bucketKey + ":" + windowStart;
            int next = values.getOrDefault(key, 0) + units;
            if (next > limit) return false;
            values.put(key, next);
            return true;
        }

        @Override
        public boolean consumeQuestionMessage(UUID questionId, int limit) {
            return true;
        }
    }
}
