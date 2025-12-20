package com.vestigium.api.dto;

import com.vestigium.persistence.TagRepository;

public record TagSuggestionResponse(String name, int count) {
    public static TagSuggestionResponse from(TagRepository.TagSuggestion s) {
        return new TagSuggestionResponse(s.name(), s.count());
    }
}


