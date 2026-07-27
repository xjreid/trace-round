package com.traceround.backend.quota;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CodeExecutionQuotaService {

    private static final Duration MINUTE = Duration.ofMinutes(1);

    private final AiQuotaCounter counters;
    private final CodeExecutionQuotaProperties properties;
    private final String provider;
    private final Clock clock;

    @Autowired
    public CodeExecutionQuotaService(
        AiQuotaCounter counters,
        CodeExecutionQuotaProperties properties,
        @Value("${traceround.code-execution.provider:local}") String provider
    ) {
        this(counters, properties, provider, Clock.systemUTC());
    }

    CodeExecutionQuotaService(
        AiQuotaCounter counters,
        CodeExecutionQuotaProperties properties,
        String provider,
        Clock clock
    ) {
        this.counters = counters;
        this.properties = properties;
        this.provider = provider;
        this.clock = clock;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void consume(QuotaIdentity identity) {
        if (!properties.isEnabled() || !isManagedProvider()) return;

        Instant now = clock.instant();
        Instant minuteStart = truncate(now, MINUTE);
        Instant minuteRetry = minuteStart.plus(MINUTE);
        take(
            "code:ip:" + identity.ipHash() + ":minute",
            minuteStart,
            properties.getIpSubmissionsPerMinute(),
            "code_execution_rate_limit",
            "Too many code runs were requested from this network. Please wait a moment.",
            minuteRetry
        );
        if (identity.accountHash() != null) {
            take(
                "code:account:" + identity.accountHash() + ":minute",
                minuteStart,
                properties.getAccountSubmissionsPerMinute(),
                "code_execution_rate_limit",
                "Too many code runs were requested from this account. Please wait a moment.",
                minuteRetry
            );
        }

        ZoneId zone = ZoneId.of(properties.getResetZone());
        LocalDate date = now.atZone(zone).toLocalDate();
        Instant dayStart = date.atStartOfDay(zone).toInstant();
        Instant nextDay = date.plusDays(1).atStartOfDay(zone).toInstant();
        take(
            "code:ip:" + identity.ipHash() + ":day",
            dayStart,
            properties.getIpSubmissionsPerDay(),
            "daily_code_execution_quota",
            "This network has reached its daily code-run limit.",
            nextDay
        );
        if (identity.accountHash() != null) {
            take(
                "code:account:" + identity.accountHash() + ":day",
                dayStart,
                properties.getAccountSubmissionsPerDay(),
                "daily_code_execution_quota",
                "This account has reached its daily code-run limit.",
                nextDay
            );
        }
        take(
            "code:global:day",
            dayStart,
            dailyLimit(),
            "daily_code_execution_quota",
            "TraceRound's code-running capacity has been reached for today.",
            nextDay
        );
    }

    private boolean isManagedProvider() {
        return "judge0".equalsIgnoreCase(provider)
            || "jdoodle".equalsIgnoreCase(provider);
    }

    private int dailyLimit() {
        return "jdoodle".equalsIgnoreCase(provider)
            ? properties.getJdoodleDailySubmissions()
            : properties.getDailySubmissions();
    }

    private void take(
        String key,
        Instant windowStart,
        int limit,
        String code,
        String message,
        Instant retryAt
    ) {
        if (!counters.consume(key, windowStart, 1, limit)) {
            throw new CodeExecutionQuotaExceededException(code, message, retryAt);
        }
    }

    private Instant truncate(Instant instant, Duration window) {
        long seconds = window.toSeconds();
        return Instant.ofEpochSecond(
            Math.floorDiv(instant.getEpochSecond(), seconds) * seconds
        );
    }
}
