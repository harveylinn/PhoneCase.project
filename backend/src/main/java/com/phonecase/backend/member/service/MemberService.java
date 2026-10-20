package com.phonecase.backend.member.service;

import java.nio.charset.StandardCharsets;

import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.phonecase.backend.member.dto.RegisterRequest;
import com.phonecase.backend.member.entity.Member;
import com.phonecase.backend.member.exception.RegistrationException;
import com.phonecase.backend.member.repository.MemberRepository;

import jakarta.servlet.Registration;

@Service 
public class MemberService {
    @Autowired 
    private MemberRepository memberRepository;

    // public MemberService(MemberRepository memberRepository) {
    //     this.memberRepository = memberRepository;
    // }

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
                                            BCrypt.gensalt()
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

   
    

   

}
