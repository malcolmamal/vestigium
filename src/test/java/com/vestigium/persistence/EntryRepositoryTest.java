package com.vestigium.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import com.vestigium.service.NsfwConfigService;
import com.vestigium.domain.Entry;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.jackson.JacksonAutoConfiguration;
import org.springframework.boot.test.autoconfigure.jdbc.JdbcTest;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

@JdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({EntryRepository.class, TagRepository.class, ListRepository.class, NsfwConfigService.class, JacksonAutoConfiguration.class})
class EntryRepositoryTest {

    @Autowired
    private EntryRepository entries;

    @Autowired
    private TagRepository tags;

    @Autowired
    private ListRepository lists;

    @Autowired
    private NamedParameterJdbcTemplate jdbc;

    @BeforeEach
    void setUp() {
        // Clean up database before each test
        jdbc.getJdbcOperations().execute("DELETE FROM entry_lists");
        jdbc.getJdbcOperations().execute("DELETE FROM entry_tags");
        jdbc.getJdbcOperations().execute("DELETE FROM entries");
        jdbc.getJdbcOperations().execute("DELETE FROM tags");
        jdbc.getJdbcOperations().execute("DELETE FROM lists");
    }

    @Test
    void search_ShouldFilterByTags() {
        var e1 = entries.create("http://e1.com", "Entry 1", "Desc", null, false);
        var e2 = entries.create("http://e2.com", "Entry 2", "Desc", null, false);

        entries.replaceTags(e1.id(), List.of("tag1", "common"), tags);
        entries.replaceTags(e2.id(), List.of("tag2", "common"), tags);

        // Search for 'tag1' -> only e1
        var res1 = entries.search(null, List.of("tag1"), null, null, null, null, null, null, true, 0, 10);
        assertThat(res1).hasSize(1);
        assertThat(res1.getFirst().id()).isEqualTo(e1.id());

        // Search for 'common' -> both
        var res2 = entries.search(null, List.of("common"), null, null, null, null, null, null, true, 0, 10);
        assertThat(res2).hasSize(2);

        // Search for 'tag1' AND 'common' -> only e1
        var res3 = entries.search(null, List.of("tag1", "common"), null, null, null, null, null, null, true, 0, 10);
        assertThat(res3).hasSize(1);
        assertThat(res3.getFirst().id()).isEqualTo(e1.id());
    }

    @Test
    void search_ShouldFilterByList() {
        var e1 = entries.create("http://e1.com", "Entry 1", "Desc", null, false);
        var e2 = entries.create("http://e2.com", "Entry 2", "Desc", null, false);

        var listA = lists.create("List A");
        lists.replaceEntryLists(e1.id(), List.of(listA.id()));

        var res = entries.search(null, null, null, null, null, null, null, List.of(listA.id()), true, 0, 10);
        assertThat(res).hasSize(1);
        assertThat(res.getFirst().id()).isEqualTo(e1.id());
    }

    @Test
    void search_ShouldExcludeNsfwByDefault() {
        // Assuming "porn" is an NSFW tag (as per EntryRepository impl)
        var safe = entries.create("http://safe.com", "Safe", "Desc", null, false);
        var nsfw = entries.create("http://nsfw.com", "NSFW", "Desc", null, false);

        entries.replaceTags(nsfw.id(), List.of("porn"), tags);

        // includeNsfw = false
        var resSafe = entries.search(null, null, null, null, null, null, null, null, false, 0, 10);
        assertThat(resSafe).hasSize(1);
        assertThat(resSafe.getFirst().id()).isEqualTo(safe.id());

        // includeNsfw = true
        var resAll = entries.search(null, null, null, null, null, null, null, null, true, 0, 10);
        assertThat(resAll).hasSize(2);
    }
    
    @Test
    void search_ShouldFilterByQuery() {
        entries.create("http://e1.com", "Apple Pie", "Recipe", null, false);
        entries.create("http://e2.com", "Banana Bread", "Delicious bread", null, false);
        
        var res = entries.search("apple", null, null, null, null, null, null, null, true, 0, 10);
        assertThat(res).hasSize(1);
        assertThat(res.getFirst().title()).isEqualTo("Apple Pie");
        
        var resDesc = entries.search("bread", null, null, null, null, null, null, null, true, 0, 10);
        assertThat(resDesc).hasSize(1);
        assertThat(resDesc.getFirst().title()).isEqualTo("Banana Bread");
    }

    @Test
    void listRandomUnvisited_ShouldExcludeVisited() {
        var visited = entries.create("http://v.com", "Visited", "Desc", null, false);
        entries.setVisitedNow(visited.id());

        var unvisited = entries.create("http://u.com", "Unvisited", "Desc", null, false);

        var res = entries.listRandomUnvisited(10, true);
        assertThat(res).hasSize(1);
        assertThat(res.getFirst().id()).isEqualTo(unvisited.id());
    }
}
