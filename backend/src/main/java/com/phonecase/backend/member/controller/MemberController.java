package com.phonecase.backend.member.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.phonecase.backend.member.dto.LoginRequest;
import com.phonecase.backend.member.dto.RegisterRequest;
import com.phonecase.backend.member.entity.Member;
import com.phonecase.backend.member.security.JwtToken;
import com.phonecase.backend.member.service.MemberService;

import io.micrometer.core.ipc.http.HttpSender.Response;
import jakarta.validation.Valid;

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
  @Autowired
  private MemberService memberService;
  @Autowired
  private JwtToken jwtToken;

  @PostMapping("/register")
  public ResponseEntity<Map<String, Object>> register(@RequestBody @Valid RegisterRequest request) {
    Long memberId = memberService.register(request);

    return ResponseEntity.status(201).body(
            Map.<String,Object>of(
              "success", true, 
              "message", "註冊成功，請登入。",
              "memberId", memberId
            )
    );
  }
  

  @PostMapping("/login")
  public ResponseEntity<Map<String,Object>> login(
    @RequestBody @Valid LoginRequest request) {

    Member member = memberService.login(request);

    String token = jwtToken.createToken(member.getId());

    return ResponseEntity.ok(
      Map.<String, Object>of(
        "success", true,
        "message", "登入成功。",
        "token", token,
        "member",Map.of(
          "id", member.getId(),
          "account", member.getAccount(),
          "name", member.getName()
        )
      )
    );
  }

}
