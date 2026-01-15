package com.vestigium.api.dto;

import com.vestigium.domain.Job;
import jakarta.validation.constraints.NotNull;

public record JobResponse(
        @NotNull String id,
        @NotNull String type,
        @NotNull String status,
        @NotNull String entryId,
        int attempts,
        String lockedAt,
        String finishedAt,
        String lastError,
        String lastResponse,
        @NotNull String createdAt
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
                j.lastResponse(),
                j.createdAt()
        );
    }
}


