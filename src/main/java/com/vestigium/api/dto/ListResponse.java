package com.vestigium.api.dto;

import com.vestigium.persistence.ListRepository;
import jakarta.validation.constraints.NotNull;

public record ListResponse(
        @NotNull String id,
        @NotNull String name,
        int entryCount,
        @NotNull String createdAt
) {
    public static ListResponse from(ListRepository.ListItem i) {
        return new ListResponse(i.id(), i.name(), i.entryCount(), i.createdAt());
    }
}


