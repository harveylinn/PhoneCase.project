package com.phonecase.backend.member.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// 未提供或 null 表示不改；電話、地址的空字串表示清空。姓名不可清空。
public record UpdateProfileRequest(
    @Size(max = 80, message = "姓名不可超過80字元。")
    @Pattern(regexp = "(?s).*\\S.*", message = "請輸入姓名。") String name,
    @Size(max = 30, message = "電話不可超過30字元。")
    @Pattern(regexp = "^$|^\\+?(?=(?:\\D*\\d){7,15}\\D*$)[0-9-]+$", message = "電話須包含7~15位數字，可包含開頭國碼符號及連字號。") String phone,
    @Size(max = 500, message = "地址不可超過500字元。") String defaultAddress
) {
    @JsonAnySetter
    public void rejectUnknown(String field, Object value) {
        throw new IllegalArgumentException("包含不允許修改的欄位。");
    }
}
