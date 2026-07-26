package com.traceround.backend.quota;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AiQuotaCounterRepository implements AiQuotaCounter {

    private final JdbcTemplate jdbc;

    public AiQuotaCounterRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public boolean consume(
        String bucketKey,
        Instant windowStart,
        int units,
        int limit
    ) {
        String sql = """
            insert into ai_quota_buckets (bucket_key, window_start, used_units)
            values (?, ?, ?)
            on conflict (bucket_key, window_start)
            do update set used_units =
                ai_quota_buckets.used_units + excluded.used_units
            where ai_quota_buckets.used_units + excluded.used_units <= ?
            returning used_units
            """;
        return !jdbc.query(
            sql,
            (resultSet, rowNumber) -> resultSet.getInt(1),
            bucketKey,
            Timestamp.from(windowStart),
            units,
            limit
        ).isEmpty();
    }

    @Override
    public boolean consumeQuestionMessage(UUID questionId, int limit) {
        String sql = """
            update interview_questions
            set ai_message_count = ai_message_count + 1
            where id = ?
              and ai_message_count < ?
            returning ai_message_count
            """;
        return !jdbc.query(
            sql,
            (resultSet, rowNumber) -> resultSet.getInt(1),
            questionId,
            limit
        ).isEmpty();
    }
}
