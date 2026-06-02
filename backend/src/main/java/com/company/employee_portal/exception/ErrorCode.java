package com.company.employee_portal.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    // Validation
    NO_REQUEST_BODY("VAL-001", "リクエストボディーがありません。", HttpStatus.BAD_REQUEST),
    VALIDATION_FAILED("VAL-002", "入力内容に誤りがあります。", HttpStatus.BAD_REQUEST),
    INVALID_ENUM("VAL-003", "無効な値が指定されました。", HttpStatus.BAD_REQUEST),

    // Auth
    INVALID_CREDENTIALS("AUTH-001", "メールアドレスまたはパスワードが間違っております。", HttpStatus.UNAUTHORIZED),
    TOKEN_EXPIRED("AUTH-002", "トークンの有効期限が切れています。", HttpStatus.UNAUTHORIZED),
    TOKEN_INVALID("AUTH-003", "トークンが無効、または不正な形式です。", HttpStatus.UNAUTHORIZED),
    ACCESS_DENIED("AUTH-004", "このリソースにアクセスする権限がありません。", HttpStatus.FORBIDDEN),

    // Ticket
    NO_TICKET_FOUND_BY_ID("TIC-001", "指定したIDのチケットが見つかりませんでした。", HttpStatus.NOT_FOUND),
    TICKET_ALREADY_WITHDRAWN("TIC-002", "指定したIDのチケットがすでに取り下げ済です。", HttpStatus.CONFLICT),
    NOT_AN_APPROVER("TIC-003", "承認者ではありません。", HttpStatus.FORBIDDEN),
    APPROVAL_ALREADY_REVIEWED("TIC-004", "指定したIDのチケットがすでにレビューされております。", HttpStatus.CONFLICT),
    TICKET_NOT_EDITABLE("TIC-005", "差し戻し済みのチケットのみ修正できます。", HttpStatus.CONFLICT),

    // AI Generation
    INVALID_AI_RESPONSE("AI-TIC-GEN-001", "AIの応答が無効です。もう一度お試しください。", HttpStatus.BAD_GATEWAY),
    AI_REJECTED_INPUT("AI-TIC-GEN-002", "業務に関連する申請内容を入力してください。", HttpStatus.BAD_REQUEST),
    SERVICE_UNAVAILABLE("AI-TIC-GEN-003", "現在、AI生成サービスが一時的に利用できません。しばらくしてからもう一度お試しください。", HttpStatus.SERVICE_UNAVAILABLE),
    AI_RATE_LIMIT_EXCEEDED("AI-TIC-GEN-004", "AIの生成は1日5回までご利用いただけます。", HttpStatus.TOO_MANY_REQUESTS),

    // Storage
    FILE_TOO_LARGE("STR-001", "ファイルサイズは10MB以下にしてください。", HttpStatus.CONTENT_TOO_LARGE),
    INVALID_FILE_TYPE("STR-002", "許可されていないファイル形式です。", HttpStatus.UNSUPPORTED_MEDIA_TYPE),
    FILE_UPLOAD_FAILED("STR-003", "ファイルのアップロードに失敗しました。もう一度お試しください。", HttpStatus.INTERNAL_SERVER_ERROR),
    FILE_NOT_FOUND("STR-004", "指定したファイルが見つかりませんでした。", HttpStatus.NOT_FOUND),
    EMPTY_FILE("STR-005", "ファイルが空です。", HttpStatus.BAD_REQUEST),

    // Announcement
    ANNOUNCEMENT_NOT_FOUND("ANN-001", "指定したお知らせが見つかりませんでした。", HttpStatus.NOT_FOUND),
    ANNOUNCEMENT_ALREADY_ACKNOWLEDGED("ANN-002", "すでに確認済みです。", HttpStatus.CONFLICT),
    ANNOUNCEMENT_NOT_EDITABLE("ANN-003", "公開済みのお知らせは編集できません。", HttpStatus.CONFLICT),

    // System
    INTERNAL_SERVER_ERROR("SYS-001", "予期しないエラーが発生しました。", HttpStatus.INTERNAL_SERVER_ERROR);

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
