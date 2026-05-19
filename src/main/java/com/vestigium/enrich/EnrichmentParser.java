package com.vestigium.enrich;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

@Component
public class EnrichmentParser {

    private final ObjectMapper objectMapper;

    public EnrichmentParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public EnrichmentResult parseFromModelText(String modelText) throws Exception {
        var trimmed = modelText == null ? "" : modelText.trim();
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start == -1 || end == -1 || start > end) {
            throw new IllegalArgumentException("No JSON object found in LLM output.");
        }
        var json = trimmed.substring(start, end + 1);
        return objectMapper.readValue(json, EnrichmentResult.class);
    }
}


