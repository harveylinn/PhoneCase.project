package com.phonecase.backend.member.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component 
public class JwtToken {

    //僅供開發測試，正式部署必須更換並改由外部設定提供。
    //此金鑰會隨原始碼公開，不能用於正式環境。
    private static final String DEV_STRING = 
        "PhoneCase-Team3-DevOnly-JWT-Key-2026";

        //超時秒數
    private static final long EXPIRATION_SECONDS = 60*60; 
    
    private final SecretKey signingKey = Keys.hmacShaKeyFor(
        DEV_STRING.getBytes(StandardCharsets.UTF_8)
    );

    public String createToken(Long memberId) {
        Instant now = Instant.now();

        String token = Jwts.builder()
                .subject(memberId.toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(EXPIRATION_SECONDS)))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
        return token;
    }

    public Claims verifyToken(String token) {
        Claims claims = Jwts.parser()
                        .verifyWith(signingKey)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

        if (claims.getExpiration() == null) {
            throw new JwtException("Token 缺少到期時間。");
        }

        if (claims.getSubject() == null || claims.getSubject().isBlank()) {
            throw new JwtException("Token 缺少會員身分。");
        }

        return claims;
    }

}
