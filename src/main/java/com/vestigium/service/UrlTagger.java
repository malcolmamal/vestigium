package com.vestigium.service;

import java.net.URI;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

public final class UrlTagger {

    private UrlTagger() {}

    public static List<String> tagsForUrl(String url) {
        if (url == null || url.isBlank()) {
            return List.of();
        }

        var tags = new LinkedHashSet<String>();
        var host = host(url).orElse("");

        if (host.endsWith("imdb.com")) {
            tags.add("imdb");
        }
        if (host.endsWith("reddit.com")) {
            tags.add("reddit");
            subreddit(url).ifPresent(tags::add);
        }
        if (host.endsWith("redgifs.com")) {
            tags.add("redgifs");
        }
        if (host.endsWith("pornhub.com")) {
            tags.add("pornhub");
        }

        // YouTube is handled elsewhere too, but keeping it here makes tag derivation consistent.
        if (host.endsWith("youtu.be") || host.endsWith("youtube.com")) {
            tags.add("youtube");
            if (url.contains("/shorts/")) {
                tags.add("youtube-shorts");
            }
        }

        return new ArrayList<>(tags);
    }

    private static Optional<String> host(String url) {
        try {
            var uri = URI.create(url);
            var host = uri.getHost();
            if (host == null || host.isBlank()) {
                return Optional.empty();
            }
            var h = host.toLowerCase(Locale.ROOT);
            // normalize common prefixes
            if (h.startsWith("www.")) {
                h = h.substring(4);
            }
            return Optional.of(h);
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private static Optional<String> subreddit(String url) {
        try {
            var uri = URI.create(url);
            var path = uri.getPath() == null ? "" : uri.getPath();
            // /r/{sub}/...
            var parts = path.split("/");
            for (int i = 0; i < parts.length - 1; i++) {
                if ("r".equalsIgnoreCase(parts[i]) && i + 1 < parts.length) {
                    var sub = (parts[i + 1] == null ? "" : parts[i + 1]).trim().toLowerCase(Locale.ROOT);
                    if (!sub.isBlank()) {
                        return Optional.of(sub);
                    }
                }
            }
            return Optional.empty();
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }
}


