package com.vestigium.events;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

import com.vestigium.api.dto.JobResponse;
import com.vestigium.domain.Job;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@ExtendWith(MockitoExtension.class)
class JobEventListenerTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private JobEventListener listener;

    @Test
    void shouldSendWebSocketMessageOnJobUpdated() {
        var job = new Job("1", "TYPE", "PENDING", "entry-1", "{}", 0, null, null, null, null, "2023-01-01T00:00:00Z");
        var event = new JobUpdatedEvent(job);

        listener.handleJobUpdated(event);

        verify(messagingTemplate).convertAndSend(eq("/topic/jobs"), ArgumentMatchers.any(JobResponse.class));
    }
}

