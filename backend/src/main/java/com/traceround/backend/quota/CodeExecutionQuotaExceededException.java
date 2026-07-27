package com.traceround.backend.quota;

import java.time.Instant;

public class CodeExecutionQuotaExceededException extends RuntimeException {

    private final String code;
    private final Instant retryAt;

    public CodeExecutionQuotaExceededException(
        String code,
        String message,
        Instant retryAt
    ) {
        super(message);
        this.code = code;
        this.retryAt = retryAt;
    }

    public String getCode() { return code; }
    public Instant getRetryAt() { return retryAt; }
}
