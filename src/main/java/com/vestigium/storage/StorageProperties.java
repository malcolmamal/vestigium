package com.vestigium.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "vestigium.storage")
public record StorageProperties(
        String rootDir,
        String attachmentsSubdir,
        String thumbnailsSubdir
) {}


