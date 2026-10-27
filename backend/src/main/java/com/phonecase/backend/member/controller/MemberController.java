package com.phonecase.backend.member.controller;

import java.util.Map;

import org.mindrot.jbcrypt.BCrypt;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.phonecase.backend.member.dto.RegisterRequest;
import com.phonecase.backend.member.entity.Member;
import com.phonecase.backend.member.repository.MemberRepository;

/*
前端註冊資料格式:
{
  "account": "test001",
  "password": "test123456",
  "name": "測試會員",
  "phone": "0912345678",
  "email": "test001@example.com"
}
  */

@RestController
@RequestMapping("/api/member")
public class MemberController {

    private final MemberRepository memberRepository;

    public MemberController(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    // 註冊後寫入 members，後台 CRM 會以客戶代號 M + 會員 id 對應訂單
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        String account = trim(request.account());
        String email = trim(request.email());
        String name = trim(request.name());

        if (account == null || email == null || name == null
                || request.password() == null || request.password().length() < 8) {
            return fail(HttpStatus.BAD_REQUEST, "帳號、姓名、Email 不可空白，密碼至少 8 碼");
        }
        if (memberRepository.existsByAccount(account)) {
            return fail(HttpStatus.CONFLICT, "此帳號已被註冊");
        }
        if (memberRepository.existsByEmail(email)) {
            return fail(HttpStatus.CONFLICT, "此 Email 已被註冊");
        }

        Member member = new Member();
        member.setAccount(account);
        member.setEmail(email);
        member.setName(name);
        member.setPhone(trim(request.phone()));
        member.setPasswordHash(BCrypt.hashpw(request.password(), BCrypt.gensalt()));
        member.setRole("CUSTOMER");
        member.setStatus("ACTIVE");
        memberRepository.save(member);

        return ResponseEntity.ok(Map.<String, Object>of("success", true, "message", "註冊成功，歡迎加入 CASELAB！"));
    }

    private ResponseEntity<Map<String, Object>> fail(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.<String, Object>of("success", false, "message", message));
    }

    private String trim(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
