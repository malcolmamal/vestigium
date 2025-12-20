package com.vestigium.api.dto;

import com.vestigium.domain.Attachment;

public record AttachmentResponse(
        String id,
        String kind,
        String originalName,
        String mimeType,
        long sizeBytes,
        String downloadUrl
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


