package com.vestigium.jobs;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vestigium.domain.Attachment;
import com.vestigium.domain.Entry;
import com.vestigium.domain.Job;
import com.vestigium.enrich.EnrichmentParser;
import com.vestigium.enrich.EnrichmentResult;
import com.vestigium.enrich.PdfTextExtractor;
import com.vestigium.enrich.ImdbMetadataFetcher;
import com.vestigium.enrich.UrlContentFetcher;
import com.vestigium.enrich.YouTubeMetadataFetcher;
import com.vestigium.llm.GeminiClient;
import com.vestigium.persistence.AttachmentRepository;
import com.vestigium.persistence.EntryRepository;
import com.vestigium.persistence.TagRepository;
import com.vestigium.storage.FileStorageService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;

@ExtendWith(MockitoExtension.class)
class EnrichEntryJobProcessorTest {

    @Mock
    private EntryRepository entries;

    @Mock
    private TagRepository tags;

    @Mock
    private AttachmentRepository attachments;

    @Mock
    private FileStorageService fileStorage;

    @Mock
    private UrlContentFetcher urlFetcher;

    @Mock
    private YouTubeMetadataFetcher youtubeMetadata;

    @Mock
    private ImdbMetadataFetcher imdb;

    @Mock
    private PdfTextExtractor pdfTextExtractor;

    @Mock
    private GeminiClient gemini;

    @Mock
    private EnrichmentParser enrichmentParser;

    private ObjectMapper objectMapper;
    private EnrichEntryJobProcessor processor;
    private Entry mockEntry;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        processor = new EnrichEntryJobProcessor(
                entries, tags, attachments, fileStorage, urlFetcher,
                youtubeMetadata, imdb, pdfTextExtractor, gemini,
                enrichmentParser, objectMapper
        );

        mockEntry = new Entry(
                "entry-1",
                "http://example.com",
                null,
                null,
                null,
                null,
                null,
                null,
                false,
                "2023-01-01T00:00:00Z",
                "2023-01-01T00:00:00Z",
                null,
                true,
                null,
                List.of()
        );
    }

    @Test
    void type_ShouldReturnEnrichEntry() {
        assertThat(processor.type()).isEqualTo("ENRICH_ENTRY");
    }

    @Test
    void process_ShouldUpdateEntryWithLLMEnrichment() throws Exception {
        var job = new Job("job-1", "ENRICH_ENTRY", "PENDING", "entry-1", null, 0, null, null, null, null, "2023-01-01T00:00:00Z");
        var pageContent = new UrlContentFetcher.PageContent("Page Title", "Meta Description", "Page text content");
        var enrichment = new EnrichmentResult("LLM Title", "LLM Description", null, List.of("tag1", "tag2"));

        when(entries.getById("entry-1")).thenReturn(Optional.of(mockEntry));
        when(attachments.listForEntry("entry-1")).thenReturn(List.of());
        when(urlFetcher.fetchReadableText("http://example.com")).thenReturn(pageContent);
        when(gemini.generateText(anyString(), any())).thenReturn("{\"title\":\"LLM Title\",\"description\":\"LLM Description\",\"tags\":[\"tag1\",\"tag2\"]}");
        when(enrichmentParser.parseFromModelText(anyString())).thenReturn(enrichment);
        when(entries.getById("entry-1")).thenReturn(Optional.of(mockEntry));

        processor.process(job);

        verify(entries).updateCore(eq("entry-1"), eq("LLM Title"), eq("LLM Description"), eq((String) null), eq((String) null), eq((Boolean) null));
        verify(entries).replaceTags(eq("entry-1"), any(), eq(tags));
    }

    @Test
    void process_ShouldUseForceFlagFromPayload() throws Exception {
        var job = new Job("job-1", "ENRICH_ENTRY", "PENDING", "entry-1", "{\"force\":true}", 0, null, null, null, null, "2023-01-01T00:00:00Z");
        var entryWithTitle = new Entry(
                "entry-1", "http://example.com", "Existing Title", "Existing Desc",
                null, null, null, null, false,
                "2023-01-01T00:00:00Z", "2023-01-01T00:00:00Z", null, true, null, List.of()
        );
        var pageContent = new UrlContentFetcher.PageContent("Page Title", "Meta Description", "Page text");
        var enrichment = new EnrichmentResult("New Title", "New Description", null, List.of("tag1"));

        when(entries.getById("entry-1")).thenReturn(Optional.of(entryWithTitle));
        when(attachments.listForEntry("entry-1")).thenReturn(List.of());
        when(urlFetcher.fetchReadableText("http://example.com")).thenReturn(pageContent);
        when(gemini.generateText(anyString(), any())).thenReturn("{\"title\":\"New Title\",\"description\":\"New Description\",\"tags\":[\"tag1\"]}");
        when(enrichmentParser.parseFromModelText(anyString())).thenReturn(enrichment);
        when(entries.getById("entry-1")).thenReturn(Optional.of(entryWithTitle), Optional.of(entryWithTitle));

        processor.process(job);

        // With force=true, should update even when title/description exist
        verify(entries).updateCore(eq("entry-1"), eq("New Title"), eq("New Description"), eq((String) null), eq((String) null), eq((Boolean) null));
    }

    @Test
    void process_ShouldNotUpdateWhenEntryHasContentAndNoForce() throws Exception {
        var job = new Job("job-1", "ENRICH_ENTRY", "PENDING", "entry-1", null, 0, null, null, null, null, "2023-01-01T00:00:00Z");
        var entryWithContent = new Entry(
                "entry-1", "http://example.com", "Existing Title", "Existing Desc",
                null, null, null, null, false,
                "2023-01-01T00:00:00Z", "2023-01-01T00:00:00Z", null, true, null, List.of()
        );
        var pageContent = new UrlContentFetcher.PageContent("Page Title", "Meta Description", "Page text");
        var enrichment = new EnrichmentResult("New Title", "New Description", null, List.of("tag1"));

        when(entries.getById("entry-1")).thenReturn(Optional.of(entryWithContent));
        when(attachments.listForEntry("entry-1")).thenReturn(List.of());
        when(urlFetcher.fetchReadableText("http://example.com")).thenReturn(pageContent);
        when(gemini.generateText(anyString(), any())).thenReturn("{\"title\":\"New Title\",\"description\":\"New Description\",\"tags\":[\"tag1\"]}");
        when(enrichmentParser.parseFromModelText(anyString())).thenReturn(enrichment);
        when(entries.getById("entry-1")).thenReturn(Optional.of(entryWithContent), Optional.of(entryWithContent));

        processor.process(job);

        // Without force, should not update existing title/description
        verify(entries, never()).updateCore(eq("entry-1"), eq("New Title"), any(), any(), any(), any());
    }

    @Test
    void process_ShouldHandleYouTubeUrls() throws Exception {
        var youtubeEntry = new Entry(
                "entry-1",
                "https://youtube.com/watch?v=abc123",
                null,
                null,
                null,
                null,
                null,
                null,
                false,
                "2023-01-01T00:00:00Z",
                "2023-01-01T00:00:00Z",
                null,
                true,
                null,
                List.of()
        );
        var job = new Job("job-1", "ENRICH_ENTRY", "PENDING", "entry-1", null, 0, null, null, null, null, "2023-01-01T00:00:00Z");
        var ytMetadata = new YouTubeMetadataFetcher.YouTubeMetadata("Video Title", "Channel Name", null);
        var enrichment = new EnrichmentResult("LLM Title", "LLM Description", null, List.of("youtube"));

        when(entries.getById("entry-1")).thenReturn(Optional.of(youtubeEntry));
        when(attachments.listForEntry("entry-1")).thenReturn(List.of());
        when(youtubeMetadata.fetch("https://youtube.com/watch?v=abc123")).thenReturn(Optional.of(ytMetadata));
        when(gemini.generateText(anyString(), any())).thenReturn("{\"title\":\"LLM Title\",\"description\":\"LLM Description\",\"tags\":[\"youtube\"]}");
        when(enrichmentParser.parseFromModelText(anyString())).thenReturn(enrichment);
        when(entries.getById("entry-1")).thenReturn(Optional.of(youtubeEntry), Optional.of(youtubeEntry));

        processor.process(job);

        verify(youtubeMetadata).fetch("https://youtube.com/watch?v=abc123");
        verify(urlFetcher, never()).fetchReadableText(anyString());
    }

    @Test
    void process_ShouldHandleAttachments() throws Exception {
        var attachment = new Attachment("att-1", "entry-1", "PDF", "test.pdf", "application/pdf", 1000, "path/to/file.pdf", "2023-01-01T00:00:00Z");
        var resource = mock(Resource.class);
        var job = new Job("job-1", "ENRICH_ENTRY", "PENDING", "entry-1", null, 0, null, null, null, null, "2023-01-01T00:00:00Z");
        var enrichment = new EnrichmentResult("Title", "Description", null, List.of("tag1"));

        when(entries.getById("entry-1")).thenReturn(Optional.of(mockEntry));
        when(attachments.listForEntry("entry-1")).thenReturn(List.of(attachment));
        when(fileStorage.loadAsResource("path/to/file.pdf")).thenReturn(resource);
        when(resource.exists()).thenReturn(true);
        when(resource.getInputStream()).thenReturn(new java.io.ByteArrayInputStream("PDF content".getBytes()));
        when(pdfTextExtractor.extractText(any(), eq(15000))).thenReturn("Extracted PDF text");
        when(gemini.generateText(anyString(), any())).thenReturn("{\"title\":\"Title\",\"description\":\"Description\",\"tags\":[\"tag1\"]}");
        when(enrichmentParser.parseFromModelText(anyString())).thenReturn(enrichment);
        when(entries.getById("entry-1")).thenReturn(Optional.of(mockEntry));

        processor.process(job);

        verify(pdfTextExtractor).extractText(any(), eq(15000));
        verify(urlFetcher, never()).fetchReadableText(anyString());
    }
}

