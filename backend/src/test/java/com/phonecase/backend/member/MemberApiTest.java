package com.phonecase.backend.member;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.Instant;
import java.time.LocalDateTime;
import jakarta.persistence.EntityManager;
import org.mockito.InOrder;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.aop.aspectj.annotation.AspectJProxyFactory;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import com.phonecase.backend.member.controller.MemberController;
import com.phonecase.backend.member.controller.MemberExceptionHandler;
import com.phonecase.backend.member.entity.Member;
import com.phonecase.backend.member.repository.MemberRepository;
import com.phonecase.backend.member.security.JwtAspect;
import com.phonecase.backend.member.security.JwtToken;
import com.phonecase.backend.member.service.MemberService;
import io.jsonwebtoken.Jwts;
import tools.jackson.databind.json.JsonMapper;

// 真正的 Controller、Service、驗證與 AOP；Repository 用記憶體替身，完全不連資料庫。
class MemberApiTest {
    MockMvc mvc;
    JwtToken jwt = new JwtToken();
    Map<Long, Member> members;
    MemberRepository repository;
    EntityManager entityManager;

    @BeforeEach
    void setup() {
        members = new HashMap<>();
        repository = mock(MemberRepository.class);
        when(repository.findById(anyLong())).thenAnswer(call -> Optional.ofNullable(members.get(call.getArgument(0))));
        when(repository.findByAccount(anyString())).thenAnswer(call -> members.values().stream().filter(m -> m.getAccount().equals(call.getArgument(0))).findFirst());
        when(repository.existsByAccount(anyString())).thenAnswer(call -> members.values().stream().anyMatch(m -> m.getAccount().equals(call.getArgument(0))));
        when(repository.existsByEmail(anyString())).thenAnswer(call -> members.values().stream().anyMatch(m -> m.getEmail().equals(call.getArgument(0))));
        when(repository.save(any(Member.class))).thenAnswer(call -> {
            Member member = call.getArgument(0);
            if (member.getId() == null) member.setId((long) members.size() + 1);
            members.put(member.getId(), member);
            return member;
        });
        when(repository.saveAndFlush(any(Member.class))).thenAnswer(call -> repository.save(call.getArgument(0)));
        entityManager = mock(EntityManager.class);
        MemberService service = new MemberService();
        ReflectionTestUtils.setField(service, "memberRepository", repository);
        ReflectionTestUtils.setField(service, "entityManager", entityManager);
        MemberController controller = new MemberController();
        ReflectionTestUtils.setField(controller, "memberService", service);
        ReflectionTestUtils.setField(controller, "jwtToken", jwt);
        JwtAspect aspect = new JwtAspect();
        ReflectionTestUtils.setField(aspect, "memberRepository", repository);
        ReflectionTestUtils.setField(aspect, "jwtToken", jwt);
        AspectJProxyFactory factory = new AspectJProxyFactory(controller);
        factory.addAspect(aspect);
        MemberController proxy = factory.getProxy();
        mvc = MockMvcBuilders.standaloneSetup(proxy)
            .setControllerAdvice(new MemberExceptionHandler())
            .addFilters((request, response, chain) -> {
                ReflectionTestUtils.setField(aspect, "request", request);
                chain.doFilter(request, response);
            }).build();
    }

    Member addMember(String account) {
        Member member = new Member();
        member.setCreatedAt(LocalDateTime.of(2026, 10, 1, 9, 10, 11));
        member.setUpdatedAt(LocalDateTime.of(2026, 10, 2, 12, 13, 14));
        member.setAccount(account); member.setName("測試會員"); member.setEmail(account + "@example.com");
        member.setPasswordHash(BCrypt.hashpw("test123456", BCrypt.gensalt(4)));
        return repository.save(member);
    }

    @Test void registrationAndDuplicates() throws Exception {
        String body = """
            {"account":"buyer","password":"test123456","name":"測試","phone":"0912345678","email":"buyer@example.com"}
            """;
        mvc.perform(post("/api/member/register").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.memberId").value(1));
        assertTrue(BCrypt.checkpw("test123456", members.get(1L).getPasswordHash()));
        assertTrue(members.get(1L).getPasswordHash().startsWith("$2a$12$"));
        mvc.perform(post("/api/member/register").contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
        mvc.perform(post("/api/member/register").contentType(MediaType.APPLICATION_JSON).content(body.replace("\"buyer\"", "\"other\""))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/member/register").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.account").exists());
    }

    @Test void loginAndCurrentMemberContract() throws Exception {
        Member member = addMember("buyer");
        String json = mvc.perform(post("/api/member/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"account\":\"buyer\",\"password\":\"test123456\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.member.email").value("buyer@example.com"))
            .andExpect(jsonPath("$.member.createdAt").value("2026-10-01T09:10:11"))
            .andExpect(jsonPath("$.member.updatedAt").value("2026-10-02T12:13:14"))
            .andExpect(jsonPath("$.member.passwordHash").doesNotExist()).andReturn().getResponse().getContentAsString();
        String token = new JsonMapper().readTree(json).get("token").asText();
        assertEquals(member.getId().toString(), jwt.verifyToken(token).getSubject());
        mvc.perform(get("/api/member/me").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk()).andExpect(jsonPath("$.member.phone").isEmpty())
            .andExpect(jsonPath("$.member.createdAt").value("2026-10-01T09:10:11"))
            .andExpect(jsonPath("$.member.updatedAt").value("2026-10-02T12:13:14"))
            .andExpect(jsonPath("$.member.passwordHash").doesNotExist());
        mvc.perform(post("/api/member/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"account\":\"buyer\",\"password\":\"wrong-password\"}")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/member/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"account\":\"missing\",\"password\":\"test123456\"}")).andExpect(status().isUnauthorized());
        member.setStatus("SUSPENDED");
        mvc.perform(post("/api/member/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"account\":\"buyer\",\"password\":\"test123456\"}")).andExpect(status().isUnauthorized());
    }

    @Test void rejectsMissingMalformedTamperedExpiredAndInvalidIdentity() throws Exception {
        Member member = addMember("buyer");
        String valid = jwt.createToken(member.getId());
        for (String header : new String[] {"", "Basic abc", "Bearer ", "Bearer garbage", "Bearer " + valid.substring(0, valid.lastIndexOf('.') + 1) + "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"}) {
            mvc.perform(get("/api/member/me").header("Authorization", header)).andExpect(status().isUnauthorized());
        }
        mvc.perform(get("/api/member/me")).andExpect(status().isUnauthorized());
        SecretKey key = (SecretKey) ReflectionTestUtils.getField(jwt, "signingKey");
        String expired = Jwts.builder().subject("1").expiration(Date.from(Instant.now().minusSeconds(10))).signWith(key).compact();
        mvc.perform(get("/api/member/me").header("Authorization", "Bearer " + expired)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/member/me").header("Authorization", "Bearer " + jwt.createToken(999L))).andExpect(status().isUnauthorized());
        member.setStatus("SUSPENDED");
        mvc.perform(get("/api/member/me").header("Authorization", "Bearer " + valid)).andExpect(status().isUnauthorized());
        mvc.perform(patch("/api/member/me").header("Authorization", "Bearer " + valid).contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isUnauthorized());
    }

    @Test void profileUpdateReturnsRefreshedDatabaseTimestamps() throws Exception {
        Member member = addMember("timestamps");
        // 模擬資料庫產生時間；此測試只驗證 flush、refresh 與回應契約。
        doAnswer(call -> {
            Member refreshed = call.getArgument(0);
            refreshed.setUpdatedAt(LocalDateTime.of(2026, 10, 29, 14, 30, 5));
            return null;
        }).when(entityManager).refresh(member);
        clearInvocations(repository, entityManager);
        String bearer = "Bearer " + jwt.createToken(member.getId());
        mvc.perform(patch("/api/member/me").header("Authorization", bearer)
            .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"更新姓名\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.member.createdAt").value("2026-10-01T09:10:11"))
            .andExpect(jsonPath("$.member.updatedAt").value("2026-10-29T14:30:05"))
            .andExpect(jsonPath("$.member.passwordHash").doesNotExist());
        InOrder order = inOrder(repository, entityManager);
        order.verify(repository).saveAndFlush(member);
        order.verify(entityManager).refresh(member);
        mvc.perform(get("/api/member/me").header("Authorization", bearer))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.member.createdAt").value("2026-10-01T09:10:11"))
            .andExpect(jsonPath("$.member.updatedAt").value("2026-10-29T14:30:05"));
    }

    @Test void profileUpdateOwnershipValidationAndEmptyValues() throws Exception {
        Member first = addMember("first"); Member other = addMember("other");
        String bearer = "Bearer " + jwt.createToken(first.getId());
        mvc.perform(patch("/api/member/me").header("Authorization", bearer).contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\" 新姓名 \",\"phone\":\"0912345678\",\"defaultAddress\":\" 台北市 \"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.member.name").value("新姓名"));
        assertEquals("測試會員", other.getName());
        mvc.perform(patch("/api/member/me").header("Authorization", bearer).contentType(MediaType.APPLICATION_JSON).content("{\"phone\":\"\",\"defaultAddress\":\"\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.member.name").value("新姓名")).andExpect(jsonPath("$.member.phone").isEmpty());
        for (String body : new String[] {"{\"name\":\" \"}", "{\"phone\":\"bad\"}", "{\"name\":\"" + "a".repeat(81) + "\"}", "{\"defaultAddress\":\"" + "a".repeat(501) + "\"}", "{"}) {
            mvc.perform(patch("/api/member/me").header("Authorization", bearer).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
        }
        for (String field : new String[] {"id", "account", "email", "role", "status", "passwordHash", "createdAt", "updatedAt"}) {
            mvc.perform(patch("/api/member/me").header("Authorization", bearer).contentType(MediaType.APPLICATION_JSON).content("{\"" + field + "\":\"forbidden\"}"))
                .andExpect(status().isBadRequest());
        }
        mvc.perform(patch("/api/member/me").header("Authorization", bearer).contentType(MediaType.APPLICATION_JSON).content("{\"name\":null}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.member.name").value("新姓名"));
        mvc.perform(patch("/api/member/me").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isUnauthorized());
    }
}
