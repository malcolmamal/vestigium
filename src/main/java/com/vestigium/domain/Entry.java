package com.vestigium.domain;

import java.util.List;

public record Entry(
        String id,
        String url,
        String title,
        String description,
        String detailedDescription,
        String thumbnailPath,
        String thumbnailLargePath,
        String visitedAt,
        boolean important,
        String createdAt,
        String updatedAt,
        String manualThumbnailUrl,
        boolean aiSafe,
        String aiContext,
        List<String> tags
) {}


