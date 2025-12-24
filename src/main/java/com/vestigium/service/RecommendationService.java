package com.vestigium.service;

import com.vestigium.domain.Entry;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vestigium.llm.GeminiClient;
import com.vestigium.persistence.EntryRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class RecommendationService {

    private final EntryRepository entries;
    private final GeminiClient gemini;
    private final LlmRecommendationParser parser;
    private final ObjectMapper objectMapper;

    public RecommendationService(EntryRepository entries, GeminiClient gemini, LlmRecommendationParser parser, ObjectMapper objectMapper) {
        this.entries = entries;
        this.gemini = gemini;
        this.parser = parser;
        this.objectMapper = objectMapper;
    }

    public List<Entry> randomUnvisited(int limit, boolean includeNsfw) {
        int l = Math.min(Math.max(limit, 1), 100);
        return entries.listRandomUnvisited(l, includeNsfw);
    }

    public LlmResult recommendWithLlm(String promptId, String customPrompt, int limit, boolean includeNsfw) throws Exception {
        int outLimit = Math.min(Math.max(limit, 1), 30);
        // sample up to 100 unvisited candidates (random if more exist)
        var candidates = entries.listRandomUnvisited(100, includeNsfw);
        if (candidates.isEmpty()) {
            return new LlmResult(List.of());
        }

        var userPrompt = buildUserPrompt(promptId, customPrompt);
        var prompt = buildPrompt(userPrompt, candidates);
        var modelText = gemini.generateText(prompt, List.of());
        var parsed = parser.parse(modelText);

        var byId = candidates.stream().collect(Collectors.toMap(Entry::id, e -> e, (a, b) -> a));
        var out = new java.util.ArrayList<LlmItem>();
        for (var rec : parsed.recommendations()) {
            var e = byId.get(rec.id());
            if (e == null) continue;
            out.add(new LlmItem(e, rec.reason()));
            if (out.size() >= outLimit) break;
        }
        // Fallback: if model didn't return usable ids, just return a few random ones.
        if (out.isEmpty()) {
            for (var e : candidates) {
                out.add(new LlmItem(e, "Random pick (LLM returned no usable ids)."));
                if (out.size() >= outLimit) break;
            }
        }
        return new LlmResult(List.copyOf(out));
    }

    private static String buildUserPrompt(String promptId, String customPrompt) {
        var p = (customPrompt == null ? "" : customPrompt.trim());
        if (!p.isBlank()) {
            return p;
        }
        var id = promptId == null ? "" : promptId.trim().toLowerCase();
        return switch (id) {
            case "movie" -> "I want to watch a good movie.";
            case "short_funny" -> "I want to watch something short and funny.";
            case "learn" -> "I want to learn something.";
            default -> "Recommend something I haven't viewed yet.";
        };
    }

    private String buildPrompt(String userPrompt, List<Entry> candidates) throws Exception {
        // Keep payload reasonably small: send only id/title/tags (+ short description if present).
        var items = new java.util.ArrayList<Map<String, Object>>();
        for (var e : candidates) {
            items.add(Map.of(
                    "id", e.id(),
                    "title", e.title() == null ? "" : e.title(),
                    "tags", e.tags() == null ? List.of() : e.tags(),
                    "description", e.description() == null ? "" : e.description()
            ));
        }

        var obj = objectMapper.writeValueAsString(items);
        return """
               You are a recommendation engine for a personal list of saved links (entries).

               The user goal:
               %s

               Candidates (JSON array):
               %s

               Return ONLY a single JSON object (no markdown) with this exact shape:
               {
                 "recommendations": [
                   { "id": "entry-id", "reason": "short reason" }
                 ]
               }

               Rules:
               - pick 5 to 15 items max
               - id MUST match one of the candidate ids exactly
               - reasons should be 1 sentence each
               """.formatted(userPrompt, obj);
    }

    public record LlmItem(Entry entry, String reason) {}
    public record LlmResult(List<LlmItem> items) {}
}


