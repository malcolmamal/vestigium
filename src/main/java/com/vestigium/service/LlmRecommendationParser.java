package com.vestigium.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class LlmRecommendationParser {

    private static final Pattern JSON_OBJECT = Pattern.compile("\\{[\\s\\S]*\\}");

    private final ObjectMapper objectMapper;

    public LlmRecommendationParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Result parse(String modelText) throws Exception {
        var trimmed = modelText == null ? "" : modelText.trim();
        var matcher = JSON_OBJECT.matcher(trimmed);
        if (!matcher.find()) {
            throw new IllegalArgumentException("No JSON object found in LLM output.");
        }
        var json = matcher.group();
        JsonNode root = objectMapper.readTree(json);
        var arr = root.path("recommendations");
        var out = new ArrayList<Item>();
        if (arr.isArray()) {
            for (var it : arr) {
                var id = text(it, "id");
                var reason = text(it, "reason");
                if (id == null || id.isBlank()) {
                    continue;
                }
                out.add(new Item(id, reason == null ? "" : reason));
            }
        }
        return new Result(List.copyOf(out));
    }

    private static String text(JsonNode node, String field) {
        if (node == null) return null;
        var v = node.path(field);
        if (v.isMissingNode() || v.isNull()) return null;
        var s = v.asText();
        return s == null || s.isBlank() ? null : s;
    }

    public record Item(String id, String reason) {}
    public record Result(List<Item> recommendations) {}
}


