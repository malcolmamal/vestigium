package com.vestigium.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class GeminiClient {

    private final ApiKeyProvider apiKeyProvider;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String model;

    public GeminiClient(
            ApiKeyProvider apiKeyProvider,
            ObjectMapper objectMapper,
            @Value("${vestigium.llm.model:gemini-2.5-flash}") String model
    ) {
        this.apiKeyProvider = apiKeyProvider;
        this.objectMapper = objectMapper;
        this.model = model;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public String generateText(String prompt, List<InlineImage> images) throws Exception {
        var primary = firstNonBlank(System.getenv("GEMINI_MODEL_3"), model);
        var fallback = firstNonBlank(System.getenv("GEMINI_MODEL"), model);
        var primaryName = primary == null ? model : primary;
        var fallbackName = fallback == null ? model : fallback;

        try {
            return generateTextWithModel(primaryName, prompt, images);
        } catch (Exception e) {
            if (fallbackName != null && !fallbackName.equals(primaryName)) {
                return generateTextWithModel(fallbackName, prompt, images);
            }
            throw e;
        }
    }

    private String generateTextWithModel(String modelName, String prompt, List<InlineImage> images) throws Exception {
        var key = apiKeyProvider.getGoogleApiKey();
        var url = URI.create("https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + key);

        var parts = new java.util.ArrayList<Map<String, Object>>();
        parts.add(Map.of("text", prompt));
        if (images != null) {
            for (var img : images) {
                parts.add(Map.of(
                        "inlineData",
                        Map.of(
                                "mimeType", img.mimeType(),
                                "data", Base64.getEncoder().encodeToString(img.bytes())
                        )
                ));
            }
        }

        var body = Map.of(
                "contents", List.of(Map.of("role", "user", "parts", parts)),
                "generationConfig", Map.of(
                        "temperature", 0.2,
                        "maxOutputTokens", 2048
                )
        );

        var json = objectMapper.writeValueAsString(body);
        var req = HttpRequest.newBuilder(url)
                .timeout(Duration.ofSeconds(60))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        return httpClient.sendAsync(req, HttpResponse.BodyHandlers.ofString())
                .thenApply(resp -> {
                    if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
                        var bodySnippet = resp.body() == null ? "" : resp.body();
                        if (bodySnippet.length() > 400) {
                            bodySnippet = bodySnippet.substring(0, 400);
                        }
                        throw new IllegalStateException("Gemini error (" + modelName + "): HTTP " + resp.statusCode() + " body=" + bodySnippet);
                    }

                    try {
                        JsonNode root = objectMapper.readTree(resp.body());
                        var textNode = root.at("/candidates/0/content/parts/0/text");
                        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
                            throw new IllegalStateException("Gemini returned empty response (" + modelName + "). Body: " + resp.body());
                        }
                        return textNode.asText();
                    } catch (Exception e) {
                        throw new RuntimeException("Failed to parse Gemini response (" + modelName + "): " + e.getMessage() + (resp.body() != null ? " Body: " + resp.body() : ""), e);
                    }
                }).get();
    }

    private static String firstNonBlank(String preferred, String fallback) {
        var p = normalize(preferred);
        if (p != null) return p;
        return normalize(fallback);
    }

    private static String normalize(String value) {
        if (value == null) return null;
        var v = value.trim();
        return v.isEmpty() ? null : v;
    }

    public record InlineImage(String mimeType, byte[] bytes) {
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            InlineImage that = (InlineImage) o;
            return java.util.Objects.equals(mimeType, that.mimeType) && java.util.Arrays.equals(bytes, that.bytes);
        }

        @Override
        public int hashCode() {
            int result = java.util.Objects.hash(mimeType);
            result = 31 * result + java.util.Arrays.hashCode(bytes);
            return result;
        }

        @Override
        public String toString() {
            return "InlineImage{" +
                    "mimeType='" + mimeType + '\'' +
                    ", bytes=" + java.util.Arrays.toString(bytes) +
                    '}';
        }
    }
}


