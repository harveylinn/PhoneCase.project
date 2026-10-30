import {useState} from 'react';
import {Link} from 'react-router-dom';
import {searchProductsWithAi} from '../services/aiSearchApi.js';
import {addToGuestCart} from '../utils/cartStorage';
import {addSupportMessage, createSupportConversation} from '../services/supportApi.js';

export default function AiChatWidget() {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [supportConversationId, setSupportConversationId] = useState(null);

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
            },
        ];

        setMessages(nextMessages);
        setText('');
        setLoading(true);

        try {
            if (supportConversationId) {
                await addSupportMessage(supportConversationId, question || '使用者上傳了一張圖片');
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
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                const result = String(reader.result);
                resolve(result.split(',')[1]);
            };

            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
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
                        <strong>PhoneCase 商品助手</strong>

                        <button type="button" onClick={() => setOpen(false)}>
                            ×
                        </button>
                    </header>

                    <div className="ai-chat-messages">
                        {messages.length === 0 && (
                            <>
                                <p className="ai-chat-welcome">
                                    你好！我可以協助商品推薦、圖片搜尋與常見問題。
                                </p>
                                <p className="ai-chat-scope-note">
                                    目前提供商品推薦與圖片搜尋；人工客服功能尚未連接。
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
