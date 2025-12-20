package com.vestigium.storage;

import java.nio.file.Path;
import org.springframework.stereotype.Component;

@Component
public class StoragePaths {

    private final StorageProperties props;

    public StoragePaths(StorageProperties props) {
        this.props = props;
    }

    public Path root() {
        return Path.of(props.rootDir()).toAbsolutePath().normalize();
    }

    public Path attachmentsRoot() {
        return root().resolve(props.attachmentsSubdir()).normalize();
    }

    public Path thumbnailsRoot() {
        return root().resolve(props.thumbnailsSubdir()).normalize();
    }
}


