import {useEffect, useState} from 'react';

const emptyForm = {
    imageUrl: '',
    source: '',
    licenseType: '',
    licenseNote: '',
    aiDescription: '',
    productId: '',
};

export default function ImageSamples() {
    const [samples, setSamples] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    async function loadSamples() {
        setLoading(true);
        try {
            const response = await fetch('/api/image-samples');
            if (!response.ok) throw new Error('無法讀取圖片樣本');
            setSamples(await response.json());
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadSamples();
    }, []);

    function updateForm(event) {
        setForm({...form, [event.target.name]: event.target.value});
    }

    async function createSample(event) {
        event.preventDefault();
        setMessage('');

        const response = await fetch('/api/image-samples', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                ...form,
                productId: form.productId ? Number(form.productId) : null,
            }),
        });

        if (!response.ok) {
            setMessage('新增樣本失敗，請確認圖片 URL 與資料表是否已建立');
            return;
        }

        setForm(emptyForm);
        setMessage('圖片樣本已新增，等待人工審核');
        await loadSamples();
    }

    async function reviewSample(id, reviewStatus) {
        const response = await fetch(`/api/image-samples/${id}/review`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({reviewStatus, reviewerNote: ''}),
        });

        if (response.ok) {
            await loadSamples();
        } else {
            setMessage('更新審核狀態失敗');
        }
    }

    async function deleteSample(id) {
        if (!window.confirm('確定要刪除這筆圖片樣本嗎？')) return;

        const response = await fetch(`/api/image-samples/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            await loadSamples();
        } else {
            setMessage('刪除樣本失敗');
        }
    }

    return (
        <main className="sample-admin">
            <h1>圖片樣本庫</h1>
            <p>管理圖片來源、授權資訊、AI 描述與人工審核狀態。</p>

            <form className="sample-form" onSubmit={createSample}>
                <input name="imageUrl" value={form.imageUrl}
                       onChange={updateForm} placeholder="圖片 URL" required/>
                <input name="source" value={form.source}
                       onChange={updateForm} placeholder="圖片來源"/>
                <input name="licenseType" value={form.licenseType}
                       onChange={updateForm} placeholder="授權類型"/>
                <input name="productId" value={form.productId}
                       onChange={updateForm} placeholder="關聯商品 ID" type="number"/>
                <textarea name="licenseNote" value={form.licenseNote}
                          onChange={updateForm} placeholder="授權備註"/>
                <textarea name="aiDescription" value={form.aiDescription}
                          onChange={updateForm} placeholder="AI 圖片描述"/>
                <button type="submit">新增圖片樣本</button>
            </form>

            {message && <p className="sample-message">{message}</p>}

            {loading ? <p>載入中…</p> : (
                <section className="sample-grid">
                    {samples.map(sample => (
                        <article className="sample-card" key={sample.id}>
                            <img src={sample.imageUrl} alt={sample.aiDescription || '圖片樣本'}/>
                            <div>
                                <strong>{sample.reviewStatus}</strong>
                                <p>來源：{sample.source || '未填寫'}</p>
                                <p>授權：{sample.licenseType || '未填寫'}</p>
                                <p>{sample.aiDescription || '尚未建立 AI 描述'}</p>
                                <button onClick={() => reviewSample(sample.id, '通過')}>通過</button>
                                <button onClick={() => reviewSample(sample.id, '退回')}>退回</button>
                                <button onClick={() => deleteSample(sample.id)}>刪除</button>
                            </div>
                        </article>
                    ))}
                    {!samples.length && <p>目前沒有圖片樣本。</p>}
                </section>
            )}
        </main>
    );
}
