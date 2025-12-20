package com.vestigium.api;

import com.vestigium.persistence.TagRepository;
import com.vestigium.api.dto.TagSuggestionResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class TagsController {

    private final TagRepository tags;

    public TagsController(TagRepository tags) {
        this.tags = tags;
    }

    @GetMapping("/api/tags")
    public List<String> search(
            @RequestParam(value = "prefix", required = false) String prefix,
            @RequestParam(value = "limit", defaultValue = "20") @Min(1) @Max(500) int limit
    ) {
        return tags.searchByPrefix(prefix, limit);
    }

    @GetMapping("/api/tags/suggest")
    public List<TagSuggestionResponse> suggest(
            @RequestParam(value = "prefix", required = false) String prefix,
            @RequestParam(value = "limit", defaultValue = "20") @Min(1) @Max(500) int limit
    ) {
        return tags.suggestByPrefix(prefix, limit).stream().map(TagSuggestionResponse::from).toList();
    }
}


