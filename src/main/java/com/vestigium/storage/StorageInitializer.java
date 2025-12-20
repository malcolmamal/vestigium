package com.vestigium.storage;

import java.io.IOException;
import java.nio.file.Files;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class StorageInitializer implements ApplicationRunner {

    private final StoragePaths paths;

    public StorageInitializer(StoragePaths paths) {
        this.paths = paths;
    }

    @Override
    public void run(ApplicationArguments args) throws IOException {
        Files.createDirectories(paths.attachmentsRoot());
        Files.createDirectories(paths.thumbnailsRoot());
    }
}


