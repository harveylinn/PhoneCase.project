package com.phonecase.backend.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

    @NotBlank(message = "請輸入帳號。")
    @Size(max = 100, message = "帳號不可超過100字元。")
    String account,
    
    @NotBlank (message = "請輸入密碼。")
    @Size (min = 8 ,message = "密碼至少需要8 字元。") 
    String password,

    @NotBlank(message="請輸入姓名。")
    @Size(max = 80,message = "姓名不可超過80字元。")
    String name,

    // @NotBlank (message = "請輸入電話。")
    @Size(max = 30,message = "電話不可超過30字元。")
    @Pattern (
                regexp = "^\\+?(?=(?:\\D*\\d){7,15}\\D*$)[0-9-]+$",
                message = "電話須包含7~15位數字，可包含開頭國碼符號及連字號。"
    )
    String phone,

    @NotBlank (message = "請輸入電子郵件。")
    @Email(message="電子郵件格式不正確。")
    @Size(max = 255,message = "電子郵件不可超過255字元。")
    String email
    ) {
    }
