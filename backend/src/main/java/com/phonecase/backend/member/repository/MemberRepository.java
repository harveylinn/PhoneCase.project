package com.phonecase.backend.member.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.phonecase.backend.member.entity.Member;
import java.util.Optional;


public interface MemberRepository extends JpaRepository<Member,Long>{
    boolean existsByAccount(String account);
    boolean existsByEmail(String email);
    Optional<Member> findByAccount(String account);
    
}
