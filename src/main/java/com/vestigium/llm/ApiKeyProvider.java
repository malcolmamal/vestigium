package com.vestigium.llm;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class ApiKeyProvider {

    private static final Pattern API_KEY_PATTERN = Pattern.compile("AIza[0-9A-Za-z\\-_]{20,}");

    public String getGoogleApiKey() {
        var env = System.getenv("GOOGLE_API_KEY");
        if (env != null && !env.isBlank()) {
            return normalize(env);
        }

        // Common alternative env name
        var envAlt = System.getenv("GOOGLE_AI_KEY");
        if (envAlt != null && !envAlt.isBlank()) {
            return normalize(envAlt);
        }
        try {
            var file = Path.of("google-api-key");
            if (Files.exists(file)) {
                var content = Files.readString(file);
                var parsed = parseKeyFromText(content);
                if (parsed != null && !parsed.isBlank()) {
                    return parsed;
                }
            }
        } catch (IOException ignored) {
            // Intentionally ignored - caller will get a clear error.
        }
        throw new IllegalStateException("Missing GOOGLE_API_KEY (env var) and google-api-key file.");
    }

    private static String parseKeyFromText(String text) {
        if (text == null) {
            return null;
        }
        var normalized = text.replace("\r\n", "\n").trim();
        if (normalized.isBlank()) {
            return null;
        }

        // Support .env style:
        // GOOGLE_API_KEY=...
        // GOOGLE_AI_KEY=...
        for (var line : normalized.split("\n")) {
            var l = line.trim();
            if (l.isBlank() || l.startsWith("#")) {
                continue;
            }
            var eq = l.indexOf('=');
            if (eq > 0) {
                var k = l.substring(0, eq).trim();
                var v = l.substring(eq + 1).trim();
                if (k.equals("GOOGLE_API_KEY") || k.equals("GOOGLE_AI_KEY")) {
                    return normalize(v);
                }
            }
        }

        // Otherwise: try to extract first API key-like token anywhere in text
        var m = API_KEY_PATTERN.matcher(normalized);
        if (m.find()) {
            return m.group();
        }

        // Fallback: first non-empty non-comment line
        for (var line : normalized.split("\n")) {
            var l = line.trim();
            if (!l.isBlank() && !l.startsWith("#")) {
                return normalize(l);
            }
        }
        return null;
    }

    private static String normalize(String raw) {
        if (raw == null) {
            return null;
        }
        var v = raw.trim();
        if ((v.startsWith("\"") && v.endsWith("\"")) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.substring(1, v.length() - 1).trim();
        }
        return v;
    }
}


