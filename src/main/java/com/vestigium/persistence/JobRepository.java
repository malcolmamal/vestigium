package com.vestigium.persistence;

import com.vestigium.domain.Job;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JobRepository {

    private static final RowMapper<Job> JOB_ROW_MAPPER = new JobRowMapper();

    private final NamedParameterJdbcTemplate jdbc;

    public JobRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Job enqueue(String type, String entryId, String payloadJson) {
        var id = UUID.randomUUID().toString();
        var now = InstantSql.nowIso();
        var params = new HashMap<String, Object>();
        params.put("id", id);
        params.put("type", type);
        params.put("entryId", entryId);
        params.put("payloadJson", payloadJson);
        params.put("createdAt", now);
        jdbc.update(
                """
                INSERT INTO jobs (id, type, status, entry_id, payload_json, attempts, locked_at, finished_at, last_error, created_at)
                VALUES (:id, :type, 'PENDING', :entryId, :payloadJson, 0, NULL, NULL, NULL, :createdAt)
                """,
                params
        );
        return new Job(id, type, "PENDING", entryId, payloadJson, 0, null, null, null, now);
    }

    /**
     * Claims exactly one pending job by setting it to RUNNING in a single UPDATE. Returns claimed job if successful.
     * <p>
     * This is safe for a single worker and also works for multiple workers because the UPDATE changes only one row.
     */
    public Optional<Job> claimNextPending() {
        var now = InstantSql.nowIso();
        var rows = jdbc.query(
                """
                UPDATE jobs
                SET status = 'RUNNING', locked_at = :lockedAt, attempts = attempts + 1
                WHERE id = (
                  SELECT id
                  FROM jobs
                  WHERE status = 'PENDING'
                  ORDER BY created_at ASC
                  LIMIT 1
                )
                RETURNING id, type, status, entry_id, payload_json, attempts, locked_at, finished_at, last_error, created_at
                """,
                Map.of("lockedAt", now),
                JOB_ROW_MAPPER
        );
        if (rows.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(rows.getFirst());
    }

    public void markSucceeded(String jobId) {
        jdbc.update(
                "UPDATE jobs SET status = 'SUCCEEDED', finished_at = :finishedAt WHERE id = :id",
                Map.of("id", jobId, "finishedAt", InstantSql.nowIso())
        );
    }

    public void markFailed(String jobId, String errorMessage, boolean retry) {
        if (retry) {
            jdbc.update(
                    """
                    UPDATE jobs
                    SET status = 'PENDING', last_error = :err, locked_at = NULL
                    WHERE id = :id
                    """,
                    Map.of("id", jobId, "err", errorMessage)
            );
            return;
        }
        jdbc.update(
                """
                UPDATE jobs
                SET status = 'FAILED', last_error = :err, finished_at = :finishedAt
                WHERE id = :id
                """,
                Map.of("id", jobId, "err", errorMessage, "finishedAt", InstantSql.nowIso())
        );
    }

    public Optional<Job> getById(String id) {
        var rows = jdbc.query(
                """
                SELECT id, type, status, entry_id, payload_json, attempts, locked_at, finished_at, last_error, created_at
                FROM jobs
                WHERE id = :id
                """,
                Map.of("id", id),
                JOB_ROW_MAPPER
        );
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.getFirst());
    }

    public List<Job> list(String entryId, List<String> statuses, int limit) {
        var where = new ArrayList<String>();
        var params = new HashMap<String, Object>();

        if (entryId != null && !entryId.isBlank()) {
            where.add("entry_id = :entryId");
            params.put("entryId", entryId);
        }
        if (statuses != null && !statuses.isEmpty()) {
            where.add("status IN (:statuses)");
            params.put("statuses", statuses);
        }
        var whereSql = where.isEmpty() ? "" : "WHERE " + String.join(" AND ", where);
        params.put("limit", Math.max(limit, 1));

        return jdbc.query(
                """
                SELECT id, type, status, entry_id, payload_json, attempts, locked_at, finished_at, last_error, created_at
                FROM jobs
                %s
                ORDER BY created_at ASC
                LIMIT :limit
                """.formatted(whereSql),
                params,
                JOB_ROW_MAPPER
        );
    }

    /**
     * Cancels a job only if it's still pending. Returns number of affected rows (0 if not pending / not found).
     */
    public int cancelPending(String id) {
        return jdbc.update(
                """
                UPDATE jobs
                SET status = 'CANCELLED', finished_at = :finishedAt, locked_at = NULL, last_error = NULL
                WHERE id = :id AND status = 'PENDING'
                """,
                Map.of("id", id, "finishedAt", InstantSql.nowIso())
        );
    }

    /**
     * Deletes a job if it's not currently running. Returns number of deleted rows.
     */
    public int deleteIfNotRunning(String id) {
        return jdbc.update(
                "DELETE FROM jobs WHERE id = :id AND status != 'RUNNING'",
                Map.of("id", id)
        );
    }

    public List<Job> listForEntry(String entryId, int limit) {
        return jdbc.query(
                """
                SELECT id, type, status, entry_id, payload_json, attempts, locked_at, finished_at, last_error, created_at
                FROM jobs
                WHERE entry_id = :entryId
                ORDER BY created_at DESC
                LIMIT :limit
                """,
                Map.of("entryId", entryId, "limit", Math.max(limit, 1)),
                JOB_ROW_MAPPER
        );
    }

    private static final class JobRowMapper implements RowMapper<Job> {
        @Override
        public Job mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new Job(
                    rs.getString("id"),
                    rs.getString("type"),
                    rs.getString("status"),
                    rs.getString("entry_id"),
                    rs.getString("payload_json"),
                    rs.getInt("attempts"),
                    rs.getString("locked_at"),
                    rs.getString("finished_at"),
                    rs.getString("last_error"),
                    rs.getString("created_at")
            );
        }
    }
}


