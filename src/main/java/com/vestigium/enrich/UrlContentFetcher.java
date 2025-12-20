package com.vestigium.enrich;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Component;

@Component
public class UrlContentFetcher {

    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public PageContent fetchReadableText(String url) throws Exception {
        var req = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(20))
                .header("User-Agent", "vestigium/0.1")
                .GET()
                .build();
        var resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
            throw new IllegalStateException("Fetch failed: HTTP " + resp.statusCode());
        }

        Document doc = Jsoup.parse(resp.body());
        var title = doc.title();
        var metaDescription = doc.select("meta[name=description]").attr("content");
        doc.select("script,style,noscript").remove();
        var text = doc.body() == null ? "" : doc.body().text();

        return new PageContent(truncate(title, 300), truncate(metaDescription, 1000), truncate(text, 15000));
    }

    private static String truncate(String s, int max) {
        if (s == null) {
            return null;
        }
        if (s.length() <= max) {
            return s;
        }
        return s.substring(0, max);
    }

    public record PageContent(String title, String metaDescription, String text) {}
}


