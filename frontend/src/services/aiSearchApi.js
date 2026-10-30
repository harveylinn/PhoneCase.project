export async function searchProductsWithAi(
    text,
    imageBase64 = null,
    imageMimeType = null,
    imageFileName = null
) {
    const body = {
        text,
    };

    if (imageBase64) {
        body.imageBase64 = imageBase64;
        body.imageMimeType = imageMimeType;
        body.imageFileName = imageFileName;
    }

    // AI 模型可能在 Ollama 未啟動時長時間等待，因此前端設定明確的逾時時間。
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30_000);

    let response;
    try {
        response = await fetch('/api/ai/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
    } catch (error) {
        if (error?.name === 'AbortError') {
            const timeoutError = new Error('AI 分析逾時，請確認 Ollama 已啟動後再試。');
            timeoutError.code = 'AI_REQUEST_TIMEOUT';
            timeoutError.status = 504;
            throw timeoutError;
        }

        const connectionError = new Error('無法連線到 AI 服務，請確認後端與 Ollama 已啟動。');
        connectionError.code = 'AI_CONNECTION_FAILED';
        connectionError.status = 502;
        throw connectionError;
    } finally {
        window.clearTimeout(timeoutId);
    }

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(data.message || 'AI 搜尋失敗');
        error.code = data.code || 'AI_SEARCH_FAILED';
        error.status = response.status;
        throw error;
    }

    return data;
}
