package com.vestigium.api.dto;

import com.vestigium.domain.Entry;
import java.util.List;

public record EntryExportItem(
        String id,
        String url,
        String addedAt,
        String title,
        String description,
        List<String> tags
) {
    public static EntryExportItem from(Entry e) {
        return new EntryExportItem(e.id(), e.url(), e.createdAt(), e.title(), e.description(), e.tags());
    }
}


