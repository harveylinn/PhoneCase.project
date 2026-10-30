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
        if (request == null || (isBlank(request.guestId()) && isBlank(request.message()))) {
            throw new IllegalArgumentException("請提供客服問題或訪客識別碼");
        }
        SupportConversation conversation = new SupportConversation();
        conversation.setGuestId(request.guestId());
        SupportConversation saved = conversationRepository.save(conversation);
        if (!isBlank(request.message())) {
            addMessage(saved.getId(), new CreateSupportMessageRequest(request.message()));
        }
        return saved;
    }

    @Transactional
    public SupportMessage addMessage(Long conversationId, CreateSupportMessageRequest request) {
        return addMessage(conversationId, request, "CUSTOMER");
    }

    @Transactional
    public SupportMessage addStaffMessage(Long conversationId, CreateSupportMessageRequest request) {
        return addMessage(conversationId, request, "STAFF");
    }

    private SupportMessage addMessage(Long conversationId, CreateSupportMessageRequest request, String senderType) {
        if (!conversationRepository.existsById(conversationId)) {
            throw new IllegalArgumentException("找不到客服案件");
        }
        if (request == null || isBlank(request.message())) {
            throw new IllegalArgumentException("客服訊息不可為空白");
        }
        SupportMessage message = new SupportMessage();
        message.setConversationId(conversationId);
        message.setSenderType(senderType);
        message.setMessage(request.message().trim());
        return messageRepository.save(message);
    }

    public List<SupportConversation> listConversations() {
        return conversationRepository.findAll();
    }

    public List<SupportMessage> listMessages(Long conversationId) {
        if (!conversationRepository.existsById(conversationId)) {
            throw new IllegalArgumentException("找不到客服案件");
        }
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
