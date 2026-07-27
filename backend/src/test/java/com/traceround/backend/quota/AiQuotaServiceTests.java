package com.traceround.backend.quota;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AiQuotaServiceTests {

    private FakeCounter counters;
    private AiQuotaProperties properties;
    private final Map<String, Integer> usage = new HashMap<>();

    @BeforeEach
    void setUp() {
        counters = new FakeCounter();
        properties = new AiQuotaProperties();
        properties.setDailyUnits(8);
        properties.setMaxMessagesPerQuestion(2);
        properties.setIpInterviewsPerHour(100);
        properties.setAccountInterviewsPerHour(100);
        properties.setIpMessagesPerMinute(100);
        properties.setAccountMessagesPerMinute(100);
    }

    @Test
    void reservesACompleteInterviewAndRejectsOnlyTheNextStart() {
        AiQuotaService quotas = serviceAt("2026-07-26T12:30:00Z");
        QuotaIdentity identity = new QuotaIdentity("ip", null);

        quotas.reserveInterview(1, identity);
        quotas.reserveInterview(1, identity);

        AiQuotaExceededException exception = assertThrows(
            AiQuotaExceededException.class,
            () -> quotas.reserveInterview(1, identity)
        );
        assertEquals("daily_ai_quota", exception.getCode());
        assertEquals(
            Instant.parse("2026-07-27T07:00:00Z"),
            exception.getRetryAt()
        );
    }

    @Test
    void dailyCapacityResetsAtMidnightUtc() {
        QuotaIdentity identity = new QuotaIdentity("ip", null);
        serviceAt("2026-07-27T06:59:00Z").reserveInterview(1, identity);
        serviceAt("2026-07-27T07:01:00Z").reserveInterview(1, identity);

        assertEquals(4, usage.size());
    }

    @Test
    void concurrentStartsCannotExceedDailyCapacity() {
        AiQuotaService quotas = serviceAt("2026-07-26T12:30:00Z");
        QuotaIdentity identity = new QuotaIdentity("ip", null);
        AtomicInteger admitted = new AtomicInteger();

        IntStream.range(0, 20).parallel().forEach(ignored -> {
            try {
                quotas.reserveInterview(1, identity);
                admitted.incrementAndGet();
            } catch (AiQuotaExceededException expected) {
                // Expected once the two complete reservations fill the budget.
            }
        });

        assertEquals(2, admitted.get());
    }

    @Test
    void questionMessageLimitReturnsAStableErrorCode() {
        UUID questionId = UUID.randomUUID();
        AiQuotaService quotas = serviceAt("2026-07-26T12:30:00Z");
        QuotaIdentity identity = new QuotaIdentity("ip", "account");

        quotas.consumeMessage(questionId, identity);
        quotas.consumeMessage(questionId, identity);
        AiQuotaExceededException exception = assertThrows(
            AiQuotaExceededException.class,
            () -> quotas.consumeMessage(questionId, identity)
        );

        assertEquals("question_message_limit", exception.getCode());
    }

    private AiQuotaService serviceAt(String instant) {
        return new AiQuotaService(
            counters,
            properties,
            Clock.fixed(Instant.parse(instant), ZoneOffset.UTC)
        );
    }

    private class FakeCounter implements AiQuotaCounter {

        private final Map<UUID, Integer> questionUsage = new HashMap<>();

        @Override
        public synchronized boolean consume(
            String key,
            Instant start,
            int units,
            int limit
        ) {
            String composite = key + ":" + start;
            int next = usage.getOrDefault(composite, 0) + units;
            if (next > limit) {
                return false;
            }
            usage.put(composite, next);
            return true;
        }

        @Override
        public synchronized boolean consumeQuestionMessage(
            UUID questionId,
            int limit
        ) {
            int next = questionUsage.getOrDefault(questionId, 0) + 1;
            if (next > limit) {
                return false;
            }
            questionUsage.put(questionId, next);
            return true;
        }
    }
}
