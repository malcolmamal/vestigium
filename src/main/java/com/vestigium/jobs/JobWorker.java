package com.vestigium.jobs;

import com.vestigium.persistence.JobRepository;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.core.task.TaskExecutor;

@Component
public class JobWorker {

    private static final Logger log = LoggerFactory.getLogger(JobWorker.class);
    private static final List<String> LLM_TYPES = List.of("ENRICH_ENTRY");

    private final JobRepository jobs;
    private final JobDispatcher dispatcher;
    private final int maxAttempts;
    private final int maxConcurrentLlm;
    private final int maxConcurrentOther;
    private final TaskExecutor jobExecutor;

    public JobWorker(
            JobRepository jobs,
            JobDispatcher dispatcher,
            @Value("${vestigium.jobs.max-attempts:3}") int maxAttempts,
            @Value("${vestigium.jobs.max-concurrent-llm:1}") int maxConcurrentLlm,
            @Value("${vestigium.jobs.max-concurrent-other:2}") int maxConcurrentOther,
            @Qualifier("jobTaskExecutor") TaskExecutor jobExecutor
    ) {
        this.jobs = jobs;
        this.dispatcher = dispatcher;
        this.maxAttempts = maxAttempts;
        this.maxConcurrentLlm = Math.max(maxConcurrentLlm, 0);
        this.maxConcurrentOther = Math.max(maxConcurrentOther, 0);
        this.jobExecutor = jobExecutor;
    }

    @Scheduled(fixedDelayString = "${vestigium.jobs.poll-delay-ms:2000}")
    public void pollAndProcess() {
        pollLlmQueue();
        pollOtherQueue();
    }

    private void pollLlmQueue() {
        if (maxConcurrentLlm <= 0) return;
        var running = jobs.countRunningByTypes(LLM_TYPES);
        if (running >= maxConcurrentLlm) {
            return;
        }
        jobs.claimNextPendingByTypes(LLM_TYPES).ifPresent(this::dispatchAsync);
    }

    private void pollOtherQueue() {
        if (maxConcurrentOther <= 0) return;
        var running = jobs.countRunningExcludingTypes(LLM_TYPES);
        var capacity = maxConcurrentOther - running;
        for (int i = 0; i < capacity; i++) {
            var claimed = jobs.claimNextPendingExcludingTypes(LLM_TYPES);
            if (claimed.isEmpty()) {
                break;
            }
            dispatchAsync(claimed.get());
            running += 1;
        }
    }

    private void dispatchAsync(com.vestigium.domain.Job job) {
        jobExecutor.execute(() -> processJob(job));
    }

    private void processJob(com.vestigium.domain.Job job) {
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


