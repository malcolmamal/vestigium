package com.vestigium.api.dto;

import java.util.List;

public record PatchEntryRequest(
        String title,
        String description,
        String detailedDescription,
        String manualThumbnailUrl,
        Boolean important,
        List<String> tags
) {}


