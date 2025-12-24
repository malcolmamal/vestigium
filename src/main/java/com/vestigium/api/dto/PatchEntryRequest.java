package com.vestigium.api.dto;

import java.util.List;

public record PatchEntryRequest(
        String title,
        String description,
        String detailedDescription,
        Boolean important,
        List<String> tags
) {}


