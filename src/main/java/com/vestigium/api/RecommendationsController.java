package com.vestigium.api;

import com.vestigium.api.dto.EntryResponse;
import com.vestigium.api.dto.LlmRecommendRequest;
import com.vestigium.api.dto.LlmRecommendResponse;
import com.vestigium.service.EntryService;
import com.vestigium.service.RecommendationService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class RecommendationsController {

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
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "LLM recommendation failed: " + e.getMessage());
        }
    }
}


