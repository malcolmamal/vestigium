package com.vestigium.config;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class DataDirectoriesConfig {

    /**
     * Runs very early (before singletons are instantiated). We need this because Flyway will attempt to open a SQLite
     * connection during app startup, and the SQLite JDBC driver requires the parent directory to exist.
     */
    @Bean
    public static BeanFactoryPostProcessor ensureDataDirsExist(Environment env) {
        return beanFactory -> {
            ensureSqliteDbParentExists(env);
            ensureStorageRootExists(env);
        };
    }

    private static void ensureSqliteDbParentExists(Environment env) {
        var url = env.getProperty("spring.datasource.url");
        if (url == null || url.isBlank()) {
            return;
        }

        var lower = url.toLowerCase(Locale.ROOT);
        if (!lower.startsWith("jdbc:sqlite:")) {
            return;
        }

        var pathPart = url.substring("jdbc:sqlite:".length());
        if (pathPart.startsWith("file:")) {
            pathPart = pathPart.substring("file:".length());
        }
        if (pathPart.startsWith(":memory:")) {
            return;
        }
        var q = pathPart.indexOf('?');
        if (q >= 0) {
            pathPart = pathPart.substring(0, q);
        }
        if (pathPart.isBlank()) {
            return;
        }

        Path dbPath = Path.of(pathPart).toAbsolutePath().normalize();
        Path parent = dbPath.getParent();
        if (parent == null) {
            return;
        }

        try {
            Files.createDirectories(parent);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to create SQLite DB directory: " + parent, e);
        }
    }

    private static void ensureStorageRootExists(Environment env) {
        var root = env.getProperty("vestigium.storage.root-dir");
        if (root == null || root.isBlank()) {
            return;
        }
        try {
            Files.createDirectories(Path.of(root).toAbsolutePath().normalize());
        } catch (Exception e) {
            throw new IllegalStateException("Failed to create storage root directory: " + root, e);
        }
    }
}



