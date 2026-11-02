package com.phonecase.backend.member.service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.phonecase.backend.member.exception.LoginException;

@Service
public class GoogleTokenService {
    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenService(@Value("${app.google.client-id}") String clientId) {
        verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(List.of(clientId))
                .build();
    }

    public GoogleIdToken.Payload verify(String credential) {
        try {
            GoogleIdToken token = verifier.verify(credential);
            if (token == null)
                throw new LoginException("Google 憑證無效，請重試。");
            GoogleIdToken.Payload payload = token.getPayload();
            if (!Boolean.TRUE.equals(payload.getEmailVerified())
                    || payload.getEmail() == null || payload.getEmail().isBlank()
                    || payload.getEmail().length() > 255
                    || payload.getSubject() == null || payload.getSubject().isBlank()
                    || payload.getSubject().length() > 255) {
                throw new LoginException("Google 帳號缺少有效身分資料。");
            }
            return payload;
        } catch (GeneralSecurityException | IOException exception) {
            throw new LoginException("暫時無法驗證 Google 身分，請稍後重試。");
        } catch (IllegalArgumentException exception) {
            throw new LoginException("Google 憑證格式不正確。");
        }
    }
}