package com.vestigium.events;

import com.vestigium.api.dto.JobResponse;
import com.vestigium.domain.Job;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class JobEventListener {

    private final SimpMessagingTemplate messagingTemplate;

    public JobEventListener(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void handleJobUpdated(JobUpdatedEvent event) {
        Job job = event.job();
        JobResponse response = JobResponse.from(job);
        messagingTemplate.convertAndSend("/topic/jobs", response);
    }
}

