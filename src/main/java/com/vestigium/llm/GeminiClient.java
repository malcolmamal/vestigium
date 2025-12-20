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
        var key = apiKeyProvider.getGoogleApiKey();
        var url = URI.create("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + key);

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

        var resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
            var bodySnippet = resp.body() == null ? "" : resp.body();
            if (bodySnippet.length() > 400) {
                bodySnippet = bodySnippet.substring(0, 400);
            }
            throw new IllegalStateException("Gemini error: HTTP " + resp.statusCode() + " body=" + bodySnippet);
        }

        JsonNode root = objectMapper.readTree(resp.body());
        var textNode = root.at("/candidates/0/content/parts/0/text");
        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            throw new IllegalStateException("Gemini returned empty response.");
        }
        return textNode.asText();
    }

    public record InlineImage(String mimeType, byte[] bytes) {}
}


