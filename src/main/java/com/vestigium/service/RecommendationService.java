package com.vestigium.service;

import com.vestigium.domain.Entry;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vestigium.llm.GeminiClient;
import com.vestigium.persistence.EntryRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class RecommendationService {

    private static final Logger log = LoggerFactory.getLogger(RecommendationService.class);
    private static final int LOG_SNIPPET_LIMIT = 12000;

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
        var safeCandidates = candidates.stream().filter(e -> !isProhibited(e)).toList();
        if (safeCandidates.isEmpty()) {
            return new LlmResult(List.of());
        }

        var userPrompt = buildUserPrompt(promptId, customPrompt);
        var prompt = buildPrompt(userPrompt, safeCandidates);
        var modelText = gemini.generateText(prompt, List.of());
        try {
            return parseAndBuild(modelText, safeCandidates, outLimit);
        } catch (Exception e) {
            log.error(
                    "LLM parse failed. Prompt(len={}): {}\nResponse(len={}): {}",
                    prompt == null ? 0 : prompt.length(),
                    snippet(prompt),
                    modelText == null ? 0 : modelText.length(),
                    snippet(modelText)
            );
            // Retry once with a stricter prompt and a smaller candidate set.
            var retryCandidates = safeCandidates.size() > 40 ? safeCandidates.subList(0, 40) : safeCandidates;
            var retryPrompt = buildPromptStrict(userPrompt, retryCandidates);
            var retryText = gemini.generateText(retryPrompt, List.of());
            try {
                return parseAndBuild(retryText, retryCandidates, outLimit);
            } catch (Exception retryErr) {
                log.error(
                        "LLM retry parse failed. Prompt(len={}): {}\nResponse(len={}): {}",
                        retryPrompt == null ? 0 : retryPrompt.length(),
                        snippet(retryPrompt),
                        retryText == null ? 0 : retryText.length(),
                        snippet(retryText)
                );
                throw retryErr;
            }
        }
    }

    private LlmResult parseAndBuild(String modelText, List<Entry> candidates, int outLimit) throws Exception {
        var parsed = parser.parseLenient(modelText);
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

    private static String snippet(String text) {
        if (text == null) return "<null>";
        if (text.length() <= LOG_SNIPPET_LIMIT) return text;
        return text.substring(0, LOG_SNIPPET_LIMIT) + "…";
    }

    private static String buildUserPrompt(String promptId, String customPrompt) {
        var p = (customPrompt == null ? "" : customPrompt.trim());
        var id = promptId == null ? "" : promptId.trim().toLowerCase();
        var base = switch (id) {
            case "movie" -> "I want to watch a good movie.";
            case "short_funny" -> "I want to watch something short and funny.";
            case "learn" -> "I want to learn something.";
            case "music" -> "I want to listen to some good music.";
            case "food" -> "I want to cook or eat something tasty.";
            case "workout" -> "I want something about fitness or workouts.";
            case "news" -> "I want to catch up on something interesting and current.";
            case "coding" -> "I want to learn or practice coding.";
            case "relax" -> "I want something relaxing.";
            case "surprise" -> "Surprise me with something good.";
            default -> "Recommend something I haven't viewed yet.";
        };

        // If no custom prompt is provided, use the preset only.
        if (p.isBlank()) {
            return base;
        }
        // If no preset was selected, treat the custom prompt as the full goal.
        if (id.isBlank()) {
            return p;
        }
        // Otherwise, treat custom text as extra context for the preset prompt.
        return base + "\nAdditional context: " + p;
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
                             OUTPUT FORMAT (must be exact JSON, no markdown, no code fences):
                             {
                                 "recommendations": [
                                     { "id": "entry-id", "reason": "short reason" }
                                 ]
                             }

                             IMPORTANT: Do NOT cut the output in the middle. Return the FULL JSON object.
                             If the JSON cannot be completed, return exactly: {"recommendations":[]}

                             You are a recommendation engine for a personal list of saved links (entries).

                             The user goal:
                             %s

                             Candidates (JSON array):
                             %s

                             Rules:
                             - pick at least 10 items
                             - id MUST match one of the candidate ids exactly
                             - reasons should be 1 sentence each
                             - output ONLY the JSON object above
                             """.formatted(userPrompt, obj);
    }

    private String buildPromptStrict(String userPrompt, List<Entry> candidates) throws Exception {
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
               OUTPUT FORMAT (must be exact JSON, no markdown, no code fences, one line only):
               {"recommendations":[{"id":"entry-id","reason":"short reason"}]}

             IMPORTANT: Do NOT cut the output in the middle. Return the FULL JSON object.
             If the JSON cannot be completed, return exactly: {"recommendations":[]}

               If you cannot comply, return EXACTLY:
               {"recommendations":[]}

               The user goal:
               %s

               Candidates (JSON array):
               %s

               Rules:
               - pick at least 10 items
               - id MUST match one of the candidate ids exactly
               - reasons should be 1 sentence each
               - output ONLY the JSON object above
               """.formatted(userPrompt, obj);
    }

    public record LlmItem(Entry entry, String reason) {}
    public record LlmResult(List<LlmItem> items) {}

    private static boolean isProhibited(Entry entry) {
        var title = entry.title() == null ? "" : entry.title().toLowerCase();
        var desc = entry.description() == null ? "" : entry.description().toLowerCase();
        var tags = entry.tags() == null ? List.<String>of() : entry.tags();
        var joinedTags = tags.stream().map(t -> t == null ? "" : t.toLowerCase()).collect(Collectors.joining(" "));
        var hay = title + " " + desc + " " + joinedTags;
        return containsAny(hay,
                "nsfw",
                "adult",
                "porn",
                "pornography",
                "erotica",
                "xxx",
                "nude",
                "nudity",
                "sex",
                "sexual",
                "fetish",
                "explicit",
                "redgifs",
                "onlyfans"
        );
    }

    private static boolean containsAny(String hay, String... needles) {
        if (hay == null || hay.isBlank()) return false;
        for (var n : needles) {
            if (hay.contains(n)) return true;
        }
        return false;
    }
}


