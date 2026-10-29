package com.phonecase.backend.member.controller;

import java.util.Map;
import java.util.LinkedHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.phonecase.backend.member.dto.LoginRequest;
import com.phonecase.backend.member.dto.RegisterRequest;
import com.phonecase.backend.member.dto.UpdateProfileRequest;
import com.phonecase.backend.member.entity.Member;
import com.phonecase.backend.member.security.CheckJwt;
import com.phonecase.backend.member.security.JwtToken;
import com.phonecase.backend.member.service.MemberService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;



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
        "member", memberData(member)
      )
    );
  }

  @CheckJwt
  @GetMapping("/me")
  public ResponseEntity<Map<String,Object>> me(HttpServletRequest request){

          Long memberId = (Long) request.getAttribute("authenticatedMemberId");

          Member member = memberService.getCurrentMember(memberId);

          return ResponseEntity.ok(
            Map.<String, Object>of("success",true,
                                                          "member", memberData(member)
          )
        );
        }

  @CheckJwt
  @PatchMapping("/me")
  public ResponseEntity<Map<String, Object>> updateMe(
      HttpServletRequest request, @RequestBody @Valid UpdateProfileRequest input) {
    // MVC 先解析參數，@Before 切面才執行，所以在方法內取得身分。
    Long memberId = (Long) request.getAttribute("authenticatedMemberId");
    Member member = memberService.updateProfile(memberId, input);
    return ResponseEntity.ok(Map.of("success", true, "message", "個人資料已儲存。", "member", memberData(member)));
  }

  private Map<String, Object> memberData(Member member) {
    // LinkedHashMap 接受 null；不回傳 Entity，避免洩漏密碼與內部權限欄位。
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("id", member.getId());
    data.put("account", member.getAccount());
    data.put("name", member.getName());
    data.put("email", member.getEmail());
    data.put("phone", member.getPhone());
    data.put("defaultAddress", member.getDefaultAddress());
    data.put("createdAt", member.getCreatedAt());
    data.put("updatedAt", member.getUpdatedAt());
    return data;
  }
}
