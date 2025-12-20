package com.vestigium.api.dto;

import com.vestigium.persistence.ListRepository;

public record ListResponse(
        String id,
        String name,
        int entryCount,
        String createdAt
) {
    public static ListResponse from(ListRepository.ListItem i) {
        return new ListResponse(i.id(), i.name(), i.entryCount(), i.createdAt());
    }
}


