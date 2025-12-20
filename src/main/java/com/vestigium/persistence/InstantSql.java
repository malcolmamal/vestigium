package com.vestigium.persistence;

import java.time.Instant;

public final class InstantSql {

    private InstantSql() {}

    public static String nowIso() {
        return Instant.now().toString();
    }
}


