package com.company.employee_portal.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequestDto {

    @NotBlank(message = "メールアドレスが必須です。")
    @Email(message = "メールアドレスを正しい形式で入力してください。")
    private String email;

    @NotBlank(message = "パスワードが必須です。")
    private String password;
}
