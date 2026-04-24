package com.company.employee_portal.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    // User
    USER_ALREADY_EXISTS("USR-001", "User already exists with this email", HttpStatus.CONFLICT),
    USER_NOT_FOUND("USR-002", "User not found", HttpStatus.NOT_FOUND),

    // Auth
    INVALID_CREDENTIALS("AUTH-001", "Invalid email or password", HttpStatus.UNAUTHORIZED),
    TOKEN_EXPIRED("AUTH-002", "Token has expired", HttpStatus.UNAUTHORIZED),
    TOKEN_INVALID("AUTH-003", "Token is invalid or malformed", HttpStatus.UNAUTHORIZED),
    ACCESS_DENIED("AUTH-004", "You do not have permission to access this resource", HttpStatus.FORBIDDEN),

    // Validation
    VALIDATION_FAILED("VAL-001", "Validation failed", HttpStatus.BAD_REQUEST),

    // System
    INTERNAL_SERVER_ERROR("SYS-001", "An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR);

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(String code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }

    public String getCode()           { return code; }
    public String getMessage()        { return message; }
    public HttpStatus getHttpStatus() { return httpStatus; }
}
