package com.vestigium.api.dto;

import java.util.List;

public record PatchEntryRequest(
        String title,
        String description,
        Boolean important,
        List<String> tags
) {}


