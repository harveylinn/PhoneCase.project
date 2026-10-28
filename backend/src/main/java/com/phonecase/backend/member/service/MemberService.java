package com.phonecase.backend.member.service;

import java.nio.charset.StandardCharsets;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.phonecase.backend.member.dto.UpdateProfileRequest;
import com.phonecase.backend.member.dto.LoginRequest;
import com.phonecase.backend.member.dto.RegisterRequest;
import com.phonecase.backend.member.entity.Member;
import com.phonecase.backend.member.exception.JwtAuthenticationException;
import com.phonecase.backend.member.exception.LoginException;
import com.phonecase.backend.member.exception.RegistrationException;
import com.phonecase.backend.member.repository.MemberRepository;

@Service
public class MemberService {
    @Autowired
    private MemberRepository memberRepository;

    public Long register(RegisterRequest request){
        String account = request.account().trim();
        String email = request.email().trim();
        String name = request.name().trim();
        String phone = request.phone().trim();

        if (memberRepository.existsByAccount(account)){
            throw new RegistrationException("此帳號已被使用。");
        }

        if (memberRepository.existsByEmail(email)){
            throw new RegistrationException("此電子郵件已被使用。");
        }

        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new RegistrationException("密碼不可超過72個 UTF-8 位元組。");
        }

        String passwordHash = BCrypt.hashpw(request.password(),
                                            BCrypt.gensalt(12)
        );

        Member member = new Member();
        member.setAccount(account);
        member.setEmail(email);
        member.setPasswordHash(passwordHash);
        member.setName(name);
        member.setPhone(phone);
        member.setRole("CUSTOMER");
        member.setStatus("ACTIVE");

        Member savedMember = memberRepository.save(member);

        return savedMember.getId();

    }

    public Member login(LoginRequest request) {
        String account = request.account().trim();
        String password = request.password();

        if (password.getBytes(StandardCharsets.UTF_8).length >72) {
            throw new LoginException("帳號或密碼錯誤。");
        }

        Member member = memberRepository.findByAccount(account)
                        .orElseThrow(() -> new LoginException("帳號或密碼錯誤"));

        if (!BCrypt.checkpw(password, member.getPasswordHash())) {
            throw new LoginException("帳號或密碼錯誤。");
        }

        if (!"ACTIVE".equals(member.getStatus())) {
            throw new LoginException("此帳號目前無法登入，請聯絡管理員。");
        }

        return member;
    }

    public Member getCurrentMember(Long memberId) {
        if (memberId == null) throw new JwtAuthenticationException("請重新登入。");
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new JwtAuthenticationException("會員不存在，請重新登入。"));
        if (!"ACTIVE".equals(member.getStatus())) {
            throw new JwtAuthenticationException("此帳號目前無法使用。");
        }
        return member;
    }

    @Transactional
    public Member updateProfile(Long memberId, UpdateProfileRequest request) {
        Member member = getCurrentMember(memberId);
        if (request.name() != null) member.setName(request.name().trim());
        if (request.phone() != null) {
            String phone = request.phone().trim();
            member.setPhone(phone.isEmpty() ? null : phone);
        }
        if (request.defaultAddress() != null) {
            String address = request.defaultAddress().trim();
            member.setDefaultAddress(address.isEmpty() ? null : address);
        }
        return memberRepository.save(member);
    }






}
