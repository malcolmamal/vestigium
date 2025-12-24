package com.vestigium.enrich;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Component;

@Component
public class ImdbMetadataFetcher {

    private final ObjectMapper objectMapper;
    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public ImdbMetadataFetcher(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Optional<ImdbMetadata> fetch(String url) {
        if (url == null || url.isBlank()) {
            return Optional.empty();
        }
        if (!looksLikeImdbTitleUrl(url)) {
            return Optional.empty();
        }

        try {
            var req = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(20))
                    .header("User-Agent", "vestigium/0.1")
                    .GET()
                    .build();
            var resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
                return Optional.empty();
            }

            Document doc = Jsoup.parse(resp.body(), url);
            var scripts = doc.select("script[type=application/ld+json]");
            for (var el : scripts) {
                var raw = el.data();
                if (raw == null || raw.isBlank()) {
                    raw = el.html();
                }
                if (raw == null || raw.isBlank()) {
                    continue;
                }

                var nodeOpt = tryParseJson(raw);
                if (nodeOpt.isEmpty()) {
                    continue;
                }

                var metaOpt = extractFromNode(nodeOpt.get());
                if (metaOpt.isPresent()) {
                    return metaOpt;
                }
            }
            return Optional.empty();
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private Optional<JsonNode> tryParseJson(String raw) {
        try {
            return Optional.of(objectMapper.readTree(raw));
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private Optional<ImdbMetadata> extractFromNode(JsonNode node) {
        if (node == null) {
            return Optional.empty();
        }
        if (node.isArray()) {
            for (var it : node) {
                var res = extractFromNode(it);
                if (res.isPresent()) {
                    return res;
                }
            }
            return Optional.empty();
        }

        if (!node.isObject()) {
            return Optional.empty();
        }

        // IMDb uses JSON-LD; we're interested in Movie/TVSeries-like nodes.
        var type = text(node, "@type");
        if (type == null || type.isBlank()) {
            return Optional.empty();
        }
        var t = type.toLowerCase();
        if (!(t.contains("movie") || t.contains("tvseries") || t.contains("tv") || t.contains("episode"))) {
            return Optional.empty();
        }

        var duration = text(node, "duration"); // often ISO-8601 like PT2H10M
        var datePublished = text(node, "datePublished");

        var stars = new ArrayList<String>();
        var actor = node.path("actor");
        if (actor.isArray()) {
            for (var a : actor) {
                var name = text(a, "name");
                if (name != null && !name.isBlank()) {
                    stars.add(name);
                }
                if (stars.size() >= 5) {
                    break;
                }
            }
        } else if (actor.isObject()) {
            var name = text(actor, "name");
            if (name != null && !name.isBlank()) {
                stars.add(name);
            }
        }

        if ((duration == null || duration.isBlank())
                && (datePublished == null || datePublished.isBlank())
                && stars.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(new ImdbMetadata(List.copyOf(stars), duration, datePublished));
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

    private static boolean looksLikeImdbTitleUrl(String url) {
        try {
            var uri = URI.create(url);
            var host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
            if (!(host.endsWith("imdb.com") || host.endsWith("www.imdb.com"))) {
                return false;
            }
            var path = uri.getPath() == null ? "" : uri.getPath();
            return path.contains("/title/tt");
        } catch (Exception ignored) {
            return false;
        }
    }

    public record ImdbMetadata(List<String> stars, String duration, String datePublished) {}
}


