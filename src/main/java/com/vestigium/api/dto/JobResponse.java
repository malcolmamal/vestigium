package com.vestigium.api.dto;

import com.vestigium.domain.Job;

public record JobResponse(
        String id,
        String type,
        String status,
        String entryId,
        int attempts,
        String lockedAt,
        String finishedAt,
        String lastError,
        String createdAt
) {
    public static JobResponse from(Job j) {
        return new JobResponse(
                j.id(),
                j.type(),
                j.status(),
                j.entryId(),
                j.attempts(),
                j.lockedAt(),
                j.finishedAt(),
                j.lastError(),
                j.createdAt()
        );
    }
}


