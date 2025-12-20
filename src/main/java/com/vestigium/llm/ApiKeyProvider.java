package com.vestigium.llm;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.stereotype.Component;

@Component
public class ApiKeyProvider {

    public String getGoogleApiKey() {
        var env = System.getenv("GOOGLE_API_KEY");
        if (env != null && !env.isBlank()) {
            return env.trim();
        }
        try {
            var file = Path.of("google-api-key");
            if (Files.exists(file)) {
                var content = Files.readString(file).trim();
                if (!content.isBlank()) {
                    return content;
                }
            }
        } catch (IOException ignored) {
            // Intentionally ignored - caller will get a clear error.
        }
        throw new IllegalStateException("Missing GOOGLE_API_KEY (env var) and google-api-key file.");
    }
}


