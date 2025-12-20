package com.vestigium.api.dto;

import java.util.List;

public record ImportEntriesRequest(
        String mode,
        List<EntryExportItem> items
) {}


