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
    private final org.springframework.context.ApplicationEventPublisher events;

    public JobRepository(NamedParameterJdbcTemplate jdbc, org.springframework.context.ApplicationEventPublisher events) {
        this.jdbc = jdbc;
        this.events = events;
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
                INSERT INTO jobs (id, type, status, entry_id, payload_json, attempts, locked_at, finished_at, last_error, last_response, created_at)
                VALUES (:id, :type, 'PENDING', :entryId, :payloadJson, 0, NULL, NULL, NULL, NULL, :createdAt)
                """,
                params
        );
        var job = new Job(id, type, "PENDING", entryId, payloadJson, 0, null, null, null, null, now);
        events.publishEvent(new com.vestigium.events.JobUpdatedEvent(job));
        return job;
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
                RETURNING id, type, status, entry_id, payload_json, attempts, locked_at, finished_at, last_error, last_response, created_at
                """,
                Map.of("lockedAt", now),
                JOB_ROW_MAPPER
        );
        if (rows.isEmpty()) {
            return Optional.empty();
        }
        var job = rows.getFirst();
        events.publishEvent(new com.vestigium.events.JobUpdatedEvent(job));
        return Optional.of(job);
    }

    public void markSucceeded(String jobId) {
        markSucceeded(jobId, null);
    }

    public void markSucceeded(String jobId, String lastResponse) {
        var finishedAt = InstantSql.nowIso();
        var jobOpt = getById(jobId);
        if (jobOpt.isEmpty()) return;
        var job = jobOpt.get();

        var params = new HashMap<String, Object>();
        params.put("id", jobId);
        params.put("finishedAt", finishedAt);
        params.put("lastResponse", lastResponse);

        jdbc.update(
                "UPDATE jobs SET status = 'SUCCEEDED', finished_at = :finishedAt, last_response = :lastResponse WHERE id = :id",
                params
        );

        // Cleanup: remove older failed jobs of the same type for this entry.
        jdbc.update(
                "DELETE FROM jobs WHERE entry_id = :entryId AND type = :type AND status = 'FAILED' AND id != :id",
                Map.of("entryId", job.entryId(), "type", job.type(), "id", jobId)
        );

        getById(jobId).ifPresent(j -> events.publishEvent(new com.vestigium.events.JobUpdatedEvent(j)));
    }

    public void markFailed(String jobId, String errorMessage, boolean retry) {
        markFailed(jobId, errorMessage, null, retry);
    }

    public void markFailed(String jobId, String errorMessage, String lastResponse, boolean retry) {
        var params = new HashMap<String, Object>();
        params.put("id", jobId);
        params.put("err", errorMessage);
        params.put("lastResponse", lastResponse);

        if (retry) {
            jdbc.update(
                    """
                    UPDATE jobs
                    SET status = 'PENDING', last_error = :err, last_response = :lastResponse, locked_at = NULL
                    WHERE id = :id
                    """,
                    params
            );
        } else {
            params.put("finishedAt", InstantSql.nowIso());
            jdbc.update(
                    """
                    UPDATE jobs
                    SET status = 'FAILED', last_error = :err, last_response = :lastResponse, finished_at = :finishedAt
                    WHERE id = :id
                    """,
                    params
            );
        }
        getById(jobId).ifPresent(j -> events.publishEvent(new com.vestigium.events.JobUpdatedEvent(j)));
    }

    public Optional<Job> getById(String id) {
        var rows = jdbc.query(
                """
                SELECT id, type, status, entry_id, payload_json, attempts, locked_at, finished_at, last_error, last_response, created_at
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
                SELECT id, type, status, entry_id, payload_json, attempts, locked_at, finished_at, last_error, last_response, created_at
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

    /**
     * Retries a job if it's FAILED or CANCELLED. Returns number of affected rows.
     */
    public int retry(String id) {
        var updated = jdbc.update(
                """
                UPDATE jobs
                SET status = 'PENDING', finished_at = NULL, locked_at = NULL, attempts = 0
                WHERE id = :id AND status IN ('FAILED', 'CANCELLED')
                """,
                Map.of("id", id)
        );
        if (updated > 0) {
            getById(id).ifPresent(j -> events.publishEvent(new com.vestigium.events.JobUpdatedEvent(j)));
        }
        return updated;
    }

    /**
     * Checks which entry IDs have a latest job of any type in FAILED status.
     * Returns a set of entry IDs that meet this criteria.
     */
    public java.util.Set<String> findEntryIdsWithFailedLatestJob(List<String> entryIds) {
        if (entryIds == null || entryIds.isEmpty()) {
            return java.util.Collections.emptySet();
        }

        return new java.util.HashSet<>(jdbc.query(
                """
                SELECT entry_id
                FROM (
                  SELECT entry_id, type, status, MAX(created_at)
                  FROM jobs
                  WHERE entry_id IN (:entryIds)
                  GROUP BY entry_id, type
                )
                WHERE status = 'FAILED'
                """,
                Map.of("entryIds", entryIds),
                (rs, rowNum) -> rs.getString("entry_id")
        ));
    }

    public List<Job> listForEntry(String entryId, int limit) {
        return jdbc.query(
                """
                SELECT id, type, status, entry_id, payload_json, attempts, locked_at, finished_at, last_error, last_response, created_at
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
                    rs.getString("last_response"),
                    rs.getString("created_at")
            );
        }
    }
}


