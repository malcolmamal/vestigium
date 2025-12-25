package com.vestigium.api.dto;

import com.vestigium.domain.Entry;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import java.util.List;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

public record EntryResponse(
        @Schema(requiredMode = REQUIRED) @NotNull String id,
        @Schema(requiredMode = REQUIRED) @NotNull String url,
        String title,
        String description,
        String detailedDescription,
        @Schema(requiredMode = REQUIRED) @NotNull List<String> tags,
        boolean important,
        String visitedAt,
        @Schema(requiredMode = REQUIRED) @NotNull String createdAt,
    @Schema(requiredMode = REQUIRED) @NotNull String updatedAt,
    @Schema(requiredMode = REQUIRED) @NotNull String thumbnailUrl,
    @Schema(requiredMode = REQUIRED) @NotNull String thumbnailLargeUrl,
    @Schema(requiredMode = REQUIRED) @NotNull boolean latestJobFailed
) {
    public static EntryResponse from(Entry e) {
        return from(e, false);
    }

    public static EntryResponse from(Entry e, boolean latestJobFailed) {
        return new EntryResponse(
                e.id(),
                e.url(),
                e.title(),
                e.description(),
                e.detailedDescription(),
                e.tags(),
                e.important(),
                e.visitedAt(),
                e.createdAt(),
                e.updatedAt(),
                "/api/entries/" + e.id() + "/thumbnail",
                "/api/entries/" + e.id() + "/thumbnail?size=large",
                latestJobFailed
        );
    }
}


