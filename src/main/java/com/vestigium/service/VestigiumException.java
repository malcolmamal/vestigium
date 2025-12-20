package com.vestigium.service;

import org.springframework.http.HttpStatus;

public class VestigiumException extends RuntimeException {

    private final String code;
    private final HttpStatus httpStatus;

    public VestigiumException(String code, HttpStatus httpStatus, String message) {
        super(message);
        this.code = code;
        this.httpStatus = httpStatus;
    }

    public String code() {
        return code;
    }

    public HttpStatus httpStatus() {
        return httpStatus;
    }
}


