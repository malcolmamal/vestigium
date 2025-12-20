package com.vestigium.api.dto;

import java.util.List;

public record BulkCreateEntriesResponse(
        int createdCount,
        int skippedCount,
        List<ErrorItem> errors
) {
    public record ErrorItem(String url, String error) {}
}


