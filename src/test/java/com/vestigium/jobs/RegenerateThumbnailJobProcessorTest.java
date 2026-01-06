package com.vestigium.jobs;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vestigium.domain.Entry;
import com.vestigium.domain.Job;
import com.vestigium.persistence.EntryRepository;
import com.vestigium.storage.FileStorageService;
import com.vestigium.storage.FileStorageService.StoredFile;
import com.vestigium.thumb.ImageThumbs;
import com.vestigium.thumb.PageScreenshotter;
import com.vestigium.thumb.ThumbnailFetcher;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Optional;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RegenerateThumbnailJobProcessorTest {

    @Mock
    private EntryRepository entries;

    @Mock
    private ThumbnailFetcher fetcher;

    @Mock
    private PageScreenshotter screenshotter;

    @Mock
    private FileStorageService fileStorage;

    private ObjectMapper objectMapper;

    private RegenerateThumbnailJobProcessor processor;

    private Entry mockEntry;

    /**
     * Creates a minimal valid PNG image for testing.
     */
    private byte[] createTestImageBytes() throws Exception {
        var img = new BufferedImage(100, 100, BufferedImage.TYPE_INT_RGB);
        var baos = new ByteArrayOutputStream();
        ImageIO.write(img, "PNG", baos);
        return baos.toByteArray();
    }

    @BeforeEach
    void setUp() throws Exception {
        objectMapper = new ObjectMapper();
        processor = new RegenerateThumbnailJobProcessor(entries, fetcher, screenshotter, fileStorage, objectMapper);

        mockEntry = new Entry(
                "entry-1",
                "http://example.com",
                "Test Entry",
                "Description",
                null,
                null,
                null,
                null,
                false,
                "2023-01-01T00:00:00Z",
                "2023-01-01T00:00:00Z",
                null,
                List.of()
        );
    }

    @Test
    void type_ShouldReturnRegenerateThumbnail() {
        assertThat(processor.type()).isEqualTo("REGENERATE_THUMBNAIL");
    }

    @Test
    void process_ShouldUseManualUrlFromPayload() throws Exception {
        var job = new Job("job-1", "REGENERATE_THUMBNAIL", "PENDING", "entry-1", "{\"url\":\"https://example.com/image.jpg\"}", 0, null, null, null, "2023-01-01T00:00:00Z");
        var imageBytes = createTestImageBytes();

        when(entries.getById("entry-1")).thenReturn(Optional.of(mockEntry));
        when(fetcher.downloadBytes("https://example.com/image.jpg")).thenReturn(Optional.of(imageBytes));
        when(fileStorage.saveThumbnailJpeg(eq("entry-1"), any(byte[].class))).thenReturn(new StoredFile("small.jpg", "small.jpg", "image/jpeg", 100));
        when(fileStorage.saveThumbnailJpeg(eq("entry-1"), eq("large"), any(byte[].class))).thenReturn(new StoredFile("large.jpg", "large.jpg", "image/jpeg", 200));

        processor.process(job);

        verify(fetcher).downloadBytes("https://example.com/image.jpg");
        verify(fetcher, never()).findOgImageUrl(anyString());
        verify(screenshotter, never()).screenshotPng(anyString());
        verify(entries).updateThumbnailPaths("entry-1", "small.jpg", "large.jpg");
    }

    @Test
    void process_ShouldUseManualUrlFromEntry() throws Exception {
        var entryWithManualUrl = new Entry(
                "entry-1",
                "http://example.com",
                "Test Entry",
                "Description",
                null,
                null,
                null,
                null,
                false,
                "2023-01-01T00:00:00Z",
                "2023-01-01T00:00:00Z",
                "https://example.com/manual.jpg",
                List.of()
        );
        var job = new Job("job-1", "REGENERATE_THUMBNAIL", "PENDING", "entry-1", null, 0, null, null, null, "2023-01-01T00:00:00Z");
        var imageBytes = createTestImageBytes();

        when(entries.getById("entry-1")).thenReturn(Optional.of(entryWithManualUrl));
        when(fetcher.downloadBytes("https://example.com/manual.jpg")).thenReturn(Optional.of(imageBytes));
        when(fileStorage.saveThumbnailJpeg(eq("entry-1"), any(byte[].class))).thenReturn(new StoredFile("small.jpg", "small.jpg", "image/jpeg", 100));
        when(fileStorage.saveThumbnailJpeg(eq("entry-1"), eq("large"), any(byte[].class))).thenReturn(new StoredFile("large.jpg", "large.jpg", "image/jpeg", 200));

        processor.process(job);

        verify(fetcher).downloadBytes("https://example.com/manual.jpg");
        verify(entries).updateThumbnailPaths("entry-1", "small.jpg", "large.jpg");
    }

    @Test
    void process_ShouldFallbackToScreenshotWhenNoManualUrl() throws Exception {
        var job = new Job("job-1", "REGENERATE_THUMBNAIL", "PENDING", "entry-1", null, 0, null, null, null, "2023-01-01T00:00:00Z");
        var screenshotBytes = createTestImageBytes();

        when(entries.getById("entry-1")).thenReturn(Optional.of(mockEntry));
        when(fetcher.findOgImageUrl(anyString())).thenReturn(Optional.empty());
        when(screenshotter.screenshotPng("http://example.com")).thenReturn(screenshotBytes);
        when(fileStorage.saveThumbnailJpeg(eq("entry-1"), any(byte[].class))).thenReturn(new StoredFile("small.jpg", "small.jpg", "image/jpeg", 100));
        when(fileStorage.saveThumbnailJpeg(eq("entry-1"), eq("large"), any(byte[].class))).thenReturn(new StoredFile("large.jpg", "large.jpg", "image/jpeg", 200));

        processor.process(job);

        verify(screenshotter).screenshotPng("http://example.com");
        verify(entries).updateThumbnailPaths("entry-1", "small.jpg", "large.jpg");
    }

    @Test
    void process_ShouldThrowWhenEntryNotFound() {
        var job = new Job("job-1", "REGENERATE_THUMBNAIL", "PENDING", "entry-1", null, 0, null, null, null, "2023-01-01T00:00:00Z");

        when(entries.getById("entry-1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> processor.process(job))
                .isInstanceOf(Exception.class);
    }

    @Test
    void process_ShouldThrowWhenManualUrlDownloadFails() throws Exception {
        var job = new Job("job-1", "REGENERATE_THUMBNAIL", "PENDING", "entry-1", "{\"url\":\"https://example.com/image.jpg\"}", 0, null, null, null, "2023-01-01T00:00:00Z");

        when(entries.getById("entry-1")).thenReturn(Optional.of(mockEntry));
        when(fetcher.downloadBytes("https://example.com/image.jpg")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> processor.process(job))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Failed to download manual thumbnail");
    }

    @Test
    void process_ShouldIgnoreMalformedPayload() throws Exception {
        var job = new Job("job-1", "REGENERATE_THUMBNAIL", "PENDING", "entry-1", "invalid json", 0, null, null, null, "2023-01-01T00:00:00Z");
        var screenshotBytes = createTestImageBytes();

        when(entries.getById("entry-1")).thenReturn(Optional.of(mockEntry));
        when(fetcher.findOgImageUrl(anyString())).thenReturn(Optional.empty());
        when(screenshotter.screenshotPng("http://example.com")).thenReturn(screenshotBytes);
        when(fileStorage.saveThumbnailJpeg(eq("entry-1"), any(byte[].class))).thenReturn(new StoredFile("small.jpg", "small.jpg", "image/jpeg", 100));
        when(fileStorage.saveThumbnailJpeg(eq("entry-1"), eq("large"), any(byte[].class))).thenReturn(new StoredFile("large.jpg", "large.jpg", "image/jpeg", 200));

        processor.process(job);

        // Should fallback to screenshot when payload is malformed
        verify(screenshotter).screenshotPng("http://example.com");
    }
}

