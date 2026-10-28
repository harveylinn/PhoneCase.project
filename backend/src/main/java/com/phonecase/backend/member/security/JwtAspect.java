package com.phonecase.backend.member.security;

import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.phonecase.backend.member.entity.Member;
import com.phonecase.backend.member.exception.JwtAuthenticationException;
import com.phonecase.backend.member.repository.MemberRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.http.HttpServletRequest;

@Aspect
@Component
public class JwtAspect {

    @Autowired
    private HttpServletRequest request;

    @Autowired
    private JwtToken jwtToken;

    @Autowired
    private MemberRepository memberRepository;

    @Before("@annotation(com.phonecase.backend.member.security.CheckJwt)")
    public void CheckJwt() {
        String authorization = request .getHeader("Authorization");

        if (authorization == null || authorization.isBlank()) {
            throw new JwtAuthenticationException("請先登入帳號。");
        }

        if (!authorization.regionMatches(true,0, "Bearer ", 0, 7)){
            throw new JwtAuthenticationException(
                "Authorization 格式錯誤，請使用 Bearer token。");
        }

        String token = authorization.substring(7).trim();

        if (token.isEmpty()) {
            throw new JwtAuthenticationException(
                "缺少Token，請先登入");
        }

        Long memberId;

        try {
            Claims claims = jwtToken.verifyToken(token);
            memberId = Long.valueOf(claims.getSubject());

            if(memberId <= 0) {
                throw new JwtAuthenticationException("Token 會員身分無效。");
            }
        }catch (ExpiredJwtException exception) {
            throw new JwtAuthenticationException("登入已過期，請重新登入。");
        }catch (SignatureException exception) {
            throw new JwtAuthenticationException("Token 簽章錯誤，請重新登入");
        }catch (JwtException | IllegalArgumentException exception){
            throw new JwtAuthenticationException("Token 無效，請重新登入。");
        }

        Member member = memberRepository.findById(memberId)
                        .orElseThrow(() ->
                            new JwtAuthenticationException("會員不存在，請重新登入。"));

        if (!"ACTIVE".equals(member.getStatus())){
            throw new JwtAuthenticationException("此帳號目前無法使用。");
        }

        request.setAttribute("authenticatedMemberId", member.getId());
    }
}
