package com.vestigium.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.vestigium.api.dto.JobResponse;
import com.vestigium.domain.Job;
import com.vestigium.persistence.JobRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(JobsController.class)
class JobsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JobRepository jobRepository;

    @Test
    void list_ShouldReturnJobs() throws Exception {
        var job = new Job("job-1", "ENRICH_ENTRY", "PENDING", "entry-1", null, 0, null, null, null, "2023-01-01T00:00:00Z");

        when(jobRepository.list(isNull(), eq(List.of("PENDING")), eq(50))).thenReturn(List.of(job));

        mockMvc.perform(get("/api/jobs")
                        .param("status", "PENDING")
                        .param("limit", "50")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("job-1"))
                .andExpect(jsonPath("$[0].type").value("ENRICH_ENTRY"))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    void list_ShouldFilterByEntryId() throws Exception {
        var job = new Job("job-1", "ENRICH_ENTRY", "PENDING", "entry-1", null, 0, null, null, null, "2023-01-01T00:00:00Z");

        when(jobRepository.list(eq("entry-1"), isNull(), eq(50))).thenReturn(List.of(job));

        mockMvc.perform(get("/api/jobs")
                        .param("entryId", "entry-1")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].entryId").value("entry-1"));
    }

    @Test
    void get_ShouldReturnJob() throws Exception {
        var job = new Job("job-1", "ENRICH_ENTRY", "PENDING", "entry-1", null, 0, null, null, null, "2023-01-01T00:00:00Z");

        when(jobRepository.getById("job-1")).thenReturn(Optional.of(job));

        mockMvc.perform(get("/api/jobs/job-1")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("job-1"))
                .andExpect(jsonPath("$.type").value("ENRICH_ENTRY"));
    }

    @Test
    void get_ShouldReturn404WhenNotFound() throws Exception {
        when(jobRepository.getById("job-1")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/jobs/job-1")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void cancel_ShouldCancelPendingJob() throws Exception {
        when(jobRepository.cancelPending("job-1")).thenReturn(1);

        mockMvc.perform(post("/api/jobs/job-1/cancel"))
                .andExpect(status().isOk());
    }

    @Test
    void cancel_ShouldReturn409WhenNotPending() throws Exception {
        when(jobRepository.cancelPending("job-1")).thenReturn(0);

        mockMvc.perform(post("/api/jobs/job-1/cancel"))
                .andExpect(status().isConflict());
    }

    @Test
    void retry_ShouldRetryFailedJob() throws Exception {
        when(jobRepository.retry("job-1")).thenReturn(1);

        mockMvc.perform(post("/api/jobs/job-1/retry"))
                .andExpect(status().isOk());
    }

    @Test
    void retry_ShouldReturn409WhenNotFailed() throws Exception {
        when(jobRepository.retry("job-1")).thenReturn(0);

        mockMvc.perform(post("/api/jobs/job-1/retry"))
                .andExpect(status().isConflict());
    }

    @Test
    void delete_ShouldDeleteJob() throws Exception {
        when(jobRepository.deleteIfNotRunning("job-1")).thenReturn(1);

        mockMvc.perform(delete("/api/jobs/job-1"))
                .andExpect(status().isOk());
    }

    @Test
    void delete_ShouldReturn409WhenRunning() throws Exception {
        when(jobRepository.deleteIfNotRunning("job-1")).thenReturn(0);

        mockMvc.perform(delete("/api/jobs/job-1"))
                .andExpect(status().isConflict());
    }
}

