package com.vestigium.persistence;

import com.vestigium.domain.Entry;
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
public class EntryRepository {

    private static final RowMapper<EntryRow> ENTRY_ROW_MAPPER = new EntryRowMapper();

    private final NamedParameterJdbcTemplate jdbc;

    public EntryRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Entry create(String url, String title, String description, boolean important) {
        var id = UUID.randomUUID().toString();
        var now = InstantSql.nowIso();
        var params = new HashMap<String, Object>();
        params.put("id", id);
        params.put("url", url);
        params.put("title", title);
        params.put("description", description);
        params.put("important", important ? 1 : 0);
        params.put("createdAt", now);
        params.put("updatedAt", now);
        jdbc.update(
                """
                INSERT INTO entries (id, url, title, description, thumbnail_path, visited_at, important, created_at, updated_at)
                VALUES (:id, :url, :title, :description, NULL, NULL, :important, :createdAt, :updatedAt)
                """,
                params
        );
        return getById(id).orElseThrow();
    }

    public Entry createWithTimestamps(String url, String title, String description, boolean important, String createdAt, String updatedAt) {
        var id = UUID.randomUUID().toString();
        var now = InstantSql.nowIso();
        var params = new HashMap<String, Object>();
        params.put("id", id);
        params.put("url", url);
        params.put("title", title);
        params.put("description", description);
        params.put("important", important ? 1 : 0);
        params.put("createdAt", createdAt == null || createdAt.isBlank() ? now : createdAt.trim());
        params.put("updatedAt", updatedAt == null || updatedAt.isBlank() ? now : updatedAt.trim());
        jdbc.update(
                """
                INSERT INTO entries (id, url, title, description, thumbnail_path, visited_at, important, created_at, updated_at)
                VALUES (:id, :url, :title, :description, NULL, NULL, :important, :createdAt, :updatedAt)
                """,
                params
        );
        return getById(id).orElseThrow();
    }

    public Optional<Entry> getById(String id) {
        var rows = jdbc.query(
                """
                SELECT id, url, title, description, thumbnail_path, thumbnail_large_path, visited_at, important, created_at, updated_at
                FROM entries
                WHERE id = :id
                """,
                Map.of("id", id),
                ENTRY_ROW_MAPPER
        );
        if (rows.isEmpty()) {
            return Optional.empty();
        }

        var row = rows.getFirst();
        var tags = getTagsForEntry(id);
        return Optional.of(row.toEntry(tags));
    }

    public Optional<Entry> getByUrl(String url) {
        var rows = jdbc.query(
                """
                SELECT id, url, title, description, thumbnail_path, thumbnail_large_path, visited_at, important, created_at, updated_at
                FROM entries
                WHERE url = :url
                """,
                Map.of("url", url),
                ENTRY_ROW_MAPPER
        );
        if (rows.isEmpty()) {
            return Optional.empty();
        }
        var row = rows.getFirst();
        var tags = getTagsForEntry(row.id());
        return Optional.of(row.toEntry(tags));
    }

    public List<Entry> listAllForExport() {
        var rows = jdbc.query(
                """
                SELECT id, url, title, description, thumbnail_path, thumbnail_large_path, visited_at, important, created_at, updated_at
                FROM entries
                ORDER BY created_at ASC
                """,
                Map.of(),
                ENTRY_ROW_MAPPER
        );
        var out = new ArrayList<Entry>(rows.size());
        for (var row : rows) {
            out.add(row.toEntry(getTagsForEntry(row.id())));
        }
        return out;
    }

    public List<Entry> search(
            String q,
            List<String> tags,
            Boolean important,
            Boolean visited,
            String addedFrom,
            String addedTo,
            String sort,
            int page,
            int pageSize
    ) {
        var where = new ArrayList<String>();
        var params = new java.util.HashMap<String, Object>();

        if (q != null && !q.isBlank()) {
            where.add("(LOWER(COALESCE(title,'')) LIKE :q OR LOWER(COALESCE(description,'')) LIKE :q)");
            params.put("q", "%" + q.toLowerCase() + "%");
        }
        if (important != null) {
            where.add("important = :important");
            params.put("important", important ? 1 : 0);
        }
        if (visited != null) {
            where.add(visited ? "visited_at IS NOT NULL" : "visited_at IS NULL");
        }
        if (addedFrom != null && !addedFrom.isBlank()) {
            where.add("created_at >= :addedFrom");
            params.put("addedFrom", addedFrom.trim());
        }
        if (addedTo != null && !addedTo.isBlank()) {
            where.add("created_at <= :addedTo");
            params.put("addedTo", addedTo.trim());
        }

        // Tag filtering: require entry to have all requested tags.
        if (tags != null && !tags.isEmpty()) {
            where.add(
                    """
                    id IN (
                      SELECT et.entry_id
                      FROM entry_tags et
                      JOIN tags t ON t.id = et.tag_id
                      WHERE t.name IN (:tagNames)
                      GROUP BY et.entry_id
                      HAVING COUNT(DISTINCT t.name) = :tagCount
                    )
                    """
            );
            params.put("tagNames", tags);
            params.put("tagCount", tags.size());
        }

        var whereSql = where.isEmpty() ? "" : "WHERE " + String.join(" AND ", where);
        var offset = Math.max(page, 0) * Math.max(pageSize, 1);
        params.put("limit", pageSize);
        params.put("offset", offset);

        var orderBy = "updated_at DESC";
        if (sort != null && !sort.isBlank()) {
            orderBy = switch (sort.trim().toLowerCase()) {
                case "added_asc" -> "created_at ASC";
                case "added_desc" -> "created_at DESC";
                case "updated_asc" -> "updated_at ASC";
                case "updated_desc" -> "updated_at DESC";
                default -> "updated_at DESC";
            };
        }

        var rows = jdbc.query(
                """
                SELECT id, url, title, description, thumbnail_path, thumbnail_large_path, visited_at, important, created_at, updated_at
                FROM entries
                %s
                ORDER BY %s
                LIMIT :limit OFFSET :offset
                """.formatted(whereSql, orderBy),
                params,
                ENTRY_ROW_MAPPER
        );

        var out = new ArrayList<Entry>(rows.size());
        for (var row : rows) {
            out.add(row.toEntry(getTagsForEntry(row.id())));
        }
        return out;
    }

    public void updateCore(String id, String title, String description, Boolean important) {
        var sets = new ArrayList<String>();
        var params = new java.util.HashMap<String, Object>();
        params.put("id", id);

        if (title != null) {
            sets.add("title = :title");
            params.put("title", title);
        }
        if (description != null) {
            sets.add("description = :description");
            params.put("description", description);
        }
        if (important != null) {
            sets.add("important = :important");
            params.put("important", important ? 1 : 0);
        }
        sets.add("updated_at = :updatedAt");
        params.put("updatedAt", InstantSql.nowIso());

        jdbc.update(
                "UPDATE entries SET " + String.join(", ", sets) + " WHERE id = :id",
                params
        );
    }

    public void setVisitedNow(String id) {
        jdbc.update(
                "UPDATE entries SET visited_at = :visitedAt, updated_at = :updatedAt WHERE id = :id",
                Map.of(
                        "id", id,
                        "visitedAt", InstantSql.nowIso(),
                        "updatedAt", InstantSql.nowIso()
                )
        );
    }

    public void updateThumbnailPath(String id, String thumbnailPath) {
        jdbc.update(
                "UPDATE entries SET thumbnail_path = :thumbnailPath, updated_at = :updatedAt WHERE id = :id",
                Map.of(
                        "id", id,
                        "thumbnailPath", thumbnailPath,
                        "updatedAt", InstantSql.nowIso()
                )
        );
    }

    public void updateThumbnailPaths(String id, String thumbnailPath, String thumbnailLargePath) {
        var sets = new ArrayList<String>();
        var params = new java.util.HashMap<String, Object>();
        params.put("id", id);

        if (thumbnailPath != null) {
            sets.add("thumbnail_path = :thumbnailPath");
            params.put("thumbnailPath", thumbnailPath);
        }
        if (thumbnailLargePath != null) {
            sets.add("thumbnail_large_path = :thumbnailLargePath");
            params.put("thumbnailLargePath", thumbnailLargePath);
        }
        sets.add("updated_at = :updatedAt");
        params.put("updatedAt", InstantSql.nowIso());

        jdbc.update(
                "UPDATE entries SET " + String.join(", ", sets) + " WHERE id = :id",
                params
        );
    }

    public List<String> getTagsForEntry(String entryId) {
        return jdbc.query(
                """
                SELECT t.name
                FROM entry_tags et
                JOIN tags t ON t.id = et.tag_id
                WHERE et.entry_id = :entryId
                ORDER BY t.name ASC
                """,
                Map.of("entryId", entryId),
                (rs, rowNum) -> rs.getString("name")
        );
    }

    public void replaceTags(String entryId, List<String> normalizedTagNames, TagRepository tagRepository) {
        jdbc.update("DELETE FROM entry_tags WHERE entry_id = :entryId", Map.of("entryId", entryId));
        if (normalizedTagNames == null || normalizedTagNames.isEmpty()) {
            return;
        }

        var tagsByName = tagRepository.upsertAndGetIds(normalizedTagNames);
        for (var name : normalizedTagNames) {
            var tagId = tagsByName.get(name);
            jdbc.update(
                    "INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (:entryId, :tagId)",
                    Map.of("entryId", entryId, "tagId", tagId)
            );
        }
        jdbc.update(
                "UPDATE entries SET updated_at = :updatedAt WHERE id = :id",
                Map.of("id", entryId, "updatedAt", InstantSql.nowIso())
        );
    }

    public int deleteById(String id) {
        return jdbc.update("DELETE FROM entries WHERE id = :id", Map.of("id", id));
    }

    private record EntryRow(
            String id,
            String url,
            String title,
            String description,
            String thumbnailPath,
            String thumbnailLargePath,
            String visitedAt,
            boolean important,
            String createdAt,
            String updatedAt
    ) {
        Entry toEntry(List<String> tags) {
            return new Entry(id, url, title, description, thumbnailPath, thumbnailLargePath, visitedAt, important, createdAt, updatedAt, tags);
        }
    }

    private static final class EntryRowMapper implements RowMapper<EntryRow> {
        @Override
        public EntryRow mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new EntryRow(
                    rs.getString("id"),
                    rs.getString("url"),
                    rs.getString("title"),
                    rs.getString("description"),
                    rs.getString("thumbnail_path"),
                    rs.getString("thumbnail_large_path"),
                    rs.getString("visited_at"),
                    rs.getInt("important") != 0,
                    rs.getString("created_at"),
                    rs.getString("updated_at")
            );
        }
    }
}


