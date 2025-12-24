package com.vestigium.persistence;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ListRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public ListRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<ListItem> listAllWithCounts() {
        return jdbc.query(
                """
                SELECT l.id, l.name, l.created_at, COUNT(el.entry_id) AS entry_count
                FROM lists l
                LEFT JOIN entry_lists el ON el.list_id = l.id
                GROUP BY l.id, l.name, l.created_at
                ORDER BY entry_count DESC, l.name ASC
                """,
                Map.of(),
                (rs, rowNum) -> new ListItem(
                        rs.getString("id"),
                        rs.getString("name"),
                        rs.getInt("entry_count"),
                        rs.getString("created_at")
                )
        );
    }

    public ListItem create(String name) {
        var id = UUID.randomUUID().toString();
        var createdAt = InstantSql.nowIso();
        jdbc.update(
                "INSERT INTO lists (id, name, created_at) VALUES (:id, :name, :createdAt)",
                Map.of("id", id, "name", name, "createdAt", createdAt)
        );
        return new ListItem(id, name, 0, createdAt);
    }

    public Optional<String> getIdByName(String name) {
        if (name == null || name.isBlank()) {
            return Optional.empty();
        }
        var rows = jdbc.query(
                "SELECT id FROM lists WHERE name = :name",
                Map.of("name", name),
                (rs, rowNum) -> rs.getString("id")
        );
        return rows.isEmpty() ? Optional.empty() : Optional.ofNullable(rows.getFirst());
    }

    /**
     * Creates the list if missing, returns its id either way.
     * Uses INSERT OR IGNORE to avoid throwing on duplicates.
     */
    public String upsertByName(String name) {
        var normalized = name == null ? "" : name.trim();
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("name is required");
        }
        var id = UUID.randomUUID().toString();
        var createdAt = InstantSql.nowIso();
        jdbc.update(
                "INSERT OR IGNORE INTO lists (id, name, created_at) VALUES (:id, :name, :createdAt)",
                Map.of("id", id, "name", normalized, "createdAt", createdAt)
        );
        var resolved = jdbc.queryForObject(
                "SELECT id FROM lists WHERE name = :name",
                Map.of("name", normalized),
                String.class
        );
        if (resolved == null || resolved.isBlank()) {
            throw new IllegalStateException("Failed to resolve list id for name=" + normalized);
        }
        return resolved;
    }

    public int countEntriesForList(String listId) {
        Integer v = jdbc.queryForObject(
                "SELECT COUNT(*) FROM entry_lists WHERE list_id = :id",
                Map.of("id", listId),
                Integer.class
        );
        return v == null ? 0 : v;
    }

    public int deleteById(String listId) {
        return jdbc.update("DELETE FROM lists WHERE id = :id", Map.of("id", listId));
    }

    public List<ListItem> listForEntry(String entryId) {
        return jdbc.query(
                """
                SELECT l.id, l.name, l.created_at
                FROM entry_lists el
                JOIN lists l ON l.id = el.list_id
                WHERE el.entry_id = :entryId
                ORDER BY l.name ASC
                """,
                Map.of("entryId", entryId),
                (rs, rowNum) -> new ListItem(
                        rs.getString("id"),
                        rs.getString("name"),
                        0,
                        rs.getString("created_at")
                )
        );
    }

    public List<String> listNamesForEntry(String entryId) {
        return jdbc.query(
                """
                SELECT l.name
                FROM entry_lists el
                JOIN lists l ON l.id = el.list_id
                WHERE el.entry_id = :entryId
                ORDER BY l.name ASC
                """,
                Map.of("entryId", entryId),
                (rs, rowNum) -> rs.getString("name")
        );
    }

    public void replaceEntryLists(String entryId, List<String> listIds) {
        jdbc.update("DELETE FROM entry_lists WHERE entry_id = :entryId", Map.of("entryId", entryId));
        if (listIds == null || listIds.isEmpty()) {
            return;
        }
        for (var id : listIds) {
            if (id == null || id.isBlank()) continue;
            jdbc.update(
                    "INSERT OR IGNORE INTO entry_lists (entry_id, list_id) VALUES (:entryId, :listId)",
                    Map.of("entryId", entryId, "listId", id)
            );
        }
    }

    public void mergeEntryLists(String entryId, List<String> listIds) {
        if (listIds == null || listIds.isEmpty()) {
            return;
        }
        for (var id : listIds) {
            if (id == null || id.isBlank()) continue;
            jdbc.update(
                    "INSERT OR IGNORE INTO entry_lists (entry_id, list_id) VALUES (:entryId, :listId)",
                    Map.of("entryId", entryId, "listId", id)
            );
        }
    }

    public record ListItem(String id, String name, int entryCount, String createdAt) {}
}


