package com.vestigium.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vestigium.domain.Entry;
import com.vestigium.enrich.UrlContentFetcher;
import com.vestigium.enrich.YouTubeMetadataFetcher;
import com.vestigium.persistence.AttachmentRepository;
import com.vestigium.persistence.EntryRepository;
import com.vestigium.persistence.JobRepository;
import com.vestigium.persistence.ListRepository;
import com.vestigium.persistence.TagRepository;
import com.vestigium.storage.FileStorageService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EntryServiceTest {

    @Mock
    private EntryRepository entries;
    @Mock
    private TagRepository tags;
    @Mock
    private AttachmentRepository attachments;
    @Mock
    private JobRepository jobs;
    @Mock
    private FileStorageService fileStorage;
    @Mock
    private UrlContentFetcher urlFetcher;
    @Mock
    private YouTubeMetadataFetcher youtubeMetadata;
    @Mock
    private ListRepository lists;

    private EntryService service;

    @BeforeEach
    void setUp() {
        service = new EntryService(entries, tags, attachments, jobs, fileStorage, urlFetcher, youtubeMetadata, lists);
    }

    @Test
    void create_ShouldThrowIfUrlExists() {
        var url = "http://example.com";
        when(entries.getByUrl(anyString())).thenReturn(Optional.of(mock(Entry.class)));

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.create(url, null, null, null, null, false, null))
                .isInstanceOf(VestigiumException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void create_ShouldCreateEntryAndEnqueueJobs() {
        var url = "http://example.com";
        var title = "Test Title";
        
        when(entries.getByUrl(anyString())).thenReturn(Optional.empty());
        
        var mockEntry = new Entry(
            "123", "http://example.com", "Test Title", "Desc", null, null, null, null, false, "now", "now", null, List.of()
        );
        when(entries.create(anyString(), anyString(), anyString(), any(), anyBoolean()))
            .thenReturn(mockEntry);
        // when(entries.getById("123")).thenReturn(Optional.of(mockEntry)); // Unnecessary: create() returns the entry, and the service uses that return value directly now

        var result = service.create(url, title, "Desc", null, null, false, null);

        assertThat(result.entry().id()).isEqualTo("123");
        verify(entries).create(eq("http://example.com"), eq("Test Title"), eq("Desc"), eq((String) null), eq(false));
        verify(jobs).enqueue(eq("ENRICH_ENTRY"), eq("123"), any());
        verify(jobs).enqueue(eq("REGENERATE_THUMBNAIL"), eq("123"), any());
    }

    @Test
    void create_ShouldNormalizeTags() {
        var url = "http://example.com";
        var mockEntry = new Entry(
            "123", "http://example.com", null, null, null, null, null, null, false, "now", "now", null, List.of()
        );
        
        when(entries.getByUrl(anyString())).thenReturn(Optional.empty());
        when(entries.create(any(), any(), any(), any(), anyBoolean())).thenReturn(mockEntry);
        when(entries.getById("123")).thenReturn(Optional.of(mockEntry));

        service.create(url, null, null, null, List.of("TAG1", "tag2"), false, null);

        verify(entries).replaceTags(eq("123"), eq(List.of("tag1", "tag2")), eq(tags));
    }
    
    @Test
    void create_ShouldInferMetadataFromUrlFetcher() throws Exception {
         var url = "http://example.com";
         
         when(entries.getByUrl(anyString())).thenReturn(Optional.empty());
         when(urlFetcher.fetchReadableText(anyString()))
             .thenReturn(new UrlContentFetcher.PageContent("Fetched Title", "Fetched Desc", "Text"));
             
         var mockEntry = new Entry(
            "123", url, "Fetched Title", "Fetched Desc", null, null, null, null, false, "now", "now", null, List.of()
         );
         when(entries.create(any(), any(), any(), any(), anyBoolean())).thenReturn(mockEntry);
         // getById is not called

         service.create(url, null, null, null, null, false, null);

         verify(entries).create(eq(url), eq("Fetched Title"), eq("Fetched Desc"), eq((String) null), eq(false));
    }

    @Test
    void bulkCreate_ShouldHandleErrorsIdeally() {
        var urls = List.of("http://ok.com", "invalid-url", "http://dupe.com");
        
        // Mock behaviors
        // 1. ok.com -> success
        when(entries.getByUrl("http://ok.com")).thenReturn(Optional.empty());
        when(entries.create(eq("http://ok.com"), any(), any(), any(), anyBoolean()))
            .thenReturn(new Entry("1", "http://ok.com", null, null, null, null, null, null, false, "now", "now", null, List.of()));
        // getById is not called for bulk create with no tags

        // 3. dupe.com -> exists
        when(entries.getByUrl("http://dupe.com")).thenReturn(Optional.of(mock(Entry.class)));

        var result = service.bulkCreate(urls);

        // invalid-url throws exception in normalizeUrl which is caught inside bulkCreate
        assertThat(result.createdCount()).isEqualTo(1); // ok.com
        assertThat(result.skippedCount()).isEqualTo(1); // dupe.com
        assertThat(result.errors()).hasSize(1);
        assertThat(result.errors().getFirst().url()).isEqualTo("invalid-url");
    }

    @Test
    void importEntries_ShouldMergeListsCorrectly() {
        var importItem = new EntryService.ExportItem(
            "old-id", "http://example.com", "now", null, null, "Title", "Desc", null, 
            List.of("List A", "List B"), List.of()
        );
        
        var existingEntry = new Entry(
            "123", "http://example.com", "Old Title", "Old Desc", null, null, null, null, false, "now", "now", null, List.of()
        );

        when(entries.getByUrl("http://example.com")).thenReturn(Optional.of(existingEntry));
        
        when(lists.upsertByName("List A")).thenReturn("L1");
        when(lists.upsertByName("List B")).thenReturn("L2");

        var result = service.importEntries("skip", List.of(importItem));

        assertThat(result.skippedCount()).isEqualTo(1);
        
        // IMPORTANT: Even if skipped, lists should be merged
        verify(lists).mergeEntryLists(eq("123"), eq(List.of("L1", "L2")));
    }

    @Test
    void toResponse_ShouldFlagFailedLatestJob() {
        var entry = new Entry("123", "url", null, null, null, null, null, null, false, "now", "now", null, List.of());
        when(jobs.findEntryIdsWithFailedLatestJob(eq(List.of("123")))).thenReturn(java.util.Set.of("123"));

        var response = service.toResponse(entry);

        assertThat(response.id()).isEqualTo("123");
        assertThat(response.latestJobFailed()).isTrue();
    }

    @Test
    void toResponses_ShouldFlagFailedLatestJobs() {
        var e1 = new Entry("1", "u1", null, null, null, null, null, null, false, "now", "now", null, List.of());
        var e2 = new Entry("2", "u2", null, null, null, null, null, null, false, "now", "now", null, List.of());
        
        when(jobs.findEntryIdsWithFailedLatestJob(eq(List.of("1", "2")))).thenReturn(java.util.Set.of("1"));

        var results = service.toResponses(List.of(e1, e2));

        assertThat(results).hasSize(2);
        assertThat(results.get(0).id()).isEqualTo("1");
        assertThat(results.get(0).latestJobFailed()).isTrue();
        assertThat(results.get(1).id()).isEqualTo("2");
        assertThat(results.get(1).latestJobFailed()).isFalse();
    }
}
