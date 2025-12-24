package com.vestigium.enrich;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.function.Supplier;
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
        return client.sendAsync(req, HttpResponse.BodyHandlers.ofString())
                .thenApply(resp -> {
                    if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
                        throw new IllegalStateException("Fetch failed: HTTP " + resp.statusCode());
                    }

                    Document doc = Jsoup.parse(resp.body(), url);
                    var title = firstNonBlank(
                            () -> attr(doc, "meta[property=og:title]", "content"),
                            () -> attr(doc, "meta[name=twitter:title]", "content"),
                            doc::title
                    );
                    var metaDescription = firstNonBlank(
                            () -> attr(doc, "meta[property=og:description]", "content"),
                            () -> attr(doc, "meta[name=twitter:description]", "content"),
                            () -> attr(doc, "meta[name=description]", "content")
                    );
                    doc.select("script,style,noscript").remove();
                    var text = doc.body() == null ? "" : doc.body().text();

                    return new PageContent(truncate(title, 300), truncate(metaDescription, 1000), truncate(text, 15000));
                }).get();
    }

    private static String attr(Document doc, String selector, String attr) {
        var el = doc.selectFirst(selector);
        if (el == null) {
            return null;
        }
        var v = el.attr(attr);
        return v == null || v.isBlank() ? null : v;
    }

    @SafeVarargs
    private static String firstNonBlank(Supplier<String>... suppliers) {
        if (suppliers == null) {
            return null;
        }
        for (var s : suppliers) {
            if (s == null) {
                continue;
            }
            var v = s.get();
            if (v != null && !v.isBlank()) {
                return v;
            }
        }
        return null;
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


