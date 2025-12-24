package com.vestigium.api.dto;

import java.util.List;

public record LlmRecommendResponse(
        List<Item> items
) {
    public record Item(
            EntryResponse entry,
            String reason
    ) {}
}


