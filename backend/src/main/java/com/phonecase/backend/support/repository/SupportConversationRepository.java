package com.phonecase.backend.support.repository;

import com.phonecase.backend.support.entity.SupportConversation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportConversationRepository extends JpaRepository<SupportConversation, Long> {
}
