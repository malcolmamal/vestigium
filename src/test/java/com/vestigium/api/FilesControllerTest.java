package com.vestigium.api;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.vestigium.domain.Attachment;
import com.vestigium.domain.Entry;
import com.vestigium.persistence.AttachmentRepository;
import com.vestigium.persistence.EntryRepository;
import com.vestigium.storage.FileStorageService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(FilesController.class)
class FilesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AttachmentRepository attachments;

    @MockBean
    private EntryRepository entries;

    @MockBean
    private FileStorageService fileStorage;

    @Test
    void downloadAttachment_ShouldReturnAttachment() throws Exception {
        var attachment = new Attachment(
                "att-1", "entry-1", "PDF", "test.pdf",
                "application/pdf", 1000, "path/to/file.pdf", "2023-01-01T00:00:00Z"
        );
        var resource = new ByteArrayResource("PDF content".getBytes());

        when(attachments.getById("att-1")).thenReturn(Optional.of(attachment));
        when(fileStorage.loadAsResource("path/to/file.pdf")).thenReturn(resource);

        mockMvc.perform(get("/api/attachments/att-1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.parseMediaType("application/pdf")))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"test.pdf\""));
    }

    @Test
    void downloadAttachment_ShouldReturn404WhenNotFound() throws Exception {
        when(attachments.getById("att-1")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/attachments/att-1"))
                .andExpect(status().isNotFound());
    }

    @Test
    void downloadAttachment_ShouldReturn404WhenFileNotExists() throws Exception {
        var attachment = new Attachment(
                "att-1", "entry-1", "PDF", "test.pdf",
                "application/pdf", 1000, "path/to/file.pdf", "2023-01-01T00:00:00Z"
        );
        var resource = new ByteArrayResource("PDF content".getBytes()) {
            @Override
            public boolean exists() {
                return false;
            }
        };

        when(attachments.getById("att-1")).thenReturn(Optional.of(attachment));
        when(fileStorage.loadAsResource("path/to/file.pdf")).thenReturn(resource);

        mockMvc.perform(get("/api/attachments/att-1"))
                .andExpect(status().isNotFound());
    }

    @Test
    void entryThumbnail_ShouldReturnSmallThumbnail() throws Exception {
        var entry = new Entry(
                "entry-1", "http://example.com", "Title", "Desc",
                null, "thumb/small.jpg", "thumb/large.jpg", null, false,
                "2023-01-01T00:00:00Z", "2023-01-01T00:00:00Z", null, true, null, List.of()
        );
        var resource = new ByteArrayResource("image data".getBytes());

        when(entries.getById("entry-1")).thenReturn(Optional.of(entry));
        when(fileStorage.loadAsResource("thumb/small.jpg")).thenReturn(resource);

        mockMvc.perform(get("/api/entries/entry-1/thumbnail"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_JPEG));
    }

    @Test
    void entryThumbnail_ShouldReturnLargeThumbnailWhenRequested() throws Exception {
        var entry = new Entry(
                "entry-1", "http://example.com", "Title", "Desc",
                null, "thumb/small.jpg", "thumb/large.jpg", null, false,
                "2023-01-01T00:00:00Z", "2023-01-01T00:00:00Z", null, true, null, List.of()
        );
        var resource = new ByteArrayResource("image data".getBytes());

        when(entries.getById("entry-1")).thenReturn(Optional.of(entry));
        when(fileStorage.loadAsResource("thumb/large.jpg")).thenReturn(resource);

        mockMvc.perform(get("/api/entries/entry-1/thumbnail").param("size", "large"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_JPEG));
    }

    @Test
    void entryThumbnail_ShouldFallbackToSmallWhenLargeNotAvailable() throws Exception {
        var entry = new Entry(
                "entry-1", "http://example.com", "Title", "Desc",
                null, "thumb/small.jpg", null, null, false,
                "2023-01-01T00:00:00Z", "2023-01-01T00:00:00Z", null, true, null, List.of()
        );
        var resource = new ByteArrayResource("image data".getBytes());

        when(entries.getById("entry-1")).thenReturn(Optional.of(entry));
        when(fileStorage.loadAsResource("thumb/small.jpg")).thenReturn(resource);

        mockMvc.perform(get("/api/entries/entry-1/thumbnail").param("size", "large"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_JPEG));
    }

    @Test
    void entryThumbnail_ShouldReturn404WhenEntryNotFound() throws Exception {
        when(entries.getById("entry-1")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/entries/entry-1/thumbnail"))
                .andExpect(status().isNotFound());
    }

    @Test
    void entryThumbnail_ShouldReturn404WhenNoThumbnail() throws Exception {
        var entry = new Entry(
                "entry-1", "http://example.com", "Title", "Desc",
                null, null, null, null, false,
                "2023-01-01T00:00:00Z", "2023-01-01T00:00:00Z", null, true, null, List.of()
        );

        when(entries.getById("entry-1")).thenReturn(Optional.of(entry));

        mockMvc.perform(get("/api/entries/entry-1/thumbnail"))
                .andExpect(status().isNotFound());
    }

    @Test
    void entryThumbnail_ShouldReturn404WhenFileNotExists() throws Exception {
        var entry = new Entry(
                "entry-1", "http://example.com", "Title", "Desc",
                null, "thumb/small.jpg", null, null, false,
                "2023-01-01T00:00:00Z", "2023-01-01T00:00:00Z", null, true, null, List.of()
        );
        var resource = new ByteArrayResource("image data".getBytes()) {
            @Override
            public boolean exists() {
                return false;
            }
        };

        when(entries.getById("entry-1")).thenReturn(Optional.of(entry));
        when(fileStorage.loadAsResource("thumb/small.jpg")).thenReturn(resource);

        mockMvc.perform(get("/api/entries/entry-1/thumbnail"))
                .andExpect(status().isNotFound());
    }
}

