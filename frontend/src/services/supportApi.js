function getGuestId() {
    const key = 'phonecase_support_guest_id';
    let guestId = window.localStorage.getItem(key);
    if (!guestId) {
        guestId = `guest-${crypto.randomUUID()}`;
        window.localStorage.setItem(key, guestId);
    }
    return guestId;
}

const conversationKey = 'phonecase_support_conversation_id';

async function request(url, options) {
    const response = await fetch(url, {
        headers: {'Content-Type': 'application/json'},
        ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.message || '客服服務暫時無法使用');
    }
    return data;
}

export function createSupportConversation(message = '') {
    return request('/api/support/conversations', {
        method: 'POST',
        body: JSON.stringify({guestId: getGuestId(), message}),
    });
}

export function addSupportMessage(conversationId, message) {
    return request(`/api/support/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({message, guestId: getGuestId()}),
    });
}

export function listSupportMessages(conversationId) {
    const guestId = encodeURIComponent(getGuestId());
    return request(`/api/support/conversations/${conversationId}/customer-messages?guestId=${guestId}`);
}

export function getSavedSupportConversationId() {
    const value = window.localStorage.getItem(conversationKey);
    return value ? Number(value) : null;
}

export function saveSupportConversationId(conversationId) {
    window.localStorage.setItem(conversationKey, String(conversationId));
}
