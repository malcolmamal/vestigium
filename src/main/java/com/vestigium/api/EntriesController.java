package com.vestigium.api;

import com.vestigium.api.dto.AttachmentResponse;
import com.vestigium.api.dto.BulkCreateEntriesRequest;
import com.vestigium.api.dto.BulkCreateEntriesResponse;
import com.vestigium.api.dto.EntryDetailsResponse;
import com.vestigium.api.dto.EntryExportItem;
import com.vestigium.api.dto.EntryListResponse;
import com.vestigium.api.dto.EntryResponse;
import com.vestigium.api.dto.ImportEntriesRequest;
import com.vestigium.api.dto.ImportEntriesResponse;
import com.vestigium.api.dto.ListResponse;
import com.vestigium.api.dto.PatchEntryRequest;
import com.vestigium.api.dto.ReplaceEntryListsRequest;
import com.vestigium.service.EntryService;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
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
            @RequestParam(value = "addedFrom", required = false) String addedFrom,
            @RequestParam(value = "addedTo", required = false) String addedTo,
            @RequestParam(value = "sort", required = false) String sort,
            @RequestParam(value = "listId", required = false) List<String> listIds,
            @RequestParam(value = "includeNsfw", defaultValue = "true") boolean includeNsfw,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "pageSize", defaultValue = "20") int pageSize
    ) {
        var items = entryService.search(q, tags, important, visited, addedFrom, addedTo, sort, listIds, includeNsfw, page, pageSize)
                .stream()
                .map(EntryResponse::from)
                .toList();
        return new EntryListResponse(page, pageSize, items);
    }

    @PostMapping(value = "/api/entries/bulk", consumes = MediaType.APPLICATION_JSON_VALUE)
    public BulkCreateEntriesResponse bulkCreate(@RequestBody BulkCreateEntriesRequest req) {
        var result = entryService.bulkCreate(req == null ? null : req.urls());
        var errors = result.errors().stream()
                .map(e -> new BulkCreateEntriesResponse.ErrorItem(e.url(), e.error()))
                .toList();
        return new BulkCreateEntriesResponse(result.createdCount(), result.skippedCount(), errors);
    }

    @GetMapping(value = "/api/entries/export", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<EntryExportItem> exportEntries() {
        return entryService.exportAll().items().stream()
                .map(i -> new EntryExportItem(
                        i.id(),
                        i.url(),
                        i.addedAt(),
                        i.thumbnailPath(),
                        i.thumbnailLargePath(),
                        i.title(),
                        i.description(),
                        i.detailedDescription(),
                        i.lists(),
                        i.tags()
                ))
                .toList();
    }

    @PostMapping(value = "/api/entries/import", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ImportEntriesResponse importEntries(@RequestBody ImportEntriesRequest req) {
        var in = req == null ? List.<EntryExportItem>of() : (req.items() == null ? List.<EntryExportItem>of() : req.items());
        var items = in.stream()
                .map(i -> new EntryService.ExportItem(
                        i.id(),
                        i.url(),
                        i.addedAt(),
                        i.thumbnailPath(),
                        i.thumbnailLargePath(),
                        i.title(),
                        i.description(),
                        i.detailedDescription(),
                        i.lists(),
                        i.tags()
                ))
                .toList();
        var result = entryService.importEntries(req == null ? null : req.mode(), items);
        var errors = result.errors().stream()
                .map(e -> new ImportEntriesResponse.ErrorItem(e.url(), e.error()))
                .toList();
        return new ImportEntriesResponse(result.createdCount(), result.updatedCount(), result.skippedCount(), errors);
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

    @GetMapping("/api/entries/{id}/lists")
    public List<ListResponse> lists(@PathVariable String id) {
        return entryService.listListsForEntry(id).stream().map(ListResponse::from).toList();
    }

    @PostMapping(value = "/api/entries/{id}/lists", consumes = MediaType.APPLICATION_JSON_VALUE)
    public void replaceLists(@PathVariable String id, @RequestBody ReplaceEntryListsRequest req) {
        entryService.replaceEntryLists(id, req == null ? null : req.listIds());
    }

    @PatchMapping("/api/entries/{id}")
    public EntryResponse patch(@PathVariable String id, @RequestBody PatchEntryRequest req) {
        var updated = entryService.update(id, req.title(), req.description(), req.detailedDescription(), req.important(), req.tags());
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

    @DeleteMapping("/api/entries/{id}")
    public void delete(@PathVariable String id) {
        entryService.delete(id);
    }
}


