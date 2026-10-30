package com.phonecase.backend.support.controller;

import com.phonecase.backend.support.dto.CreateSupportConversationRequest;
import com.phonecase.backend.support.dto.CreateSupportMessageRequest;
import com.phonecase.backend.support.entity.SupportConversation;
import com.phonecase.backend.support.entity.SupportMessage;
import com.phonecase.backend.support.service.SupportService;
import com.phonecase.backend.member.security.AdminOnly;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/** 人工客服 API；目前先提供前台建立案件與留言。 */
@RestController
@RequestMapping("/api/support")
public class SupportController {
    private final SupportService supportService;

    public SupportController(SupportService supportService) {
        this.supportService = supportService;
    }

    @PostMapping("/conversations")
    @ResponseStatus(HttpStatus.CREATED)
    public SupportConversation createConversation(@RequestBody CreateSupportConversationRequest request) {
        return supportService.createConversation(request);
    }

    @PostMapping("/conversations/{conversationId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public SupportMessage addMessage(@PathVariable Long conversationId,
                                     @RequestBody CreateSupportMessageRequest request) {
        return supportService.addMessage(conversationId, request);
    }

    @PostMapping("/conversations/{conversationId}/staff-messages")
    @AdminOnly
    @ResponseStatus(HttpStatus.CREATED)
    public SupportMessage addStaffMessage(@PathVariable Long conversationId,
                                          @RequestBody CreateSupportMessageRequest request) {
        return supportService.addStaffMessage(conversationId, request);
    }

    @GetMapping("/conversations")
    @AdminOnly
    public List<SupportConversation> listConversations() {
        return supportService.listConversations();
    }

    @GetMapping("/conversations/{conversationId}/messages")
    @AdminOnly
    public List<SupportMessage> listMessages(@PathVariable Long conversationId) {
        return supportService.listMessages(conversationId);
    }

    @PatchMapping("/conversations/{conversationId}/status")
    @AdminOnly
    public SupportConversation updateStatus(@PathVariable Long conversationId,
                                            @RequestParam String status) {
        return supportService.updateStatus(conversationId, status);
    }
}
