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
            saveMessage(saved.getId(), request.message(), null, "CUSTOMER");
        }
        return saved;
    }

    @Transactional
    public SupportMessage addMessage(Long conversationId, CreateSupportMessageRequest request) {
        if (request == null || isBlank(request.guestId())) {
            throw new IllegalArgumentException("訪客識別碼無效");
        }
        SupportConversation conversation = requireGuestConversation(conversationId, request.guestId());
        if ("CLOSED".equals(conversation.getStatus())) {
            throw new IllegalArgumentException("此客服案件已結束，請重新建立客服案件");
        }
        return saveMessage(conversationId, request.message(), request.attachmentDataUrl(), "CUSTOMER");
    }

    @Transactional
    public SupportMessage addStaffMessage(Long conversationId, CreateSupportMessageRequest request) {
        requireConversation(conversationId);
        return saveMessage(conversationId, request == null ? null : request.message(),
                request == null ? null : request.attachmentDataUrl(), "STAFF");
    }

    private SupportMessage saveMessage(Long conversationId, String content,
                                       String attachmentDataUrl, String senderType) {
        if (isBlank(content) && isBlank(attachmentDataUrl)) {
            throw new IllegalArgumentException("客服訊息不可為空白");
        }
        validateAttachment(attachmentDataUrl);
        SupportMessage message = new SupportMessage();
        message.setConversationId(conversationId);
        message.setSenderType(senderType);
        message.setMessage(isBlank(content) ? "" : content.trim());
        message.setAttachmentDataUrl(attachmentDataUrl);
        return messageRepository.save(message);
    }

    /** 只接受明確的圖片 data URL，並限制單張圖片大小，避免任意內容灌入資料庫。 */
    private void validateAttachment(String dataUrl) {
        if (isBlank(dataUrl)) return;
        if (!dataUrl.matches("^data:image/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]*={0,2}$")
                || dataUrl.length() > 7_000_000) {
            throw new IllegalArgumentException("圖片格式不支援或超過 5MB");
        }
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
    public SupportConversation closeGuestConversation(Long conversationId, String guestId) {
        SupportConversation conversation = requireGuestConversation(conversationId, guestId);
        conversation.setStatus("CLOSED");
        return conversationRepository.save(conversation);
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
