package com.vestigium.enrich;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class EnrichmentParser {

    private static final Pattern JSON_OBJECT = Pattern.compile("\\{[\\s\\S]*\\}");

    private final ObjectMapper objectMapper;

    public EnrichmentParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public EnrichmentResult parseFromModelText(String modelText) throws Exception {
        var trimmed = modelText == null ? "" : modelText.trim();
        var matcher = JSON_OBJECT.matcher(trimmed);
        if (!matcher.find()) {
            throw new IllegalArgumentException("No JSON object found in LLM output.");
        }
        var json = matcher.group();
        return objectMapper.readValue(json, EnrichmentResult.class);
    }
}


