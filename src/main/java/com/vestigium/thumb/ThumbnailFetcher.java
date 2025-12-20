package com.vestigium.thumb;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Optional;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Component;

@Component
public class ThumbnailFetcher {

    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public Optional<String> findOgImageUrl(String pageUrl) throws Exception {
        var req = HttpRequest.newBuilder(URI.create(pageUrl))
                .timeout(Duration.ofSeconds(20))
                .header("User-Agent", "vestigium/0.1")
                .GET()
                .build();
        var resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
            return Optional.empty();
        }
        Document doc = Jsoup.parse(resp.body(), pageUrl);
        var ogEl = doc.selectFirst("meta[property=og:image]");
        if (ogEl != null) {
            var abs = ogEl.absUrl("content");
            if (abs != null && !abs.isBlank()) {
                return Optional.of(abs);
            }
            var raw = ogEl.attr("content");
            if (raw != null && !raw.isBlank()) {
                return Optional.of(raw);
            }
        }
        var twEl = doc.selectFirst("meta[name=twitter:image]");
        if (twEl != null) {
            var abs = twEl.absUrl("content");
            if (abs != null && !abs.isBlank()) {
                return Optional.of(abs);
            }
            var raw = twEl.attr("content");
            if (raw != null && !raw.isBlank()) {
                return Optional.of(raw);
            }
        }
        return Optional.empty();
    }

    public Optional<byte[]> downloadBytes(String url) throws Exception {
        var req = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(20))
                .header("User-Agent", "vestigium/0.1")
                .GET()
                .build();
        var resp = client.send(req, HttpResponse.BodyHandlers.ofByteArray());
        if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
            return Optional.empty();
        }
        if (resp.body() == null || resp.body().length == 0) {
            return Optional.empty();
        }
        return Optional.of(resp.body());
    }
}


