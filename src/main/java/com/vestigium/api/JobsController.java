package com.vestigium.api;

import com.vestigium.api.dto.JobResponse;
import com.vestigium.persistence.JobRepository;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class JobsController {

    private final JobRepository jobs;

    public JobsController(JobRepository jobs) {
        this.jobs = jobs;
    }

    /**
     * Queue visibility endpoint.
     * Example: /api/jobs?status=PENDING&status=RUNNING&status=FAILED&limit=50
     */
    @GetMapping("/api/jobs")
    public List<JobResponse> list(
            @RequestParam(value = "entryId", required = false) String entryId,
            @RequestParam(value = "status", required = false) List<String> statuses,
            @RequestParam(value = "limit", defaultValue = "50") @Min(1) @Max(500) int limit
    ) {
        return jobs.list(entryId, statuses, limit).stream().map(JobResponse::from).toList();
    }

    @GetMapping("/api/jobs/{id}")
    public JobResponse get(@PathVariable String id) {
        return jobs.getById(id)
                .map(JobResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    /**
     * Cancels only PENDING jobs (so they will not be processed).
     */
    @PostMapping("/api/jobs/{id}/cancel")
    public void cancel(@PathVariable String id) {
        var updated = jobs.cancelPending(id);
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Job is not pending or does not exist.");
        }
    }

    /**
     * Retries a FAILED or CANCELLED job.
     */
    @PostMapping("/api/jobs/{id}/retry")
    public void retry(@PathVariable String id) {
        var updated = jobs.retry(id);
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Job is not failed/cancelled or does not exist.");
        }
    }

    /**
     * Removes job record (allowed for everything except RUNNING).
     */
    @DeleteMapping("/api/jobs/{id}")
    public void delete(@PathVariable String id) {
        var deleted = jobs.deleteIfNotRunning(id);
        if (deleted == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Job is running or does not exist.");
        }
    }
}


