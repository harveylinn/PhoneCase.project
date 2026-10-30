import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

async function api(url, options = {}) {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
        headers: {'Content-Type': 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {})},
        ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || '客服資料讀取失敗');
    return data;
}

export default function SupportAdmin() {
    const [conversations, setConversations] = useState([]);
    const [selected, setSelected] = useState(null);
    const [messages, setMessages] = useState([]);
    const [reply, setReply] = useState('');
    const [error, setError] = useState('');

    async function loadConversations() {
        try { setConversations(await api('/api/support/conversations')); setError(''); }
        catch (exception) { setError(exception.message); }
    }

    async function selectConversation(conversation) {
        setSelected(conversation);
        try { setMessages(await api(`/api/support/conversations/${conversation.id}/messages`)); }
        catch (exception) { setError(exception.message); }
    }

    useEffect(() => { loadConversations(); }, []);

    async function sendReply(event) {
        event.preventDefault();
        if (!selected || !reply.trim()) return;
        try {
            await api(`/api/support/conversations/${selected.id}/staff-messages`, {
                method: 'POST', body: JSON.stringify({message: reply.trim()}),
            });
            setReply('');
            await selectConversation(selected);
        } catch (exception) { setError(exception.message); }
    }

    async function changeStatus(status) {
        if (!selected) return;
        try {
            const updated = await api(`/api/support/conversations/${selected.id}/status?status=${status}`, {method: 'PATCH'});
            setSelected(updated);
            setConversations(items => items.map(item => item.id === updated.id ? updated : item));
        } catch (exception) { setError(exception.message); }
    }

    return <main className="admin-page page-shell">
        <div className="admin-heading"><p className="eyebrow">CASEL​AB ADMIN · SUPPORT</p><h1>人工客服</h1><p>查看客服案件、回覆訊息與更新處理狀態。</p></div>
        {error && <div className="admin-error">{error}</div>}
        <div className="admin-with-sidebar">
            <aside className="admin-sidebar panel">
                <p className="admin-sidebar-title">後台管理</p>
                <Link to="/admin-products">商品系列管理</Link>
                <Link to="/admin-products/variants">手機品項／SKU</Link>
                <Link to="/admin/samples">圖片樣本庫</Link>
                <Link className="is-active" to="/admin/support">人工客服</Link>
            </aside>
            <section className="admin-layout">
                <aside className="admin-list panel">
                    <h2>客服案件</h2>
                    {!conversations.length && <p>目前沒有客服案件。</p>}
                    {conversations.map(item => <button type="button" key={item.id} className={`admin-list-item ${selected?.id === item.id ? 'is-selected' : ''}`} onClick={() => selectConversation(item)}>
                        <strong>案件 #{item.id}</strong><small>{item.status} · {item.guestId || '會員'}</small>
                    </button>)}
                </aside>
                <section className="admin-editor panel">
                    {!selected ? <p>請選擇左側客服案件。</p> : <>
                        <h2>案件 #{selected.id}</h2>
                        <label>案件狀態<select value={selected.status} onChange={event => changeStatus(event.target.value)}><option value="OPEN">待處理</option><option value="IN_PROGRESS">處理中</option><option value="CLOSED">已完成</option></select></label>
                        <div className="support-message-list">{messages.map(item => <div className={`support-message ${item.senderType === 'STAFF' ? 'is-staff' : ''}`} key={item.id}><small>{item.senderType}</small><p>{item.message}</p></div>)}</div>
                        <form onSubmit={sendReply}><textarea value={reply} onChange={event => setReply(event.target.value)} placeholder="輸入客服回覆" rows="4"/><button className="button button-primary" type="submit">送出回覆</button></form>
                    </>}
                </section>
            </section>
        </div>
    </main>;
}
