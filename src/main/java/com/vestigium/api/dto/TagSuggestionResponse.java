package com.vestigium.api.dto;

import com.vestigium.persistence.TagRepository;
import jakarta.validation.constraints.NotNull;

public record TagSuggestionResponse(
        @NotNull String name,
        int count
) {
    public static TagSuggestionResponse from(TagRepository.TagSuggestion s) {
        return new TagSuggestionResponse(s.name(), s.count());
    }
}


