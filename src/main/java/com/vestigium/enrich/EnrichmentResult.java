package com.vestigium.enrich;

import java.util.List;

public record EnrichmentResult(
        String title,
        String description,
        String detailedDescription,
        List<String> tags
) {}


