package com.vestigium.api.dto;

import com.vestigium.domain.Attachment;
import jakarta.validation.constraints.NotNull;

public record AttachmentResponse(
        @NotNull String id,
        @NotNull String kind,
        @NotNull String originalName,
        @NotNull String mimeType,
        long sizeBytes,
        @NotNull String downloadUrl
) {
    public static AttachmentResponse from(Attachment a) {
        return new AttachmentResponse(
                a.id(),
                a.kind(),
                a.originalName(),
                a.mimeType(),
                a.sizeBytes(),
                "/api/attachments/" + a.id()
        );
    }
}


