package com.vestigium.api.dto;

import java.util.List;

public record ImportEntriesResponse(
        int createdCount,
        int updatedCount,
        int skippedCount,
        List<ErrorItem> errors
) {
    public record ErrorItem(String url, String error) {}
}


