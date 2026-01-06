package com.vestigium.jobs;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vestigium.persistence.EntryRepository;
import com.vestigium.storage.FileStorageService;
import com.vestigium.thumb.ImageThumbs;
import com.vestigium.thumb.PageScreenshotter;
import com.vestigium.thumb.ThumbnailFetcher;
import com.vestigium.thumb.YouTube;
import java.io.ByteArrayInputStream;
import java.util.Locale;
import java.util.Optional;
import javax.imageio.ImageIO;
import org.springframework.stereotype.Component;

@Component
public class RegenerateThumbnailJobProcessor implements JobProcessor {

    private final EntryRepository entries;
    private final ThumbnailFetcher fetcher;
    private final PageScreenshotter screenshotter;
    private final FileStorageService fileStorage;
    private final ObjectMapper objectMapper;

    public RegenerateThumbnailJobProcessor(
            EntryRepository entries,
            ThumbnailFetcher fetcher,
            PageScreenshotter screenshotter,
            FileStorageService fileStorage,
            ObjectMapper objectMapper
    ) {
        this.entries = entries;
        this.fetcher = fetcher;
        this.screenshotter = screenshotter;
        this.fileStorage = fileStorage;
        this.objectMapper = objectMapper;
    }

    @Override
    public String type() {
        return "REGENERATE_THUMBNAIL";
    }

    @Override
    public void process(com.vestigium.domain.Job job) throws Exception {
        var entry = entries.getById(job.entryId()).orElseThrow();

        Optional<String> manualUrl = Optional.empty();
        if (job.payloadJson() != null && !job.payloadJson().isBlank()) {
            try {
                var node = objectMapper.readTree(job.payloadJson());
                if (node.has("url")) {
                    manualUrl = Optional.of(node.get("url").asText());
                }
            } catch (Exception e) {
                // Ignore malformed payload
            }
        }
        // Fallback to entry's manualThumbnailUrl if no URL in payload
        if (manualUrl.isEmpty() && entry.manualThumbnailUrl() != null && !entry.manualThumbnailUrl().isBlank()) {
            manualUrl = Optional.of(entry.manualThumbnailUrl().trim());
        }

        byte[] sourceImage;
        if (manualUrl.isPresent()) {
            var url = manualUrl.get();
            sourceImage = fetcher.downloadBytes(url)
                    .orElseThrow(() -> new RuntimeException("Failed to download manual thumbnail from " + url));
        } else {
            sourceImage = tryGetYouTubeThumb(entry.url())
                    .or(() -> tryGetOgImage(entry.url()))
                    .orElseGet(() -> screenshotter.screenshotPng(entry.url()));
        }

        var jpegSmall = ImageThumbs.toJpegThumbnail(sourceImage, 360);
        var jpegLarge = ImageThumbs.toJpegThumbnail(sourceImage, 1280);

        var storedSmall = fileStorage.saveThumbnailJpeg(entry.id(), jpegSmall);
        var storedLarge = fileStorage.saveThumbnailJpeg(entry.id(), "large", jpegLarge);
        entries.updateThumbnailPaths(entry.id(), storedSmall.storagePath(), storedLarge.storagePath());
    }

    private Optional<byte[]> tryGetYouTubeThumb(String url) {
        return YouTube.extractVideoId(url)
                .flatMap(id -> {
                    try {
                        return fetcher.downloadBytes(YouTube.hqThumbnailUrl(id));
                    } catch (Exception e) {
                        return Optional.empty();
                    }
                });
    }

    private Optional<byte[]> tryGetOgImage(String url) {
        try {
            return fetcher.findOgImageUrl(url).flatMap(imgUrl -> {
                try {
                    var bytesOpt = fetcher.downloadBytes(imgUrl);
                    if (bytesOpt.isEmpty()) {
                        return Optional.empty();
                    }
                    var bytes = bytesOpt.get();
                    if (!shouldUseOgImage(url, imgUrl, bytes)) {
                        return Optional.empty();
                    }
                    return Optional.of(bytes);
                } catch (Exception e) {
                    return Optional.empty();
                }
            });
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private static boolean shouldUseOgImage(String pageUrl, String imgUrl, byte[] bytes) {
        if (bytes == null || bytes.length < 10_000) {
            // Many "logo" og images are tiny; prefer screenshot in that case.
            return false;
        }

        var imgLower = (imgUrl == null ? "" : imgUrl).toLowerCase(Locale.ROOT);
        var pageLower = (pageUrl == null ? "" : pageUrl).toLowerCase(Locale.ROOT);

        // Instagram often shows login prompts in screenshots, so prefer OG images when available.
        if (pageLower.contains("instagram.com")) {
            // Instagram OG images are usually good quality profile pictures or post images.
            return true;
        }

        // Reddit often sets og:image to a small logo; prefer a screenshot for better thumbnails.
        if (pageLower.contains("reddit.com") && (imgLower.contains("redditstatic") || imgLower.contains("logo") || imgLower.contains("icon"))) {
            return false;
        }

        // If we can decode the image, reject very small images (likely icons/logos).
        try {
            var img = ImageIO.read(new ByteArrayInputStream(bytes));
            if (img == null) {
                // Unknown format, but it's non-trivial bytes; allow.
                return true;
            }
            int w = img.getWidth();
            int h = img.getHeight();
            if (w <= 0 || h <= 0) {
                return false;
            }
            // Typical OG images are 1200x630; reject tiny ones.
            if (w < 400 || h < 200) {
                return false;
            }
        } catch (Exception ignored) {
            // If decode fails, allow (might be webp etc).
        }

        return true;
    }
}


