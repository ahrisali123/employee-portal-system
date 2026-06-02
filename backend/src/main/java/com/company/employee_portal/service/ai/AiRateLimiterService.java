package com.company.employee_portal.service.ai;

import com.company.employee_portal.exception.ApiException;
import com.company.employee_portal.exception.ErrorCode;
import com.company.employee_portal.jwt.JwtContext;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiRateLimiterService {

    private final StringRedisTemplate redisTemplate;

    @Value("${ai.rate-limit.max-requests}")
    private int maxRequests;

    private final JwtContext jwtContext;

    public void checkLimit() {
        UUID userId = jwtContext.getUserId();
        String key = "ai:rate:" + userId + ":" + LocalDate.now();

        Long count = redisTemplate.opsForValue().increment(key);

        if (count == 1) {
            redisTemplate.expire(key, Duration.ofDays(1));
        }

        if (count > maxRequests) {
            throw new ApiException(ErrorCode.AI_RATE_LIMIT_EXCEEDED);
        }
    }
}
