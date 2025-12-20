package com.vestigium.api.dto;

import java.util.List;

public record EntryListResponse(
        int page,
        int pageSize,
        List<EntryResponse> items
) {}


