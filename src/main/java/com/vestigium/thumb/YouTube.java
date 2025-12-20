package com.vestigium.thumb;

import java.net.URI;
import java.util.Optional;

public final class YouTube {

    private YouTube() {}

    public static Optional<String> extractVideoId(String url) {
        try {
            var uri = URI.create(url);
            var host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
            if (host.endsWith("youtu.be")) {
                var path = uri.getPath();
                if (path != null && path.length() > 1) {
                    return Optional.of(path.substring(1));
                }
            }
            if (host.endsWith("youtube.com") || host.endsWith("www.youtube.com")) {
                var query = uri.getQuery();
                if (query != null) {
                    for (var part : query.split("&")) {
                        var kv = part.split("=", 2);
                        if (kv.length == 2 && kv[0].equals("v") && !kv[1].isBlank()) {
                            return Optional.of(kv[1]);
                        }
                    }
                }
                var path = uri.getPath();
                if (path != null && path.startsWith("/shorts/")) {
                    var id = path.substring("/shorts/".length());
                    var slash = id.indexOf('/');
                    if (slash > 0) {
                        id = id.substring(0, slash);
                    }
                    if (!id.isBlank()) {
                        return Optional.of(id);
                    }
                }
            }
            return Optional.empty();
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    public static String hqThumbnailUrl(String videoId) {
        return "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg";
    }
}


