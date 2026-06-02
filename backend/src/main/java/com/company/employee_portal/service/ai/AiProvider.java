package com.company.employee_portal.service.ai;

public interface AiProvider {
    String generate(String systemPrompt, String userInput);
}
