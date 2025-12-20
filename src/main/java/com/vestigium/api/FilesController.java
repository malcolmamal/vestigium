package com.vestigium.api;

import com.vestigium.persistence.AttachmentRepository;
import com.vestigium.persistence.EntryRepository;
import com.vestigium.storage.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
public class FilesController {

    private final AttachmentRepository attachments;
    private final EntryRepository entries;
    private final FileStorageService fileStorage;

    public FilesController(AttachmentRepository attachments, EntryRepository entries, FileStorageService fileStorage) {
        this.attachments = attachments;
        this.entries = entries;
        this.fileStorage = fileStorage;
    }

    @GetMapping("/api/attachments/{attachmentId}")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable String attachmentId) {
        var attachment = attachments.getById(attachmentId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND));

        var resource = fileStorage.loadAsResource(attachment.storagePath());
        if (!resource.exists()) {
            throw new ResponseStatusException(NOT_FOUND);
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.mimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.originalName() + "\"")
                .body(resource);
    }

    @GetMapping("/api/entries/{entryId}/thumbnail")
    public ResponseEntity<Resource> entryThumbnail(
            @PathVariable String entryId,
            @org.springframework.web.bind.annotation.RequestParam(value = "size", required = false) String size
    ) {
        var entry = entries.getById(entryId).orElseThrow(() -> new ResponseStatusException(NOT_FOUND));
        var wantLarge = size != null && size.equalsIgnoreCase("large");
        var path = wantLarge ? entry.thumbnailLargePath() : entry.thumbnailPath();
        if (path == null || path.isBlank()) {
            // Fallback: if large requested but not available, try small.
            if (wantLarge && entry.thumbnailPath() != null && !entry.thumbnailPath().isBlank()) {
                path = entry.thumbnailPath();
            } else {
            throw new ResponseStatusException(NOT_FOUND);
            }
        }
        var resource = fileStorage.loadAsResource(path);
        if (!resource.exists()) {
            throw new ResponseStatusException(NOT_FOUND);
        }
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(resource);
    }
}


