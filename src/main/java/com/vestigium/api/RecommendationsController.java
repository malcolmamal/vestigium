package com.vestigium.api;

import com.vestigium.api.dto.EntryResponse;
import com.vestigium.api.dto.LlmRecommendRequest;
import com.vestigium.api.dto.LlmRecommendResponse;
import com.vestigium.service.EntryService;
import com.vestigium.service.RecommendationService;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class RecommendationsController {

    private static final Logger log = LoggerFactory.getLogger(RecommendationsController.class);

    private final RecommendationService recommendationService;
    private final EntryService entryService;

    public RecommendationsController(RecommendationService recommendationService, EntryService entryService) {
        this.recommendationService = recommendationService;
        this.entryService = entryService;
    }

    @GetMapping("/api/recommendations/random")
    public List<EntryResponse> random(
            @RequestParam(value = "limit", defaultValue = "20") int limit,
            @RequestParam(value = "includeNsfw", defaultValue = "true") boolean includeNsfw
    ) {
        var entries = recommendationService.randomUnvisited(limit, includeNsfw);
        return entryService.toResponses(entries);
    }

    @PostMapping("/api/recommendations/llm")
    public LlmRecommendResponse llm(@RequestBody LlmRecommendRequest req) {
        try {
            var includeNsfw = req != null && req.includeNsfw() != null ? req.includeNsfw() : true;
            var limit = req != null && req.limit() != null ? req.limit() : 10;
            var promptId = req == null ? null : req.promptId();
            var customPrompt = req == null ? null : req.customPrompt();

            var res = recommendationService.recommendWithLlm(promptId, customPrompt, limit, includeNsfw);
            var entryIds = res.items().stream().map(i -> i.entry().id()).toList();
            var entryResponses = entryService.toResponses(res.items().stream().map(RecommendationService.LlmItem::entry).toList());
            var responsesById = entryResponses.stream().collect(java.util.stream.Collectors.toMap(EntryResponse::id, r -> r));

            var items = res.items().stream()
                    .map(i -> new LlmRecommendResponse.Item(responsesById.get(i.entry().id()), i.reason()))
                    .toList();
            return new LlmRecommendResponse(items);
        } catch (Exception e) {
            log.error("LLM recommendation failed", e);
            throw mapLlmFailure(e);
        }
    }

    private static ResponseStatusException mapLlmFailure(Exception e) {
        var root = rootCause(e);
        var msg = root.getMessage() == null ? "Unknown LLM error" : root.getMessage();
        log.error("LLM root cause: {}", msg);
        if (msg.contains("Missing GOOGLE_API_KEY")) {
            return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing Google API key. Set GOOGLE_API_KEY or google-api-key file.");
        }
        var status = extractGeminiStatus(msg);
        if (status != null) {
            if (status == 401) {
                return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Gemini API key unauthorized (401). Check key permissions.");
            }
            if (status == 403) {
                return new ResponseStatusException(HttpStatus.FORBIDDEN, "Gemini API access forbidden (403). Check project/permissions/quota.");
            }
            if (status == 404) {
                return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gemini model not found (404). Check model name.");
            }
            if (status == 429) {
                return new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Gemini quota exceeded (429). Try again later.");
            }
            if (status >= 500) {
                return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Gemini service error (" + status + "). Try again later.");
            }
        }
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, "LLM recommendation failed: " + msg);
    }

    private static Integer extractGeminiStatus(String msg) {
        try {
            var idx = msg.indexOf("HTTP ");
            if (idx < 0) return null;
            var start = idx + 5;
            var end = start;
            while (end < msg.length() && Character.isDigit(msg.charAt(end))) {
                end++;
            }
            if (end == start) return null;
            return Integer.parseInt(msg.substring(start, end));
        } catch (Exception ignored) {
            return null;
        }
    }

    private static Throwable rootCause(Throwable e) {
        var cur = e;
        while (cur.getCause() != null && cur.getCause() != cur) {
            cur = cur.getCause();
        }
        return cur;
    }
}


