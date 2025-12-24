package com.vestigium.api.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record BulkCreateEntriesResponse(
        int createdCount,
        int skippedCount,
        @NotNull List<ErrorItem> errors
) {
    public record ErrorItem(
            @NotNull String url,
            @NotNull String error
    ) {}
}


