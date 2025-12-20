package com.vestigium.jobs;

import com.vestigium.domain.Job;

public interface JobProcessor {
    String type();

    void process(Job job) throws Exception;
}


