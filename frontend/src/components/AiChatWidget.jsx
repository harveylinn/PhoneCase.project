import {useState} from 'react';
import {searchProductsWithAi} from '../services/aiSearchApi.js';

export default function AiChatWidget() {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    async function handleSubmit(event) {
        event.preventDefault();

        const question = text.trim();

        if ((!question && !imageFile) || loading) {
            return;
        }

        const actualQuestion =
            question || '請分析這張圖片，並根據商品資料提供建議。';

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
            const imageBase64 = imageFile
                ? await fileToBase64(imageFile)
                : null;

            const answer = await searchProductsWithAi(
                actualQuestion,
                imageBase64,
                imageFile?.type
            );

            setMessages([
                ...nextMessages,
                { role: 'assistant', content: answer },
            ]);

            setImageFile(null);
            setImagePreview('');
        } catch (error) {
            setMessages([
                ...nextMessages,
                {role: 'assistant', content: `發生錯誤：${error.message}`},
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
                            <p className="ai-chat-welcome">
                                你好！可以詢問手機型號、材質、價格或防護功能。
                            </p>
                        )}

                        {messages.map((message, index) => (
                            <div
                                className={`ai-chat-message ${message.role}`}
                                key={`${message.role}-${index}`}
                            >
                                {message.content}
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
