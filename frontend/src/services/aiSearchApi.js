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

    const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'AI 搜尋失敗');
    }

    return data.answer;
}
