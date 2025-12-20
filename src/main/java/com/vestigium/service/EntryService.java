package com.vestigium.service;

import com.vestigium.domain.Attachment;
import com.vestigium.domain.Entry;
import com.vestigium.persistence.AttachmentRepository;
import com.vestigium.persistence.EntryRepository;
import com.vestigium.persistence.JobRepository;
import com.vestigium.persistence.TagRepository;
import com.vestigium.storage.FileStorageService;
import java.io.IOException;
import java.net.URI;
import java.util.List;
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

    public EntryService(
            EntryRepository entries,
            TagRepository tags,
            AttachmentRepository attachments,
            JobRepository jobs,
            FileStorageService fileStorage
    ) {
        this.entries = entries;
        this.tags = tags;
        this.attachments = attachments;
        this.jobs = jobs;
        this.fileStorage = fileStorage;
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

        var entry = entries.create(normalizedUrl, title, description, important);

        var normalizedTags = TagNormalizer.normalize(rawTags);
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

    public Entry update(String entryId, String title, String description, Boolean important, List<String> rawTags) {
        var existing = entries.getById(entryId)
                .orElseThrow(() -> new VestigiumException("ENTRY_NOT_FOUND", HttpStatus.NOT_FOUND, "Entry not found."));

        entries.updateCore(entryId, title, description, important);
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

    public List<Entry> search(String q, List<String> tags, Boolean important, Boolean visited, int page, int pageSize) {
        var normalizedTags = TagNormalizer.normalize(tags);
        return entries.search(q, normalizedTags, important, visited, page, pageSize);
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


