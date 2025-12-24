package com.vestigium.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

@Service
public class NsfwConfigService {

    private static final Logger log = LoggerFactory.getLogger(NsfwConfigService.class);
    private final List<String> nsfwTags;

    public NsfwConfigService(ObjectMapper objectMapper) {
        this.nsfwTags = loadNsfwTags(objectMapper);
    }

    private List<String> loadNsfwTags(ObjectMapper objectMapper) {
        try {
            var resource = new ClassPathResource("nsfw-tags.json");
            if (!resource.exists()) {
                log.warn("nsfw-tags.json not found in classpath, using empty list");
                return Collections.emptyList();
            }
            try (InputStream in = resource.getInputStream()) {
                List<String> tags = objectMapper.readValue(in, new TypeReference<>() {});
                log.info("Loaded {} NSFW tags from config", tags.size());
                return Collections.unmodifiableList(tags);
            }
        } catch (IOException e) {
            log.error("Failed to load nsfw-tags.json", e);
            return Collections.emptyList();
        }
    }

    public List<String> getNsfwTags() {
        return nsfwTags;
    }
}

