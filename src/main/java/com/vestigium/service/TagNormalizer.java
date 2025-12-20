package com.vestigium.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;

public final class TagNormalizer {

    private TagNormalizer() {}

    public static List<String> normalize(List<String> rawTags) {
        if (rawTags == null || rawTags.isEmpty()) {
            return List.of();
        }

        var unique = new LinkedHashSet<String>();
        for (var raw : rawTags) {
            if (raw == null) {
                continue;
            }
            var t = raw.trim().toLowerCase(Locale.ROOT);
            t = t.replaceAll("\\s+", " ");
            if (!t.isBlank()) {
                unique.add(t);
            }
        }
        return new ArrayList<>(unique);
    }
}


