package com.company.employee_portal.service.ai;

import com.company.employee_portal.exception.ApiException;
import com.company.employee_portal.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service("openai")
public class OpenAiProviderService implements AiProvider {

    @Value("${ai.openai.api.key}")
    private String apiKey;

    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";

    @Override
    public String generate(String systemPrompt, String userInput) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> body = Map.of(
                "model", "gpt-4o-mini",
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userInput)
                )
        );

        try {
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    OPENAI_URL,
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    Map.class
            );
            return extractText(responseEntity.getBody());
        } catch (HttpStatusCodeException e) {
            if (e.getStatusCode() == HttpStatus.SERVICE_UNAVAILABLE) {
                throw new ApiException(ErrorCode.SERVICE_UNAVAILABLE);
            }
            throw new ApiException(ErrorCode.INVALID_AI_RESPONSE);
        }
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> result) {
        List<Map<String, Object>> choices = (List<Map<String, Object>>) result.get("choices");
        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        return (String) message.get("content");
    }
}