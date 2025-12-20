package com.vestigium.jobs;

import com.vestigium.persistence.JobRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class JobWorker {

    private final JobRepository jobs;
    private final JobDispatcher dispatcher;
    private final int maxAttempts;

    public JobWorker(
            JobRepository jobs,
            JobDispatcher dispatcher,
            @Value("${vestigium.jobs.max-attempts:3}") int maxAttempts
    ) {
        this.jobs = jobs;
        this.dispatcher = dispatcher;
        this.maxAttempts = maxAttempts;
    }

    @Scheduled(fixedDelayString = "${vestigium.jobs.poll-delay-ms:2000}")
    public void pollAndProcessOne() {
        var claimed = jobs.claimNextPending();
        if (claimed.isEmpty()) {
            return;
        }

        var job = claimed.get();
        try {
            dispatcher.dispatch(job);
            jobs.markSucceeded(job.id());
        } catch (Exception e) {
            var retry = job.attempts() < maxAttempts;
            var msg = e.getClass().getSimpleName() + ": " + (e.getMessage() == null ? "" : e.getMessage());
            jobs.markFailed(job.id(), msg, retry);
        }
    }
}


