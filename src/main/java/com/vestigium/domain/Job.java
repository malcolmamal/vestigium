package com.vestigium.domain;

public record Job(
        String id,
        String type,
        String status,
        String entryId,
        String payloadJson,
        int attempts,
        String lockedAt,
        String finishedAt,
        String lastError,
        String createdAt
) {}


