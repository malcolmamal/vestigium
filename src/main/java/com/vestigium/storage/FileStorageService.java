package com.vestigium.storage;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Stream;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    private final StoragePaths paths;

    public FileStorageService(StoragePaths paths) {
        this.paths = paths;
    }

    public StoredFile saveAttachment(String entryId, MultipartFile file) throws IOException {
        var originalName = file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename();
        var safeName = sanitizeFileName(originalName);
        var ext = extensionFromName(safeName);
        var id = UUID.randomUUID().toString();

        var entryDir = paths.attachmentsRoot().resolve(entryId).normalize();
        ensureUnderRoot(paths.attachmentsRoot(), entryDir);
        Files.createDirectories(entryDir);

        var storedFileName = ext.isEmpty() ? id : (id + "." + ext);
        var absolutePath = entryDir.resolve(storedFileName).normalize();
        ensureUnderRoot(paths.attachmentsRoot(), absolutePath);

        try (InputStream in = file.getInputStream()) {
            Files.copy(in, absolutePath, StandardCopyOption.REPLACE_EXISTING);
        }

        var relPath = paths.root().relativize(absolutePath).toString().replace('\\', '/');
        var mimeType = file.getContentType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : file.getContentType();
        return new StoredFile(relPath, safeName, mimeType, Files.size(absolutePath));
    }

    public StoredFile saveThumbnailJpeg(String entryId, byte[] jpegBytes) throws IOException {
        return saveThumbnailJpeg(entryId, null, jpegBytes);
    }

    /**
     * Stores a thumbnail JPEG for an entry. Variant is optional (e.g. "large").
     * If variant is null/blank, file name is "{entryId}.jpg". Otherwise "{entryId}-{variant}.jpg".
     */
    public StoredFile saveThumbnailJpeg(String entryId, String variant, byte[] jpegBytes) throws IOException {
        var suffix = (variant == null || variant.isBlank()) ? "" : ("-" + variant.trim().toLowerCase(Locale.ROOT));
        var fileName = entryId + suffix + ".jpg";
        var absolutePath = paths.thumbnailsRoot().resolve(fileName).normalize();
        ensureUnderRoot(paths.thumbnailsRoot(), absolutePath);
        Files.createDirectories(paths.thumbnailsRoot());
        Files.write(absolutePath, jpegBytes);
        var relPath = paths.root().relativize(absolutePath).toString().replace('\\', '/');
        return new StoredFile(relPath, fileName, MediaType.IMAGE_JPEG_VALUE, jpegBytes.length);
    }

    public Resource loadAsResource(String relativePath) {
        var absolute = paths.root().resolve(relativePath).normalize();
        ensureUnderRoot(paths.root(), absolute);
        return new FileSystemResource(absolute);
    }

    public void deleteEntryData(String entryId) throws IOException {
        if (entryId == null || entryId.isBlank()) {
            return;
        }

        // Attachments directory: files/{entryId}
        var entryDir = paths.attachmentsRoot().resolve(entryId).normalize();
        ensureUnderRoot(paths.attachmentsRoot(), entryDir);
        deleteRecursivelyIfExists(entryDir);

        // Thumbnails: thumbnails/{entryId}.jpg and thumbnails/{entryId}-*.jpg
        var thumbsDir = paths.thumbnailsRoot().normalize();
        ensureUnderRoot(paths.thumbnailsRoot(), thumbsDir);
        if (Files.exists(thumbsDir) && Files.isDirectory(thumbsDir)) {
            try (Stream<Path> stream = Files.list(thumbsDir)) {
                stream.forEach(p -> {
                    try {
                        var name = p.getFileName() == null ? "" : p.getFileName().toString();
                        if (name.startsWith(entryId) && name.endsWith(".jpg")) {
                            Files.deleteIfExists(p);
                        }
                    } catch (IOException ignored) {
                        // ignore best-effort cleanup
                    }
                });
            }
        }
    }

    private static void deleteRecursivelyIfExists(Path p) throws IOException {
        if (!Files.exists(p)) {
            return;
        }
        if (!Files.isDirectory(p)) {
            Files.deleteIfExists(p);
            return;
        }
        try (Stream<Path> walk = Files.walk(p)) {
            walk.sorted((a, b) -> b.compareTo(a)).forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException ignored) {
                    // ignore best-effort cleanup
                }
            });
        }
    }

    private static String sanitizeFileName(String name) {
        var cleaned = name.trim().replace('\\', '_').replace('/', '_');
        cleaned = cleaned.replaceAll("[^a-zA-Z0-9._ -]", "_");
        cleaned = cleaned.replaceAll("\\s+", " ");
        if (cleaned.isBlank()) {
            return "upload";
        }
        return cleaned;
    }

    private static String extensionFromName(String fileName) {
        var i = fileName.lastIndexOf('.');
        if (i < 0 || i == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(i + 1).toLowerCase(Locale.ROOT);
    }

    private static void ensureUnderRoot(Path root, Path candidate) {
        var r = root.toAbsolutePath().normalize();
        var c = candidate.toAbsolutePath().normalize();
        if (!c.startsWith(r)) {
            throw new IllegalArgumentException("Path escapes storage root");
        }
    }

    public record StoredFile(
            String storagePath,
            String originalName,
            String mimeType,
            long sizeBytes
    ) {}
}


