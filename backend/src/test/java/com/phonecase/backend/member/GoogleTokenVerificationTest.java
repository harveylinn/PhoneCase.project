package com.phonecase.backend.member;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.auth.oauth2.GooglePublicKeysManager;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.json.webtoken.JsonWebSignature;
import com.phonecase.backend.member.exception.LoginException;
import com.phonecase.backend.member.service.GoogleTokenService;

/** 用本機 RSA 金鑰測試真正的 Google library 驗章；只替換公鑰來源，不連 Google。 */
class GoogleTokenVerificationTest {
    static final String CLIENT_ID = "test-client.apps.googleusercontent.com";
    static KeyPair trusted;
    static KeyPair attacker;
    GoogleTokenService service;
    GoogleIdToken.Payload payload;

    @BeforeAll static void keys() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        trusted = generator.generateKeyPair();
        attacker = generator.generateKeyPair();
    }

    @BeforeEach void setup() throws Exception {
        service = new GoogleTokenService(CLIENT_ID);
        GoogleIdTokenVerifier original = (GoogleIdTokenVerifier) ReflectionTestUtils.getField(service, "verifier");
        assertEquals(List.of(CLIENT_ID), List.copyOf(original.getAudience()));
        GooglePublicKeysManager keys = mock(GooglePublicKeysManager.class);
        when(keys.getPublicKeys()).thenReturn(List.of(trusted.getPublic()));
        when(keys.getJsonFactory()).thenReturn(GsonFactory.getDefaultInstance());
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(keys)
                .setAudience(original.getAudience()).setIssuers(original.getIssuers()).build();
        ReflectionTestUtils.setField(service, "verifier", verifier);
        long now = Instant.now().getEpochSecond();
        payload = new GoogleIdToken.Payload();
        payload.setIssuer("https://accounts.google.com");
        payload.setAudience(CLIENT_ID);
        payload.setIssuedAtTimeSeconds(now);
        payload.setExpirationTimeSeconds(now + 3600);
        payload.setSubject("test-google-sub");
        payload.setEmail("tester@gmail.com");
        payload.setEmailVerified(true);
    }

    String sign(PrivateKey key) throws Exception {
        var header = new JsonWebSignature.Header();
        header.setAlgorithm("RS256");
        return JsonWebSignature.signUsingRsaSha256(key, GsonFactory.getDefaultInstance(), header, payload);
    }

    void rejected() throws Exception {
        String credential = sign(trusted.getPrivate());
        assertThrows(LoginException.class, () -> service.verify(credential));
    }

    @Test void acceptsValidSignatureAndClaims() throws Exception {
        assertEquals("test-google-sub", service.verify(sign(trusted.getPrivate())).getSubject());
    }
    @Test void rejectsUntrustedSignature() throws Exception {
        String credential = sign(attacker.getPrivate());
        assertThrows(LoginException.class, () -> service.verify(credential));
    }
    @Test void rejectsOtherClientAudience() throws Exception {
        payload.setAudience("another-client.apps.googleusercontent.com");
        rejected();
    }
    @Test void rejectsOtherIssuer() throws Exception {
        payload.setIssuer("https://attacker.example.com");
        rejected();
    }
    @Test void rejectsExpiredToken() throws Exception {
        payload.setIssuedAtTimeSeconds(Instant.now().getEpochSecond() - 7200);
        payload.setExpirationTimeSeconds(Instant.now().getEpochSecond() - 3600);
        rejected();
    }
    @Test void rejectsFutureToken() throws Exception {
        payload.setIssuedAtTimeSeconds(Instant.now().getEpochSecond() + 3600);
        payload.setExpirationTimeSeconds(Instant.now().getEpochSecond() + 7200);
        rejected();
    }
    @Test void rejectsUnverifiedEmail() throws Exception {
        payload.setEmailVerified(false);
        rejected();
    }
    @Test void rejectsMissingEmailAndSubject() throws Exception {
        payload.setEmail(null);
        rejected();
        payload.setEmail("tester@gmail.com");
        payload.setSubject(" ");
        rejected();
    }
}
