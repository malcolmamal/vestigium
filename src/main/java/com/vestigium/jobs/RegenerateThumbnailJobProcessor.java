package com.vestigium.jobs;

import com.vestigium.persistence.EntryRepository;
import com.vestigium.storage.FileStorageService;
import com.vestigium.thumb.ImageThumbs;
import com.vestigium.thumb.PageScreenshotter;
import com.vestigium.thumb.ThumbnailFetcher;
import com.vestigium.thumb.YouTube;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class RegenerateThumbnailJobProcessor implements JobProcessor {

    private final EntryRepository entries;
    private final ThumbnailFetcher fetcher;
    private final PageScreenshotter screenshotter;
    private final FileStorageService fileStorage;

    public RegenerateThumbnailJobProcessor(
            EntryRepository entries,
            ThumbnailFetcher fetcher,
            PageScreenshotter screenshotter,
            FileStorageService fileStorage
    ) {
        this.entries = entries;
        this.fetcher = fetcher;
        this.screenshotter = screenshotter;
        this.fileStorage = fileStorage;
    }

    @Override
    public String type() {
        return "REGENERATE_THUMBNAIL";
    }

    @Override
    public void process(com.vestigium.domain.Job job) throws Exception {
        var entry = entries.getById(job.entryId()).orElseThrow();

        byte[] sourceImage = tryGetYouTubeThumb(entry.url())
                .or(() -> tryGetOgImage(entry.url()))
                .orElseGet(() -> screenshotter.screenshotPng(entry.url()));

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
                    return fetcher.downloadBytes(imgUrl);
                } catch (Exception e) {
                    return Optional.empty();
                }
            });
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}


