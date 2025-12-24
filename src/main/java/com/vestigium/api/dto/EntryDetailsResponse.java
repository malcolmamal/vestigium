package com.vestigium.api.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record EntryDetailsResponse(
        @NotNull EntryResponse entry,
        @NotNull List<AttachmentResponse> attachments
) {}


