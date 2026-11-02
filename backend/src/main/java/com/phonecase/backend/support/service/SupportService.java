package com.phonecase.backend.support.service;

import com.phonecase.backend.support.dto.CreateSupportConversationRequest;
import com.phonecase.backend.support.dto.CreateSupportMessageRequest;
import com.phonecase.backend.support.entity.SupportConversation;
import com.phonecase.backend.support.entity.SupportMessage;
import com.phonecase.backend.support.repository.SupportConversationRepository;
import com.phonecase.backend.support.repository.SupportMessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

/** 人工客服案件服務，先完成案件與訊息保存。 */
@Service
public class SupportService {
    private final SupportConversationRepository conversationRepository;
    private final SupportMessageRepository messageRepository;

    public SupportService(SupportConversationRepository conversationRepository,
                          SupportMessageRepository messageRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
    }

    @Transactional
    public SupportConversation createConversation(CreateSupportConversationRequest request) {
        if (request == null || isBlank(request.guestId())) {
            throw new IllegalArgumentException("訪客識別碼無效");
        }
        SupportConversation conversation = new SupportConversation();
        conversation.setGuestId(request.guestId());
        SupportConversation saved = conversationRepository.save(conversation);
        if (!isBlank(request.message())) {
            saveMessage(saved.getId(), request.message(), "CUSTOMER");
        }
        return saved;
    }

    @Transactional
    public SupportMessage addMessage(Long conversationId, CreateSupportMessageRequest request) {
        if (request == null || isBlank(request.guestId())) {
            throw new IllegalArgumentException("訪客識別碼無效");
        }
        requireGuestConversation(conversationId, request.guestId());
        return saveMessage(conversationId, request.message(), "CUSTOMER");
    }

    @Transactional
    public SupportMessage addStaffMessage(Long conversationId, CreateSupportMessageRequest request) {
        requireConversation(conversationId);
        return saveMessage(conversationId, request == null ? null : request.message(), "STAFF");
    }

    private SupportMessage saveMessage(Long conversationId, String content, String senderType) {
        if (isBlank(content)) {
            throw new IllegalArgumentException("客服訊息不可為空白");
        }
        SupportMessage message = new SupportMessage();
        message.setConversationId(conversationId);
        message.setSenderType(senderType);
        message.setMessage(content.trim());
        return messageRepository.save(message);
    }

    private SupportConversation requireConversation(Long conversationId) {
        return conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("找不到客服案件"));
    }

    private SupportConversation requireGuestConversation(Long conversationId, String guestId) {
        return conversationRepository.findByIdAndGuestId(conversationId, guestId.trim())
                .orElseThrow(() -> new IllegalArgumentException("找不到客服案件或訪客身分不符"));
    }

    public List<SupportConversation> listConversations() {
        return conversationRepository.findAll();
    }

    public List<SupportMessage> listMessages(Long conversationId) {
        requireConversation(conversationId);
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    public List<SupportMessage> listGuestMessages(Long conversationId, String guestId) {
        if (isBlank(guestId)) {
            throw new IllegalArgumentException("訪客識別碼無效");
        }
        requireGuestConversation(conversationId, guestId);
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    @Transactional
    public SupportConversation updateStatus(Long conversationId, String status) {
        if (!List.of("OPEN", "IN_PROGRESS", "CLOSED").contains(status)) {
            throw new IllegalArgumentException("客服案件狀態無效");
        }
        SupportConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("找不到客服案件"));
        conversation.setStatus(status);
        return conversationRepository.save(conversation);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
