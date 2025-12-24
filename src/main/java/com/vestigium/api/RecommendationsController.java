package com.vestigium.api;

import com.vestigium.api.dto.EntryResponse;
import com.vestigium.api.dto.LlmRecommendRequest;
import com.vestigium.api.dto.LlmRecommendResponse;
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

    public RecommendationsController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/api/recommendations/random")
    public List<EntryResponse> random(
            @RequestParam(value = "limit", defaultValue = "20") int limit,
            @RequestParam(value = "includeNsfw", defaultValue = "true") boolean includeNsfw
    ) {
        return recommendationService.randomUnvisited(limit, includeNsfw).stream()
                .map(EntryResponse::from)
                .toList();
    }

    @PostMapping("/api/recommendations/llm")
    public LlmRecommendResponse llm(@RequestBody LlmRecommendRequest req) {
        try {
            var includeNsfw = req != null && req.includeNsfw() != null ? req.includeNsfw() : true;
            var limit = req != null && req.limit() != null ? req.limit() : 10;
            var promptId = req == null ? null : req.promptId();
            var customPrompt = req == null ? null : req.customPrompt();

            var res = recommendationService.recommendWithLlm(promptId, customPrompt, limit, includeNsfw);
            var items = res.items().stream()
                    .map(i -> new LlmRecommendResponse.Item(EntryResponse.from(i.entry()), i.reason()))
                    .toList();
            return new LlmRecommendResponse(items);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "LLM recommendation failed: " + e.getMessage());
        }
    }
}


