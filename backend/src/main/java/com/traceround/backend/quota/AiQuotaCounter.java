package com.traceround.backend.quota;

import java.time.Instant;
import java.util.UUID;

public interface AiQuotaCounter {

    boolean consume(String bucketKey, Instant windowStart, int units, int limit);

    boolean consumeQuestionMessage(UUID questionId, int limit);
}
