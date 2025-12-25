package com.vestigium.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;

import com.vestigium.events.JobUpdatedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.JdbcTest;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@JdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class JobRepositoryTest {

    @Autowired
    private NamedParameterJdbcTemplate jdbc;

    @MockitoBean
    private ApplicationEventPublisher events;

    private JobRepository repository;

    @BeforeEach
    void setUp() {
        repository = new JobRepository(jdbc, events);
        // Clean up database before each test
        jdbc.getJdbcOperations().execute("DELETE FROM jobs");
        jdbc.getJdbcOperations().execute("DELETE FROM entries");
        
        // Create a dummy entry for foreign key constraints
        jdbc.getJdbcOperations().execute("""
            INSERT INTO entries (id, url, title, created_at, updated_at) 
            VALUES ('entry-1', 'http://test.com', 'Test', '2023-01-01T00:00:00Z', '2023-01-01T00:00:00Z')
        """);
    }

    @Test
    void shouldPublishEventOnEnqueue() {
        var job = repository.enqueue("TEST_TYPE", "entry-1", "{}");

        assertThat(job).isNotNull();
        assertThat(job.status()).isEqualTo("PENDING");
        verify(events).publishEvent(any(JobUpdatedEvent.class));
    }

    @Test
    void shouldPublishEventOnClaim() {
        repository.enqueue("TEST_TYPE", "entry-1", "{}");
        var claimed = repository.claimNextPending();

        assertThat(claimed).isPresent();
        assertThat(claimed.get().status()).isEqualTo("RUNNING");
        verify(events, atLeastOnce()).publishEvent(any(JobUpdatedEvent.class));
    }

    @Test
    void shouldPublishEventOnSuccess() {
        var job = repository.enqueue("TEST_TYPE", "entry-1", "{}");
        repository.markSucceeded(job.id());

        var updated = repository.getById(job.id()).orElseThrow();
        assertThat(updated.status()).isEqualTo("SUCCEEDED");
        verify(events, atLeastOnce()).publishEvent(any(JobUpdatedEvent.class));
    }

    @Test
    void markSucceeded_ShouldDeleteOlderFailedJobsOfSameType() {
        // Enqueue and fail job 1
        var job1 = repository.enqueue("TYPE_A", "entry-1", "{}");
        repository.markFailed(job1.id(), "error", false);
        
        // Enqueue and succeed job 2
        var job2 = repository.enqueue("TYPE_A", "entry-1", "{}");
        repository.markSucceeded(job2.id());

        // Job 1 should be gone, Job 2 should remain
        assertThat(repository.getById(job1.id())).isEmpty();
        assertThat(repository.getById(job2.id())).isPresent();
        
        // A job of different type should NOT be deleted
        var job3 = repository.enqueue("TYPE_B", "entry-1", "{}");
        repository.markFailed(job3.id(), "error", false);
        var job4 = repository.enqueue("TYPE_A", "entry-1", "{}");
        repository.markSucceeded(job4.id());
        
        assertThat(repository.getById(job3.id())).isPresent();
    }

    @Test
    void shouldPublishEventOnFailure() {
        var job = repository.enqueue("TEST_TYPE", "entry-1", "{}");
        repository.markFailed(job.id(), "error", false);

        var updated = repository.getById(job.id()).orElseThrow();
        assertThat(updated.status()).isEqualTo("FAILED");
        verify(events, atLeastOnce()).publishEvent(any(JobUpdatedEvent.class));
    }

    @Test
    void retry_ShouldUpdateJobToPending() {
        var job = repository.enqueue("TEST_TYPE", "entry-1", "{}");
        repository.markFailed(job.id(), "error", false);

        int updatedCount = repository.retry(job.id());
        assertThat(updatedCount).isEqualTo(1);

        var updated = repository.getById(job.id()).orElseThrow();
        assertThat(updated.status()).isEqualTo("PENDING");
        assertThat(updated.finishedAt()).isNull();
        assertThat(updated.lockedAt()).isNull();
        assertThat(updated.attempts()).isEqualTo(0);
        verify(events, atLeastOnce()).publishEvent(any(JobUpdatedEvent.class));
    }

    @Test
    void findEntryIdsWithFailedLatestJob_ShouldDetectFailedLatestJob() {
        // Entry 1 has a failed job and a succeeded job of different type
        var job1 = repository.enqueue("TYPE_A", "entry-1", "{}");
        repository.markFailed(job1.id(), "error", false);
        var job2 = repository.enqueue("TYPE_B", "entry-1", "{}");
        repository.markSucceeded(job2.id());

        // Entry 2 has only a succeeded job
        jdbc.getJdbcOperations().execute("""
            INSERT INTO entries (id, url, title, created_at, updated_at) 
            VALUES ('entry-2', 'http://test2.com', 'Test 2', '2023-01-01T00:00:00Z', '2023-01-01T00:00:00Z')
        """);
        var job3 = repository.enqueue("TYPE_A", "entry-2", "{}");
        repository.markSucceeded(job3.id());

        var failedIds = repository.findEntryIdsWithFailedLatestJob(java.util.List.of("entry-1", "entry-2"));
        assertThat(failedIds).containsExactly("entry-1");
    }
}

