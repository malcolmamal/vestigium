package com.vestigium.api;

import com.vestigium.api.dto.AttachmentResponse;
import com.vestigium.api.dto.EntryDetailsResponse;
import com.vestigium.api.dto.EntryListResponse;
import com.vestigium.api.dto.EntryResponse;
import com.vestigium.api.dto.PatchEntryRequest;
import com.vestigium.service.EntryService;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class EntriesController {

    private final EntryService entryService;

    public EntriesController(EntryService entryService) {
        this.entryService = entryService;
    }

    @PostMapping(value = "/api/entries", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public EntryDetailsResponse createEntry(
            @RequestParam("url") @NotBlank String url,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "tags", required = false) List<String> tags,
            @RequestParam(value = "important", required = false) Boolean important,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments
    ) {
        var created = entryService.create(
                url,
                title,
                description,
                tags,
                important != null && important,
                attachments
        );
        return new EntryDetailsResponse(
                EntryResponse.from(created.entry()),
                created.attachments().stream().map(AttachmentResponse::from).toList()
        );
    }

    @GetMapping("/api/entries")
    public EntryListResponse list(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "tags", required = false) List<String> tags,
            @RequestParam(value = "important", required = false) Boolean important,
            @RequestParam(value = "visited", required = false) Boolean visited,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "pageSize", defaultValue = "25") int pageSize
    ) {
        var items = entryService.search(q, tags, important, visited, page, pageSize)
                .stream()
                .map(EntryResponse::from)
                .toList();
        return new EntryListResponse(page, pageSize, items);
    }

    @GetMapping("/api/entries/{id}")
    public EntryDetailsResponse get(@PathVariable String id) {
        var entry = entryService.getById(id);
        var attachments = entryService.listAttachments(id);
        return new EntryDetailsResponse(
                EntryResponse.from(entry),
                attachments.stream().map(AttachmentResponse::from).toList()
        );
    }

    @PatchMapping("/api/entries/{id}")
    public EntryResponse patch(@PathVariable String id, @RequestBody PatchEntryRequest req) {
        var updated = entryService.update(id, req.title(), req.description(), req.important(), req.tags());
        return EntryResponse.from(updated);
    }

    @PostMapping("/api/entries/{id}/visited")
    public void markVisited(@PathVariable String id) {
        entryService.markVisited(id);
    }

    @PostMapping("/api/entries/{id}/enqueue-enrich")
    public void enqueueEnrich(@PathVariable String id) {
        entryService.enqueueEnrich(id);
    }

    @PostMapping("/api/entries/{id}/enqueue-thumbnail")
    public void enqueueThumbnail(@PathVariable String id) {
        entryService.enqueueThumbnail(id);
    }
}


