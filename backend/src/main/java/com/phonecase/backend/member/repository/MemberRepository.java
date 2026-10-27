package com.phonecase.backend.member.repository;

import com.phonecase.backend.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {

    boolean existsByAccount(String account);

    boolean existsByEmail(String email);
}
