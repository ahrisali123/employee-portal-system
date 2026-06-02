package com.company.employee_portal.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;
    private ErrorDetails error;
    private LocalDateTime timestamp = LocalDateTime.now();

    // 成功
    public static <T> ApiResponse<T> success(String message, T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = true;
        response.message = message;
        response.data = data;
        response.timestamp = LocalDateTime.now();
        return response;
    }

    // 失敗-エラー
    public static <T> ApiResponse<T> error(String errorCode, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = false;
        response.error = new ErrorDetails(errorCode, message);
        response.timestamp = LocalDateTime.now();
        return response;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ErrorDetails(String code, String message, Map<String, String> errors) {
        public ErrorDetails(String code, String message) {
            this(code, message, null);
        }
    }
}
