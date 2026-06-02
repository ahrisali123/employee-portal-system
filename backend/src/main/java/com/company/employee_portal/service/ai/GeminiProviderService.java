package com.company.employee_portal.service.ai;

import com.company.employee_portal.exception.ApiException;
import com.company.employee_portal.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service("gemini")
public class GeminiProviderService implements AiProvider {

    @Value("${ai.gemini.api.key}")
    private String apiKey;

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    @Override
    public String generate(String systemPrompt, String userInput) {
        RestTemplate restTemplate = new RestTemplate();

        String url = GEMINI_URL + "?key=" + apiKey;

        Map<String, Object> body = Map.of(
                "system_instruction", Map.of(
                        "parts", List.of(Map.of("text", systemPrompt))
                ),
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", userInput)))
                )
        );

        try {
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(body),
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
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) result.get("candidates");
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        return (String) parts.get(0).get("text");
    }
}
