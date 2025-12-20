package com.vestigium.enrich;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vestigium.thumb.YouTube;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class YouTubeMetadataFetcher {

    private final ObjectMapper objectMapper;
    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public YouTubeMetadataFetcher(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Uses YouTube oEmbed (public) to fetch the video title (and some basic metadata).
     */
    public Optional<YouTubeMetadata> fetch(String url) {
        if (url == null || url.isBlank()) {
            return Optional.empty();
        }
        if (YouTube.extractVideoId(url).isEmpty()) {
            return Optional.empty();
        }

        try {
            var encodedUrl = URLEncoder.encode(url, StandardCharsets.UTF_8);
            var oembed = URI.create("https://www.youtube.com/oembed?format=json&url=" + encodedUrl);
            var req = HttpRequest.newBuilder(oembed)
                    .timeout(Duration.ofSeconds(15))
                    .header("User-Agent", "vestigium/0.1")
                    .GET()
                    .build();
            var resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
                return Optional.empty();
            }
            JsonNode root = objectMapper.readTree(resp.body());
            var title = text(root, "title");
            var author = text(root, "author_name");
            var thumbnailUrl = text(root, "thumbnail_url");
            if (title == null || title.isBlank()) {
                return Optional.empty();
            }
            return Optional.of(new YouTubeMetadata(title, author, thumbnailUrl));
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private static String text(JsonNode node, String field) {
        if (node == null) {
            return null;
        }
        var v = node.path(field);
        if (v.isMissingNode() || v.isNull()) {
            return null;
        }
        var s = v.asText();
        return s == null || s.isBlank() ? null : s;
    }

    public record YouTubeMetadata(String title, String authorName, String thumbnailUrl) {}
}


