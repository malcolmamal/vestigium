package com.vestigium.api.dto;

import java.util.List;

public record BulkCreateEntriesRequest(
        List<String> urls
) {}


