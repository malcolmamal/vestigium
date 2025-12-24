package com.vestigium.service;

import com.vestigium.domain.Attachment;
import com.vestigium.domain.Entry;
import com.vestigium.enrich.UrlContentFetcher;
import com.vestigium.enrich.YouTubeMetadataFetcher;
import com.vestigium.persistence.AttachmentRepository;
import com.vestigium.persistence.EntryRepository;
import com.vestigium.persistence.JobRepository;
import com.vestigium.persistence.TagRepository;
import com.vestigium.storage.FileStorageService;
import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class EntryService {

    private final EntryRepository entries;
    private final TagRepository tags;
    private final AttachmentRepository attachments;
    private final JobRepository jobs;
    private final FileStorageService fileStorage;
    private final UrlContentFetcher urlFetcher;
    private final YouTubeMetadataFetcher youtubeMetadata;
    private final com.vestigium.persistence.ListRepository lists;

    public EntryService(
            EntryRepository entries,
            TagRepository tags,
            AttachmentRepository attachments,
            JobRepository jobs,
            FileStorageService fileStorage,
            UrlContentFetcher urlFetcher,
            YouTubeMetadataFetcher youtubeMetadata,
            com.vestigium.persistence.ListRepository lists
    ) {
        this.entries = entries;
        this.tags = tags;
        this.attachments = attachments;
        this.jobs = jobs;
        this.fileStorage = fileStorage;
        this.urlFetcher = urlFetcher;
        this.youtubeMetadata = youtubeMetadata;
        this.lists = lists;
    }

    public CreatedEntry create(
            String url,
            String title,
            String description,
            List<String> rawTags,
            boolean important,
            List<MultipartFile> uploadFiles
    ) {
        var normalizedUrl = normalizeUrl(url);

        if (entries.getByUrl(normalizedUrl).isPresent()) {
            throw new VestigiumException("ENTRY_URL_ALREADY_EXISTS", HttpStatus.CONFLICT, "URL already exists.");
        }

        var inferred = inferMetadata(normalizedUrl, title, description, rawTags);
        var entry = entries.create(normalizedUrl, inferred.title(), inferred.description(), important);

        var normalizedTags = TagNormalizer.normalize(inferred.tags());
        if (!normalizedTags.isEmpty()) {
            entries.replaceTags(entry.id(), normalizedTags, tags);
            entry = entries.getById(entry.id()).orElseThrow();
        }

        var createdAttachments = saveAttachments(entry.id(), uploadFiles);

        // Always enqueue enrichment; worker decides how to enrich (URL-only vs attachments).
        jobs.enqueue("ENRICH_ENTRY", entry.id(), null);
        jobs.enqueue("REGENERATE_THUMBNAIL", entry.id(), null);

        return new CreatedEntry(entry, createdAttachments);
    }

    private InferredMetadata inferMetadata(String url, String title, String description, List<String> rawTags) {
        var outTitle = title;
        var outDescription = description;
        var outTags = rawTags;

        // Add obvious tags derived from URL when user didn't provide any tags.
        if (outTags == null || outTags.isEmpty()) {
            outTags = UrlTagger.tagsForUrl(url);
        }

        boolean needTitle = outTitle == null || outTitle.isBlank();
        boolean needDesc = outDescription == null || outDescription.isBlank();
        if (!needTitle && !needDesc) {
            return new InferredMetadata(outTitle, outDescription, outTags);
        }

        // Best-effort metadata fetch: never fail entry creation because of external fetch.
        try {
            if (needTitle) {
                var yt = youtubeMetadata.fetch(url);
                if (yt.isPresent() && yt.get().title() != null && !yt.get().title().isBlank()) {
                    outTitle = yt.get().title();
                    needTitle = false;
                }
            }
            if (needTitle || needDesc) {
                var page = urlFetcher.fetchReadableText(url);
                if (needTitle && page.title() != null && !page.title().isBlank()) {
                    outTitle = page.title();
                }
                if (needDesc && page.metaDescription() != null && !page.metaDescription().isBlank()) {
                    outDescription = page.metaDescription();
                }
            }
        } catch (Exception ignored) {
            // ignore
        }
        return new InferredMetadata(outTitle, outDescription, outTags);
    }

    private record InferredMetadata(String title, String description, List<String> tags) {}

    public Entry update(String entryId, String title, String description, String detailedDescription, Boolean important, List<String> rawTags) {
        var existing = entries.getById(entryId)
                .orElseThrow(() -> new VestigiumException("ENTRY_NOT_FOUND", HttpStatus.NOT_FOUND, "Entry not found."));

        entries.updateCore(entryId, title, description, detailedDescription, important);
        if (rawTags != null) {
            entries.replaceTags(entryId, TagNormalizer.normalize(rawTags), tags);
        }
        return entries.getById(existing.id()).orElseThrow();
    }

    public void markVisited(String entryId) {
        if (entries.getById(entryId).isEmpty()) {
            throw new VestigiumException("ENTRY_NOT_FOUND", HttpStatus.NOT_FOUND, "Entry not found.");
        }
        entries.setVisitedNow(entryId);
    }

    public void enqueueEnrich(String entryId) {
        if (entries.getById(entryId).isEmpty()) {
            throw new VestigiumException("ENTRY_NOT_FOUND", HttpStatus.NOT_FOUND, "Entry not found.");
        }
        jobs.enqueue("ENRICH_ENTRY", entryId, "{\"force\":true}");
    }

    public void enqueueThumbnail(String entryId) {
        if (entries.getById(entryId).isEmpty()) {
            throw new VestigiumException("ENTRY_NOT_FOUND", HttpStatus.NOT_FOUND, "Entry not found.");
        }
        jobs.enqueue("REGENERATE_THUMBNAIL", entryId, null);
    }

    public void delete(String entryId) {
        if (entries.getById(entryId).isEmpty()) {
            throw new VestigiumException("ENTRY_NOT_FOUND", HttpStatus.NOT_FOUND, "Entry not found.");
        }
        entries.deleteById(entryId);
        try {
            fileStorage.deleteEntryData(entryId);
        } catch (Exception ignored) {
            // best-effort cleanup
        }
    }

    public BulkCreateResult bulkCreate(List<String> urls) {
        if (urls == null || urls.isEmpty()) {
            return new BulkCreateResult(0, 0, List.of());
        }

        int created = 0;
        int skipped = 0;
        var errors = new java.util.ArrayList<BulkCreateError>();

        // De-dupe within request (preserve order)
        var unique = new java.util.LinkedHashSet<String>();
        for (var u : urls) {
            if (u == null) continue;
            var t = u.trim();
            if (!t.isBlank()) unique.add(t);
        }

        for (var rawUrl : unique) {
            try {
                var normalized = normalizeUrl(rawUrl);
                if (entries.getByUrl(normalized).isPresent()) {
                    skipped++;
                    continue;
                }
                create(normalized, null, null, null, false, null);
                created++;
            } catch (Exception e) {
                errors.add(new BulkCreateError(rawUrl, e.getClass().getSimpleName() + ": " + Objects.toString(e.getMessage(), "")));
            }
        }
        return new BulkCreateResult(created, skipped, errors);
    }

    public record BulkCreateError(String url, String error) {}
    public record BulkCreateResult(int createdCount, int skippedCount, List<BulkCreateError> errors) {}

    public ExportResult exportAll() {
        var all = entries.listAllForExport();
        var items = all.stream()
                .map(e -> new ExportItem(
                        e.id(),
                        e.url(),
                        e.createdAt(),
                        e.thumbnailPath(),
                        e.thumbnailLargePath(),
                        e.title(),
                        e.description(),
                        e.detailedDescription(),
                        this.lists.listNamesForEntry(e.id()),
                        TagNormalizer.normalize(e.tags())
                ))
                .toList();
        return new ExportResult(items);
    }

    public ImportResult importEntries(String mode, List<ExportItem> items) {
        if (items == null || items.isEmpty()) {
            return new ImportResult(0, 0, 0, List.of());
        }

        var m = mode == null ? "skip" : mode.trim().toLowerCase();
        if (!m.equals("skip") && !m.equals("update")) {
            throw new VestigiumException("IMPORT_MODE_INVALID", HttpStatus.BAD_REQUEST, "mode must be 'skip' or 'update'");
        }

        int created = 0;
        int updated = 0;
        int skipped = 0;
        var errors = new java.util.ArrayList<ImportError>();

        for (var item : items) {
            if (item == null || item.url() == null || item.url().isBlank()) {
                continue;
            }
            var rawUrl = item.url().trim();
            try {
                var normalized = normalizeUrl(rawUrl);
                var existingOpt = entries.getByUrl(normalized);
                if (existingOpt.isEmpty()) {
                    createImported(
                            normalized,
                            item.addedAt(),
                            item.thumbnailPath(),
                            item.thumbnailLargePath(),
                            item.title(),
                            item.description(),
                            item.detailedDescription(),
                            item.lists(),
                            item.tags()
                    );
                    created++;
                    continue;
                }
                var existing = existingOpt.get();
                // Merge lists even in "skip" mode (additive, doesn't remove existing).
                mergeImportedLists(existing.id(), item.lists());

                if (m.equals("skip")) {
                    skipped++;
                    continue;
                }

                // Update core fields if present in import
                entries.updateCore(existing.id(), item.title(), item.description(), item.detailedDescription(), null);
                if (item.tags() != null) {
                    entries.replaceTags(existing.id(), TagNormalizer.normalize(item.tags()), tags);
                }
                if ((item.thumbnailPath() != null && !item.thumbnailPath().isBlank())
                        || (item.thumbnailLargePath() != null && !item.thumbnailLargePath().isBlank())) {
                    entries.updateThumbnailPaths(
                            existing.id(),
                            item.thumbnailPath() == null ? null : item.thumbnailPath().trim(),
                            item.thumbnailLargePath() == null ? null : item.thumbnailLargePath().trim()
                    );
                }
                updated++;
            } catch (Exception e) {
                errors.add(new ImportError(rawUrl, e.getClass().getSimpleName() + ": " + Objects.toString(e.getMessage(), "")));
            }
        }

        return new ImportResult(created, updated, skipped, errors);
    }

    private void createImported(
            String normalizedUrl,
            String addedAt,
            String thumbnailPath,
            String thumbnailLargePath,
            String title,
            String description,
            String detailedDescription,
            List<String> listNames,
            List<String> tags
    ) {
        if (entries.getByUrl(normalizedUrl).isPresent()) {
            throw new VestigiumException("ENTRY_URL_ALREADY_EXISTS", HttpStatus.CONFLICT, "URL already exists.");
        }
        var now = com.vestigium.persistence.InstantSql.nowIso();
        var createdAt = (addedAt == null || addedAt.isBlank()) ? now : addedAt.trim();
        var entry = entries.createWithTimestamps(normalizedUrl, title, description, false, createdAt, createdAt);
        if (detailedDescription != null && !detailedDescription.isBlank()) {
            entries.updateCore(entry.id(), null, null, detailedDescription.trim(), null);
            entry = entries.getById(entry.id()).orElseThrow();
        }

        if ((thumbnailPath != null && !thumbnailPath.isBlank())
                || (thumbnailLargePath != null && !thumbnailLargePath.isBlank())) {
            entries.updateThumbnailPaths(
                    entry.id(),
                    thumbnailPath == null ? null : thumbnailPath.trim(),
                    thumbnailLargePath == null ? null : thumbnailLargePath.trim()
            );
            entry = entries.getById(entry.id()).orElseThrow();
        }

        var normalizedTags = TagNormalizer.normalize(tags);
        if (!normalizedTags.isEmpty()) {
            entries.replaceTags(entry.id(), normalizedTags, this.tags);
            entry = entries.getById(entry.id()).orElseThrow();
        }

        mergeImportedLists(entry.id(), listNames);

        jobs.enqueue("ENRICH_ENTRY", entry.id(), null);
        jobs.enqueue("REGENERATE_THUMBNAIL", entry.id(), null);
    }

    private void mergeImportedLists(String entryId, List<String> listNames) {
        if (listNames == null || listNames.isEmpty()) {
            return;
        }
        var ids = new java.util.ArrayList<String>();
        for (var raw : listNames) {
            if (raw == null) continue;
            var name = raw.trim();
            if (name.isBlank()) continue;
            ids.add(this.lists.upsertByName(name));
        }
        if (!ids.isEmpty()) {
            this.lists.mergeEntryLists(entryId, ids);
        }
    }

    public record ExportItem(
            String id,
            String url,
            String addedAt,
            String thumbnailPath,
            String thumbnailLargePath,
            String title,
            String description,
            String detailedDescription,
            List<String> lists,
            List<String> tags
    ) {}
    public record ExportResult(List<ExportItem> items) {}
    public record ImportError(String url, String error) {}
    public record ImportResult(int createdCount, int updatedCount, int skippedCount, List<ImportError> errors) {}

    public List<Entry> search(
            String q,
            List<String> tags,
            Boolean important,
            Boolean visited,
            String addedFrom,
            String addedTo,
            String sort,
            List<String> listIds,
            boolean includeNsfw,
            int page,
            int pageSize
    ) {
        var normalizedTags = TagNormalizer.normalize(tags);
        return entries.search(q, normalizedTags, important, visited, addedFrom, addedTo, sort, listIds, includeNsfw, page, pageSize);
    }

    public List<com.vestigium.persistence.ListRepository.ListItem> listAllLists() {
        return lists.listAllWithCounts();
    }

    public com.vestigium.persistence.ListRepository.ListItem createList(String name) {
        if (name == null || name.trim().isBlank()) {
            throw new VestigiumException("LIST_NAME_REQUIRED", HttpStatus.BAD_REQUEST, "name is required");
        }
        var normalized = name.trim();
        return lists.create(normalized);
    }

    public void deleteList(String listId, boolean force) {
        if (listId == null || listId.isBlank()) {
            throw new VestigiumException("LIST_ID_REQUIRED", HttpStatus.BAD_REQUEST, "id is required");
        }
        var count = lists.countEntriesForList(listId);
        if (count > 0 && !force) {
            throw new VestigiumException("LIST_NOT_EMPTY", HttpStatus.CONFLICT, "List has linked entries.");
        }
        var deleted = lists.deleteById(listId);
        if (deleted == 0) {
            throw new VestigiumException("LIST_NOT_FOUND", HttpStatus.NOT_FOUND, "List not found.");
        }
    }

    public List<com.vestigium.persistence.ListRepository.ListItem> listListsForEntry(String entryId) {
        if (entries.getById(entryId).isEmpty()) {
            throw new VestigiumException("ENTRY_NOT_FOUND", HttpStatus.NOT_FOUND, "Entry not found.");
        }
        return lists.listForEntry(entryId);
    }

    public void replaceEntryLists(String entryId, List<String> listIds) {
        if (entries.getById(entryId).isEmpty()) {
            throw new VestigiumException("ENTRY_NOT_FOUND", HttpStatus.NOT_FOUND, "Entry not found.");
        }
        lists.replaceEntryLists(entryId, listIds);
    }

    public Entry getById(String id) {
        return entries.getById(id).orElseThrow(() -> new VestigiumException("ENTRY_NOT_FOUND", HttpStatus.NOT_FOUND, "Entry not found."));
    }

    public List<Attachment> listAttachments(String entryId) {
        if (entries.getById(entryId).isEmpty()) {
            throw new VestigiumException("ENTRY_NOT_FOUND", HttpStatus.NOT_FOUND, "Entry not found.");
        }
        return attachments.listForEntry(entryId);
    }

    private List<Attachment> saveAttachments(String entryId, List<MultipartFile> uploadFiles) {
        if (uploadFiles == null || uploadFiles.isEmpty()) {
            return List.of();
        }

        var out = new java.util.ArrayList<Attachment>();
        for (var file : uploadFiles) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            try {
                var stored = fileStorage.saveAttachment(entryId, file);
                out.add(
                        attachments.create(
                                entryId,
                                classifyAttachmentKind(stored.mimeType()),
                                stored.originalName(),
                                stored.mimeType(),
                                stored.sizeBytes(),
                                stored.storagePath()
                        )
                );
            } catch (IOException e) {
                throw new VestigiumException("ATTACHMENT_SAVE_FAILED", HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store attachment.");
            }
        }
        return out;
    }

    private static String classifyAttachmentKind(String mimeType) {
        if (mimeType == null) {
            return "OTHER";
        }
        var m = mimeType.toLowerCase();
        if (m.equals("application/pdf")) {
            return "PDF";
        }
        if (m.startsWith("image/")) {
            return "IMAGE";
        }
        return "OTHER";
    }

    private static String normalizeUrl(String url) {
        if (url == null || url.isBlank()) {
            throw new VestigiumException("URL_REQUIRED", HttpStatus.BAD_REQUEST, "url is required.");
        }
        try {
            var uri = URI.create(url.trim());
            if (uri.getScheme() == null || uri.getHost() == null) {
                throw new IllegalArgumentException("Missing scheme or host");
            }
            if (!uri.getScheme().equalsIgnoreCase("http") && !uri.getScheme().equalsIgnoreCase("https")) {
                throw new IllegalArgumentException("Only http/https supported");
            }
            // Normalize a bit (lowercase scheme/host)
            return new URI(
                    uri.getScheme().toLowerCase(),
                    uri.getUserInfo(),
                    uri.getHost().toLowerCase(),
                    uri.getPort(),
                    uri.getPath(),
                    uri.getQuery(),
                    uri.getFragment()
            ).toString();
        } catch (Exception e) {
            throw new VestigiumException("URL_INVALID", HttpStatus.BAD_REQUEST, "url is invalid.");
        }
    }

    public record CreatedEntry(Entry entry, List<Attachment> attachments) {}
}


