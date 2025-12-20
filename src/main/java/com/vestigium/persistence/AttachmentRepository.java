package com.vestigium.persistence;

import com.vestigium.domain.Attachment;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AttachmentRepository {

    private static final RowMapper<Attachment> ATTACHMENT_ROW_MAPPER = new AttachmentRowMapper();

    private final NamedParameterJdbcTemplate jdbc;

    public AttachmentRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Attachment create(
            String entryId,
            String kind,
            String originalName,
            String mimeType,
            long sizeBytes,
            String storagePath
    ) {
        var id = UUID.randomUUID().toString();
        var createdAt = InstantSql.nowIso();
        jdbc.update(
                """
                INSERT INTO attachments (id, entry_id, kind, original_name, mime_type, size_bytes, storage_path, created_at)
                VALUES (:id, :entryId, :kind, :originalName, :mimeType, :sizeBytes, :storagePath, :createdAt)
                """,
                Map.of(
                        "id", id,
                        "entryId", entryId,
                        "kind", kind,
                        "originalName", originalName,
                        "mimeType", mimeType,
                        "sizeBytes", sizeBytes,
                        "storagePath", storagePath,
                        "createdAt", createdAt
                )
        );
        return new Attachment(id, entryId, kind, originalName, mimeType, sizeBytes, storagePath, createdAt);
    }

    public List<Attachment> listForEntry(String entryId) {
        return jdbc.query(
                """
                SELECT id, entry_id, kind, original_name, mime_type, size_bytes, storage_path, created_at
                FROM attachments
                WHERE entry_id = :entryId
                ORDER BY created_at ASC
                """,
                Map.of("entryId", entryId),
                ATTACHMENT_ROW_MAPPER
        );
    }

    public java.util.Optional<Attachment> getById(String id) {
        var rows = jdbc.query(
                """
                SELECT id, entry_id, kind, original_name, mime_type, size_bytes, storage_path, created_at
                FROM attachments
                WHERE id = :id
                """,
                Map.of("id", id),
                ATTACHMENT_ROW_MAPPER
        );
        return rows.isEmpty() ? java.util.Optional.empty() : java.util.Optional.of(rows.getFirst());
    }

    private static final class AttachmentRowMapper implements RowMapper<Attachment> {
        @Override
        public Attachment mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new Attachment(
                    rs.getString("id"),
                    rs.getString("entry_id"),
                    rs.getString("kind"),
                    rs.getString("original_name"),
                    rs.getString("mime_type"),
                    rs.getLong("size_bytes"),
                    rs.getString("storage_path"),
                    rs.getString("created_at")
            );
        }
    }
}


