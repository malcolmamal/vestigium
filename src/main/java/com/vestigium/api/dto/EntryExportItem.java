package com.vestigium.api.dto;

import com.vestigium.domain.Entry;
import java.util.List;

public record EntryExportItem(
        String id,
        String url,
        String addedAt,
        String thumbnailPath,
        String thumbnailLargePath,
        String title,
        String description,
        String detailedDescription,
        List<String> lists,
        List<String> tags
) {
    public static EntryExportItem from(Entry e) {
        return new EntryExportItem(
                e.id(),
                e.url(),
                e.createdAt(),
                e.thumbnailPath(),
                e.thumbnailLargePath(),
                e.title(),
                e.description(),
                e.detailedDescription(),
                List.of(),
                e.tags()
        );
    }
}


