function getGuestId() {
    const key = 'phonecase_support_guest_id';
    let guestId = window.localStorage.getItem(key);
    if (!guestId) {
        guestId = `guest-${crypto.randomUUID()}`;
        window.localStorage.setItem(key, guestId);
    }
    return guestId;
}

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
        body: JSON.stringify({message}),
    });
}
