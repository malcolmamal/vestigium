package com.vestigium.api.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record EntryListResponse(
        int page,
        int pageSize,
        long totalCount,
        @NotNull List<EntryResponse> items
) {}


