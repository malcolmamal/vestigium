package com.vestigium.api.dto;

import java.util.List;

public record EntryDetailsResponse(
        EntryResponse entry,
        List<AttachmentResponse> attachments
) {}


