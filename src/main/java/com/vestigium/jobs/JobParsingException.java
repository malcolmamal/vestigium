package com.vestigium.jobs;

public class JobParsingException extends RuntimeException {
    private final String rawResponse;

    public JobParsingException(String message, String rawResponse, Throwable cause) {
        super(message, cause);
        this.rawResponse = rawResponse;
    }

    public String getRawResponse() {
        return rawResponse;
    }
}
