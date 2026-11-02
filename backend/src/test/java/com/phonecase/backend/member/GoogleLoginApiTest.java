package com.phonecase.backend.member;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.util.ReflectionTestUtils;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.phonecase.backend.member.service.GoogleTokenService;
import com.phonecase.backend.member.exception.LoginException;
import com.phonecase.backend.member.entity.Member;
import tools.jackson.databind.json.JsonMapper;

/** 真正的 Controller、Service、JWT/AOP；Google 簽章驗證與資料庫使用替身。
 * 不會登入真實 Google 帳號，也不會寫入正式資料庫。
 */
class GoogleLoginApiTest extends MemberApiTest {
    GoogleTokenService google;

    @Override @BeforeEach void setup() {
        super.setup();
        google = mock(GoogleTokenService.class);
        // standalone MockMvc 保存的是 AOP proxy，取得底層 controller 注入 Google verifier。
        Object proxy = mvc.getDispatcherServlet().getWebApplicationContext()
                .getBean(com.phonecase.backend.member.controller.MemberController.class);
        Object target = org.springframework.test.util.AopTestUtils.getUltimateTargetObject(proxy);
        ReflectionTestUtils.setField(target, "googleTokenService", google);
        when(repository.findByGoogleSub(anyString())).thenAnswer(call -> members.values().stream()
                .filter(m -> call.getArgument(0).equals(m.getGoogleSub())).findFirst());
    }

    MockHttpSession challenge() throws Exception {
        var result = mvc.perform(get("/api/member/google/nonce"))
                .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.nonce").isString()).andReturn();
        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        assertNotNull(session);
        String nonce = new JsonMapper().readTree(result.getResponse().getContentAsString()).get("nonce").asText();
        assertEquals(nonce, session.getAttribute("googleNonce"));
        assertTrue((Long) session.getAttribute("googleNonceExpires") > System.currentTimeMillis());
        return session;
    }

    GoogleIdToken.Payload payload(MockHttpSession session) {
        var payload = new GoogleIdToken.Payload();
        payload.setSubject("test-google-sub");
        payload.setEmail("google-user@example.com");
        payload.setEmailVerified(true);
        payload.set("name", "Google 測試會員");
        payload.set("nonce", session.getAttribute("googleNonce"));
        when(google.verify("test-credential")).thenReturn(payload);
        return payload;
    }

    org.springframework.test.web.servlet.ResultActions login(MockHttpSession session) throws Exception {
        return mvc.perform(post("/api/member/google").session(session)
                .contentType(MediaType.APPLICATION_JSON).content("{\"credential\":\"test-credential\"}"));
    }

    @Test void newGoogleMemberCanUseJwtAndRepeatLoginWithoutDuplicate() throws Exception {
        MockHttpSession session = challenge();
        payload(session);
        String json = login(session).andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.member.email").value("google-user@example.com"))
                .andExpect(jsonPath("$.member.name").value("Google 測試會員"))
                .andExpect(jsonPath("$.member.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.member.googleSub").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        String token = new JsonMapper().readTree(json).get("token").asText();
        mvc.perform(get("/api/member/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.member.id").value(1));
        Member member = members.get(1L);
        assertNull(member.getPasswordHash());
        assertEquals("CUSTOMER", member.getRole());
        assertEquals("ACTIVE", member.getStatus());
        assertTrue(member.getAccount().startsWith("g_"));
        assertNull(session.getAttribute("googleNonce"));
        MockHttpSession next = challenge();
        payload(next);
        login(next).andExpect(status().isOk()).andExpect(jsonPath("$.member.id").value(1));
        assertEquals(1, members.size());
        verify(repository, times(1)).saveAndFlush(any(Member.class));
    }

    @Test void rejectsMissingSession() throws Exception {
        mvc.perform(post("/api/member/google").contentType(MediaType.APPLICATION_JSON)
                .content("{\"credential\":\"test-credential\"}"))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(google);
    }

    @Test void rejectsMissingEmptyAndOversizedCredentials() throws Exception {
        for (String body : new String[] {"{}", "{\"credential\":\"\"}",
                "{\"credential\":\"" + "x".repeat(10001) + "\"}"}) {
            mvc.perform(post("/api/member/google").contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());
        }
        verifyNoInteractions(google);
    }

    @Test void rejectsMismatchAndConsumesChallenge() throws Exception {
        MockHttpSession session = challenge();
        payload(session).set("nonce", "wrong-nonce");
        login(session).andExpect(status().isUnauthorized());
        assertNull(session.getAttribute("googleNonce"));
        assertTrue(members.isEmpty());
    }

    @Test void rejectsExpiredChallenge() throws Exception {
        MockHttpSession session = challenge();
        payload(session);
        session.setAttribute("googleNonceExpires", System.currentTimeMillis() - 1);
        login(session).andExpect(status().isUnauthorized());
        assertTrue(members.isEmpty());
    }

    @Test void rejectsReplay() throws Exception {
        MockHttpSession session = challenge();
        payload(session);
        login(session).andExpect(status().isOk());
        login(session).andExpect(status().isUnauthorized());
        assertEquals(1, members.size());
    }

    @Test void rejectsInvalidGoogleToken() throws Exception {
        MockHttpSession session = challenge();
        when(google.verify(anyString())).thenThrow(new LoginException("Google 憑證無效，請重試。"));
        login(session).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.success").value(false));
        assertTrue(members.isEmpty());
    }

    @Test void rejectsExistingEmailInsteadOfAutomaticallyLinking() throws Exception {
        Member original = addMember("google-user");
        MockHttpSession session = challenge();
        payload(session);
        login(session).andExpect(status().isUnauthorized());
        assertEquals(1, members.size());
        assertNull(original.getGoogleSub());
    }

    @Test void rejectsDisabledGoogleMember() throws Exception {
        Member member = addMember("google-user");
        member.setGoogleSub("test-google-sub");
        member.setStatus("DISABLED");
        MockHttpSession session = challenge();
        payload(session);
        login(session).andExpect(status().isUnauthorized());
    }

    @Test void googleOnlyMemberCannotUsePasswordLogin() throws Exception {
        MockHttpSession session = challenge();
        payload(session);
        login(session).andExpect(status().isOk());
        mvc.perform(post("/api/member/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"account\":\"" + members.get(1L).getAccount() + "\",\"password\":\"test123456\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test void normalizesMissingAndLongGoogleName() throws Exception {
        MockHttpSession session = challenge();
        payload(session).set("name", " ");
        login(session).andExpect(status().isOk()).andExpect(jsonPath("$.member.name").value("Google 會員"));
        MockHttpSession next = challenge();
        var other = payload(next);
        other.setSubject("another-sub");
        other.setEmail("another@example.com");
        other.set("name", "名".repeat(81));
        login(next).andExpect(status().isOk()).andExpect(jsonPath("$.member.name").value("名".repeat(80)));
    }

    @Test void realVerifierRejectsMalformedTokensWithoutGoogleAccount() {
        GoogleTokenService verifier = new GoogleTokenService("test-client.apps.googleusercontent.com");
        for (String credential : new String[] {"", "not-a-jwt", "a.b.c"}) {
            assertThrows(LoginException.class, () -> verifier.verify(credential));
        }
    }
}
