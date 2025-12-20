package com.vestigium.persistence;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class TagRepository {

    private static final RowMapper<TagRow> TAG_ROW_MAPPER = new TagRowMapper();

    private final NamedParameterJdbcTemplate jdbc;

    public TagRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<String> searchByPrefix(String prefix, int limit) {
        if (prefix == null) {
            prefix = "";
        }
        var p = prefix.toLowerCase();
        return jdbc.query(
                """
                SELECT name
                FROM tags
                WHERE LOWER(name) LIKE :p
                ORDER BY name ASC
                LIMIT :limit
                """,
                Map.of("p", p + "%", "limit", Math.max(limit, 1)),
                (rs, rowNum) -> rs.getString("name")
        );
    }

    public List<TagSuggestion> suggestByPrefix(String prefix, int limit) {
        if (prefix == null) {
            prefix = "";
        }
        var p = prefix.toLowerCase();
        return jdbc.query(
                """
                SELECT t.name AS name, COUNT(et.entry_id) AS usage_count
                FROM tags t
                LEFT JOIN entry_tags et ON et.tag_id = t.id
                WHERE LOWER(t.name) LIKE :p
                GROUP BY t.id, t.name
                ORDER BY usage_count DESC, t.name ASC
                LIMIT :limit
                """,
                Map.of("p", p + "%", "limit", Math.max(limit, 1)),
                (rs, rowNum) -> new TagSuggestion(rs.getString("name"), rs.getInt("usage_count"))
        );
    }

    /**
     * Ensures tags exist and returns a map from name -> id. Names must already be normalized.
     */
    public Map<String, String> upsertAndGetIds(List<String> normalizedNames) {
        var out = new HashMap<String, String>();
        if (normalizedNames == null || normalizedNames.isEmpty()) {
            return out;
        }

        for (var name : normalizedNames) {
            jdbc.update(
                    "INSERT OR IGNORE INTO tags (id, name) VALUES (:id, :name)",
                    Map.of("id", UUID.randomUUID().toString(), "name", name)
            );
        }

        var rows = jdbc.query(
                "SELECT id, name FROM tags WHERE name IN (:names)",
                Map.of("names", normalizedNames),
                TAG_ROW_MAPPER
        );
        for (var row : rows) {
            out.put(row.name(), row.id());
        }
        return out;
    }

    private record TagRow(String id, String name) {}

    public record TagSuggestion(String name, int count) {}

    private static final class TagRowMapper implements RowMapper<TagRow> {
        @Override
        public TagRow mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new TagRow(rs.getString("id"), rs.getString("name"));
        }
    }
}


