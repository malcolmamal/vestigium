package com.vestigium.api.dto;

public record LlmRecommendRequest(
        String promptId,
        String customPrompt,
        Integer limit,
        Boolean includeNsfw
) {}


