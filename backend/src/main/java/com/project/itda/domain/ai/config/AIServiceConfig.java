package com.project.itda.domain.ai.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

/**
 * AI 서버(FastAPI) 설정
 */
@Slf4j
@Component
@Getter
public class AIServiceConfig {

    /**
     * FastAPI 서버 URL
     * Docker: http://fastapi:8000
     * Local: http://localhost:8000
     */
    @Value("${AI_SERVICE_URL:http://localhost:8000}")
    private String url;

    /**
     * 요청 타임아웃 (밀리초)
     */
    @Value("${ai.service.timeout:30000}")
    private int timeout;

    /**
     * 최대 재시도 횟수
     */
    @Value("${ai.service.maxRetries:3}")
    private int maxRetries;

    /**
     * 캐시 활성화 여부
     */
    @Value("${ai.service.enableCache:true}")
    private boolean enableCache;

    @PostConstruct
    public void init() {
        log.info("🤖 AI Service Configuration");
        log.info("   URL: {}", url);
        log.info("   Timeout: {}ms", timeout);
        log.info("   Max Retries: {}", maxRetries);
        log.info("   Cache Enabled: {}", enableCache);
    }
}