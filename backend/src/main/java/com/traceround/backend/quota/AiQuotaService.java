package com.traceround.backend.quota;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AiQuotaService {

    private static final Duration HOUR = Duration.ofHours(1);
    private static final Duration MINUTE = Duration.ofMinutes(1);
    private static final ZoneId GEMINI_QUOTA_ZONE =
        ZoneId.of("America/Los_Angeles");

    private final AiQuotaCounter counters;
    private final AiQuotaProperties properties;
    private final Clock clock;

    @Autowired
    public AiQuotaService(
        AiQuotaCounter counters,
        AiQuotaProperties properties
    ) {
        this(counters, properties, Clock.systemUTC());
    }

    AiQuotaService(
        AiQuotaCounter counters,
        AiQuotaProperties properties,
        Clock clock
    ) {
        this.counters = counters;
        this.properties = properties;
        this.clock = clock;
    }

    public void reserveInterview(int questionCount, QuotaIdentity identity) {
        if (!properties.isEnabled()) {
            return;
        }

        Instant now = clock.instant();
        Instant hourStart = truncate(now, HOUR);
        Instant hourRetry = hourStart.plus(HOUR);
        consume(
            "ip:" + identity.ipHash() + ":interviews",
            hourStart,
            1,
            properties.getIpInterviewsPerHour(),
            "interview_rate_limit",
            "Too many interviews were started from this network. Please try again later.",
            hourRetry
        );
        if (identity.accountHash() != null) {
            consume(
                "account:" + identity.accountHash() + ":interviews",
                hourStart,
                1,
                properties.getAccountInterviewsPerHour(),
                "interview_rate_limit",
                "Too many interviews were started from this account. Please try again later.",
                hourRetry
            );
        }

        int reservedUnits =
            questionCount * (1 + properties.getMaxMessagesPerQuestion()) + 1;
        LocalDate quotaDate = now.atZone(GEMINI_QUOTA_ZONE).toLocalDate();
        Instant dayStart = quotaDate.atStartOfDay(GEMINI_QUOTA_ZONE).toInstant();
        Instant nextDayStart = quotaDate
            .plusDays(1)
            .atStartOfDay(GEMINI_QUOTA_ZONE)
            .toInstant();
        consume(
            "global:daily-ai",
            dayStart,
            reservedUnits,
            properties.getDailyUnits(),
            "daily_ai_quota",
            "TraceRound's AI interview capacity has been reached for today. Please try again after the daily reset.",
            nextDayStart
        );
    }

    public void consumeMessage(UUID questionId, QuotaIdentity identity) {
        if (!properties.isEnabled()) {
            return;
        }

        Instant now = clock.instant();
        if (!counters.consumeQuestionMessage(
            questionId,
            properties.getMaxMessagesPerQuestion()
        )) {
            throw new AiQuotaExceededException(
                "question_message_limit",
                "This question has reached its AI message limit. Continue to coding or submit the interview.",
                null
            );
        }

        Instant minuteStart = truncate(now, MINUTE);
        Instant minuteRetry = minuteStart.plus(MINUTE);
        consume(
            "ip:" + identity.ipHash() + ":messages",
            minuteStart,
            1,
            properties.getIpMessagesPerMinute(),
            "message_rate_limit",
            "Too many AI messages were sent from this network. Please wait a moment.",
            minuteRetry
        );
        if (identity.accountHash() != null) {
            consume(
                "account:" + identity.accountHash() + ":messages",
                minuteStart,
                1,
                properties.getAccountMessagesPerMinute(),
                "message_rate_limit",
                "Too many AI messages were sent from this account. Please wait a moment.",
                minuteRetry
            );
        }
    }

    private void consume(
        String key,
        Instant windowStart,
        int units,
        int limit,
        String code,
        String message,
        Instant retryAt
    ) {
        if (!counters.consume(key, windowStart, units, limit)) {
            throw new AiQuotaExceededException(code, message, retryAt);
        }
    }

    private Instant truncate(Instant instant, Duration window) {
        long seconds = window.toSeconds();
        return Instant.ofEpochSecond(
            Math.floorDiv(instant.getEpochSecond(), seconds) * seconds
        );
    }
}
