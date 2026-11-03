import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {searchProductsWithAi} from '../services/aiSearchApi.js';
import {addToGuestCart} from '../utils/cartStorage';
import {
    addSupportMessage,
    clearSavedSupportConversationId,
    closeSupportConversation,
    createSupportConversation,
    getSavedSupportConversationId,
    listSupportMessages,
    saveSupportConversationId,
} from '../services/supportApi.js';

export default function AiChatWidget() {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [supportConversationId, setSupportConversationId] = useState(getSavedSupportConversationId);

    useEffect(() => {
        if (!open || !supportConversationId) return undefined;

        let active = true;
        const refreshSupportMessages = async () => {
            try {
                const supportMessages = await listSupportMessages(supportConversationId);
                if (!active) return;
                const staffMessages = supportMessages.filter(item => item.senderType === 'STAFF');
                setMessages(current => {
                    const knownIds = new Set(current.map(item => item.supportMessageId).filter(Boolean));
                    const newMessages = staffMessages
                        .filter(item => !knownIds.has(item.id))
                        .map(item => ({role: 'assistant', content: item.message, supportMessageId: item.id}));
                    return newMessages.length ? [...current, ...newMessages] : current;
                });
            } catch {
                // A transient polling error should not interrupt the chat.
            }
        };

        refreshSupportMessages();
        const timer = window.setInterval(refreshSupportMessages, 4000);
        return () => {
            active = false;
            window.clearInterval(timer);
        };
    }, [open, supportConversationId]);

    const quickQuestions = [
        '我想找適合我的手機殼',
        '聯絡人工客服',
    ];

    async function handleQuickQuestion(question) {
        if (loading) return;

        if (question === '聯絡人工客服') {
            setLoading(true);
            setMessages(current => [
                ...current,
                {role: 'user', content: question},
            ]);
            try {
                const conversation = await createSupportConversation('使用者申請轉接人工客服');
                setSupportConversationId(conversation.id);
                saveSupportConversationId(conversation.id);
                setMessages(current => [
                    ...current,
                    {role: 'assistant', content: `已建立人工客服案件 #${conversation.id}。請留下你的問題，客服人員會查看。`},
                ]);
            } catch (error) {
                setMessages(current => [
                    ...current,
                    {role: 'assistant', content: `人工客服暫時無法連線：${error.message}`},
                ]);
            } finally {
                setLoading(false);
            }
            return;
        }

        setText(question);
    }

    async function handleReturnToAi() {
        if (!supportConversationId || loading) return;
        setLoading(true);
        try {
            await closeSupportConversation(supportConversationId);
            clearSavedSupportConversationId();
            setSupportConversationId(null);
            setMessages([]);
            setImageFile(null);
            setImagePreview('');
            setText('');
        } catch (error) {
            setMessages(current => [...current, {
                role: 'assistant',
                content: `結束客服失敗：${error.message}`,
            }]);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const question = text.trim();

        if ((!question && !imageFile) || loading) {
            return;
        }

        const conversationContext = messages
            .slice(-6)
            // 只傳使用者說過的內容，避免 AI 回覆中的「顏色未確認」被誤判成搜尋條件。
            .filter(message => message.role === 'user')
            .map(message => `${message.role === 'user' ? '使用者' : '客服'}：${message.content}`)
            .join('\n');
        const actualQuestion = conversationContext
            ? `以下是前面的對話：\n${conversationContext}\n最新問題：${question || '請分析這張圖片，並根據商品資料提供建議。'}`
            : question || '請分析這張圖片，並根據商品資料提供建議。';

        const nextMessages = [
            ...messages,
            {
                role: 'user',
                content: question || '圖片',
                imageDataUrl: imagePreview || null,
            },
        ];

        setMessages(nextMessages);
        setText('');
        setLoading(true);

        try {
            if (supportConversationId) {
                const attachmentDataUrl = imageFile ? await fileToDataUrl(imageFile) : null;
                await addSupportMessage(
                    supportConversationId,
                    question,
                    attachmentDataUrl
                );
                setMessages([
                    ...nextMessages,
                    {role: 'assistant', content: '訊息已送出，人工客服會查看你的問題。'},
                ]);
                setImageFile(null);
                setImagePreview('');
                return;
            }

            const imageBase64 = imageFile
                ? await fileToBase64(imageFile)
                : null;

            const result = await searchProductsWithAi(
                actualQuestion,
                imageBase64,
                imageFile?.type,
                imageFile?.name
            );

            setMessages([
                ...nextMessages,
                {role: 'assistant', content: result.answer, products: result.products ?? []},
            ]);

            setImageFile(null);
            setImagePreview('');
        } catch (error) {
            if (supportConversationId) {
                setMessages([
                    ...nextMessages,
                    {role: 'assistant', content: `訊息傳送失敗：${error.message}`},
                ]);
                return;
            }
            const message = error.code === 'AI_SERVICE_UNAVAILABLE'
                ? 'AI 服務目前無法回應，請確認 Ollama 已啟動，稍後再試。'
                : error.code === 'AI_REQUEST_TIMEOUT'
                    ? 'AI 分析逾時，請確認 Ollama 已啟動後再試。'
                    : error.code === 'AI_CONNECTION_FAILED'
                        ? '無法連線到 AI 服務，請確認後端與 Ollama 已啟動。'
                : error.status === 400
                    ? error.message
                    : 'AI 暫時無法完成分析，請稍後再試。';
            setMessages([
                ...nextMessages,
                {role: 'assistant', content: message},
            ]);
        } finally {
            setLoading(false);
        }
    }
    function fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function fileToBase64(file) {
        const dataUrl = await fileToDataUrl(file);
        return dataUrl.split(',')[1];
    }
    function handleImageChange(event) {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('請選擇圖片檔案');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('圖片大小不能超過 5MB');
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    }

    function clearImage() {
        setImageFile(null);
        setImagePreview('');
    }

    return (
        <>
            <button
                className="ai-chat-button"
                type="button"
                aria-label={open ? '關閉 AI 客服' : '開啟 AI 客服'}
                onClick={() => setOpen(current => !current)}
            >
                {open ? (
                    <span className="ai-chat-close-icon">×</span>
                ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 5h14v10H9l-4 4V5Z" />
                        <path d="M8 9h8M8 12h5" />
                    </svg>
                )}
            </button>

            {open && (
                <section className="ai-chat-window">
                    <header className="ai-chat-header">
                        <strong>{supportConversationId ? '人工客服案件' : 'PhoneCase 商品助手'}</strong>
                        <div className="ai-chat-header-actions">
                            {supportConversationId && (
                                <button type="button" onClick={handleReturnToAi} disabled={loading}>
                                    返回 AI
                                </button>
                            )}
                            <button type="button" aria-label="關閉聊天視窗" onClick={() => setOpen(false)}>
                                ×
                            </button>
                        </div>
                    </header>

                    <div className="ai-chat-messages">
                        {messages.length === 0 && (
                            <>
                                <p className="ai-chat-welcome">
                                    你好！我可以協助商品推薦、圖片搜尋與常見問題。
                                </p>
                                <p className="ai-chat-scope-note">
                                    商品推薦、圖片搜尋與人工客服皆可使用。
                                </p>
                                <div className="ai-chat-quick-actions" aria-label="常見問題">
                                    {quickQuestions.map(question => (
                                        <button key={question} type="button" onClick={() => handleQuickQuestion(question)}>
                                            {question}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {messages.map((message, index) => (
                            <div
                                className={`ai-chat-message ${message.role}`}
                                key={`${message.role}-${index}`}
                            >
                                {message.content}
                                {message.imageDataUrl && (
                                    <img className="ai-chat-message-image" src={message.imageDataUrl} alt="客服訊息附件" />
                                )}
                                {message.products?.length > 0 && (
                                    <div className="ai-chat-product-list">
                                        {message.products.map(product => (
                                            <article className="ai-chat-product-card" key={product.variantId}>
                                                {product.imageUrl && <img src={product.imageUrl} alt={`${product.productName} ${product.model}`} />}
                                                <div className="ai-chat-product-info">
                                                    <strong>{product.productName}</strong>
                                                    <span>{product.model} · {product.color}</span>
                                                    <b>NT$ {Number(product.price).toLocaleString()}</b>
                                                    <div className="ai-chat-product-actions">
                                                        <Link to={`/products/${product.productId}?variantId=${product.variantId}`}>查看</Link>
                                                        <button type="button" onClick={() => {
                                                            addToGuestCart({
                                                                variantId: product.variantId,
                                                                name: product.productName,
                                                                brand: product.brand,
                                                                model: product.model,
                                                                color: product.color,
                                                                price: Number(product.price),
                                                                imageUrl: product.imageUrl ?? '',
                                                            });
                                                            setMessages(current => [...current, {role: 'assistant', content: `${product.productName} 已加入購物車。`}]);
                                                        }}>加入購物車</button>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="ai-chat-message assistant">
                                正在思考中…
                            </div>
                        )}
                    </div>

                    {imagePreview && (
                        <div className="ai-chat-image-preview">
                            <img src={imagePreview} alt="即將上傳的圖片" />

                            <button type="button" onClick={clearImage}>
                                ×
                            </button>
                        </div>
                    )}

                    <form className="ai-chat-form" onSubmit={handleSubmit}>
                        <label className="ai-chat-image-button" title="上傳圖片">
                            📎
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                hidden
                            />
                        </label>

                        <input
                            value={text}
                            onChange={event => setText(event.target.value)}
                            placeholder="輸入你的問題"
                            disabled={loading}
                        />

                        <button
                            type="submit"
                            disabled={loading || (!text.trim() && !imageFile)}
                        >
                            傳送
                        </button>
                    </form>
                </section>
            )}
        </>
    );
}
