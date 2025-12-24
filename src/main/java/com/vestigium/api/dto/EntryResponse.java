package com.vestigium.api.dto;

import com.vestigium.domain.Entry;
import java.util.List;

public record EntryResponse(
        String id,
        String url,
        String title,
        String description,
        String detailedDescription,
        List<String> tags,
        boolean important,
        String visitedAt,
        String createdAt,
        String updatedAt,
        String thumbnailUrl,
        String thumbnailLargeUrl
) {
    public static EntryResponse from(Entry e) {
        return new EntryResponse(
                e.id(),
                e.url(),
                e.title(),
                e.description(),
                e.detailedDescription(),
                e.tags(),
                e.important(),
                e.visitedAt(),
                e.createdAt(),
                e.updatedAt(),
                "/api/entries/" + e.id() + "/thumbnail",
                "/api/entries/" + e.id() + "/thumbnail?size=large"
        );
    }
}


