package com.traceround.backend.quota;

import java.time.Instant;

public class AiQuotaExceededException extends RuntimeException {

    private final String code;
    private final Instant retryAt;

    public AiQuotaExceededException(String code, String message, Instant retryAt) {
        super(message);
        this.code = code;
        this.retryAt = retryAt;
    }

    public String getCode() {
        return code;
    }

    public Instant getRetryAt() {
        return retryAt;
    }
}
