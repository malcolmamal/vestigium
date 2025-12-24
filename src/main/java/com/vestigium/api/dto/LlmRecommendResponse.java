package com.vestigium.api.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record LlmRecommendResponse(
        @NotNull List<Item> items
) {
    public record Item(
            @NotNull EntryResponse entry,
            String reason
    ) {}
}


