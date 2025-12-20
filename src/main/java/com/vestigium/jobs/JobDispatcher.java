package com.vestigium.jobs;

import com.vestigium.domain.Job;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class JobDispatcher {

    private final Map<String, JobProcessor> processorsByType;

    public JobDispatcher(List<JobProcessor> processors) {
        var map = new HashMap<String, JobProcessor>();
        for (var p : processors) {
            map.put(p.type(), p);
        }
        this.processorsByType = Map.copyOf(map);
    }

    public void dispatch(Job job) throws Exception {
        var processor = processorsByType.get(job.type());
        if (processor == null) {
            throw new IllegalArgumentException("No processor registered for job type: " + job.type());
        }
        processor.process(job);
    }
}


