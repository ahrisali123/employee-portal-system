package com.company.employee_portal.exception;

import com.company.employee_portal.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import tools.jackson.databind.exc.InvalidFormatException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Void>> handleApiException(ApiException ex) {
        ErrorCode errorCode = ex.getErrorCode();
        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .body(ApiResponse.error(errorCode.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        ErrorCode errorCode = ErrorCode.INVALID_CREDENTIALS;
        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .body(ApiResponse.error(errorCode.getCode(), errorCode.getMessage()));
    }

    @ExceptionHandler({DisabledException.class, LockedException.class})
    public ResponseEntity<ApiResponse<Void>> handleAccountStatus(Exception ex) {
        ErrorCode errorCode = ErrorCode.ACCESS_DENIED;
        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .body(ApiResponse.error(errorCode.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        ErrorCode errorCode = ErrorCode.ACCESS_DENIED;
        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .body(ApiResponse.error(errorCode.getCode(), errorCode.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingBody(HttpMessageNotReadableException ex) {

        String code = ErrorCode.NO_REQUEST_BODY.getCode();
        String message = ErrorCode.NO_REQUEST_BODY.getMessage();

        Throwable cause = ex.getCause();
        while (cause != null) {
            if (cause instanceof InvalidFormatException ife) {
                if (ife.getTargetType() != null && ife.getTargetType().isEnum()) {
                    code = ErrorCode.INVALID_ENUM.getCode();
                    message = ErrorCode.INVALID_ENUM.getMessage();
                }
                break;
            }
            cause = cause.getCause();
        }

        ApiResponse<Void> response = new ApiResponse<>();
        response.setSuccess(false);
        response.setError(new ApiResponse.ErrorDetails(
                code,
                message
        ));
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
            MethodArgumentNotValidException ex) {

        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fe.getField(), fe.getDefaultMessage());
        }

        ApiResponse<Map<String, String>> response = new ApiResponse<>();
        response.setSuccess(false);
        response.setMessage(ErrorCode.VALIDATION_FAILED.getMessage());
        response.setData(null);
        response.setError(new ApiResponse.ErrorDetails(
                ErrorCode.VALIDATION_FAILED.getCode(),
                ErrorCode.VALIDATION_FAILED.getMessage(),
                fieldErrors
        ));

        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneric(Exception ex) {
        return ResponseEntity
                .status(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus())
                .body(ApiResponse.error(
                        ErrorCode.INTERNAL_SERVER_ERROR.getCode(),
                        ex.getMessage()));
    }
}
