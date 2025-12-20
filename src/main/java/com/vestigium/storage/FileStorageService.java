package com.vestigium.storage;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;
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
        var fileName = entryId + ".jpg";
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


