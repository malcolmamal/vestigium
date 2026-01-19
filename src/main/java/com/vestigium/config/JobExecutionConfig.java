package com.vestigium.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.TaskScheduler;

@Configuration
public class JobExecutionConfig {

    @Bean
    public TaskExecutor jobTaskExecutor(
            @Value("${vestigium.jobs.worker-threads:4}") int workerThreads
    ) {
        var executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(Math.max(workerThreads, 1));
        executor.setMaxPoolSize(Math.max(workerThreads, 1));
        executor.setQueueCapacity(1000);
        executor.setThreadNamePrefix("job-worker-");
        executor.initialize();
        return executor;
    }

    @Bean
    public TaskScheduler taskScheduler(
            @Value("${vestigium.jobs.scheduler-threads:2}") int schedulerThreads
    ) {
        var scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(Math.max(schedulerThreads, 1));
        scheduler.setThreadNamePrefix("job-scheduler-");
        scheduler.initialize();
        return scheduler;
    }
}
