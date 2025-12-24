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
    void shouldPublishEventOnFailure() {
        var job = repository.enqueue("TEST_TYPE", "entry-1", "{}");
        repository.markFailed(job.id(), "error", false);

        var updated = repository.getById(job.id()).orElseThrow();
        assertThat(updated.status()).isEqualTo("FAILED");
        verify(events, atLeastOnce()).publishEvent(any(JobUpdatedEvent.class));
    }
}

