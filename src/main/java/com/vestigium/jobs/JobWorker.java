package com.vestigium.jobs;

import com.vestigium.persistence.JobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class JobWorker {

    private static final Logger log = LoggerFactory.getLogger(JobWorker.class);

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
            log.info("Processing job id={} type={} entryId={} attempt={}", job.id(), job.type(), job.entryId(), job.attempts());
            dispatcher.dispatch(job);
            jobs.markSucceeded(job.id());
            log.info("Job succeeded id={} type={} entryId={}", job.id(), job.type(), job.entryId());
        } catch (Exception e) {
            Throwable actual = e;
            if (e.getCause() != null && (e instanceof java.util.concurrent.ExecutionException || e.getClass().getName().endsWith("RuntimeException"))) {
                actual = e.getCause();
            }

            var msg = actual.getClass().getSimpleName() + ": " + (actual.getMessage() == null ? "" : actual.getMessage());
            var retry = job.attempts() < maxAttempts;
            String lastResponse = null;

            // Look for JobParsingException in the chain
            Throwable t = e;
            while (t != null) {
                if (t instanceof JobParsingException jpe) {
                    lastResponse = jpe.getRawResponse();
                    break;
                }
                t = t.getCause();
            }

            // Don't endlessly retry configuration/logic errors.
            if (msg.contains("Missing GOOGLE_API_KEY")) {
                retry = false;
            }
            if (e instanceof IllegalArgumentException) {
                retry = false;
            }
            
            jobs.markFailed(job.id(), msg, lastResponse, retry);
            log.error(
                    "Job failed id={} type={} entryId={} retry={} attempts={}/{} msg={}",
                    job.id(), job.type(), job.entryId(), retry, job.attempts(), maxAttempts, msg,
                    e
            );
        }
    }
}


