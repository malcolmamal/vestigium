package com.vestigium.domain;

public record Attachment(
        String id,
        String entryId,
        String kind,
        String originalName,
        String mimeType,
        long sizeBytes,
        String storagePath,
        String createdAt
) {}


