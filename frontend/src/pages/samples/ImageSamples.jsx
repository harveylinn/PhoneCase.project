import {useEffect, useState} from 'react';

const emptyForm = {
    source: '',
    licenseType: '',
    licenseNote: '',
    aiDescription: '',
    productId: '',
};

export default function ImageSamples() {
    const [samples, setSamples] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [analyzingId, setAnalyzingId] = useState(null);
    const [candidates, setCandidates] = useState({});
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

    function chooseFile(event) {
        const selected = event.target.files?.[0];
        if (!selected) return;
        if (!selected.type.startsWith('image/')) {
            setMessage('只能選擇圖片檔案');
            return;
        }
        if (selected.size > 5 * 1024 * 1024) {
            setMessage('圖片大小不可超過 5MB');
            return;
        }
        setFile(selected);
        setPreview(URL.createObjectURL(selected));
        setMessage('');
    }

    async function createSample(event) {
        event.preventDefault();
        if (!file) {
            setMessage('請先選擇圖片');
            return;
        }

        setSaving(true);
        setMessage('');
        try {
            const uploadBody = new FormData();
            uploadBody.append('file', file);

            const uploadResponse = await fetch('/api/image-samples/upload', {
                method: 'POST',
                body: uploadBody,
            });
            if (!uploadResponse.ok) throw new Error('圖片上傳失敗');

            const {imageUrl} = await uploadResponse.json();
            const sampleResponse = await fetch('/api/image-samples', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    imageUrl,
                    ...form,
                    productId: form.productId ? Number(form.productId) : null,
                }),
            });
            if (!sampleResponse.ok) throw new Error('樣本資料儲存失敗');

            setForm(emptyForm);
            setFile(null);
            setPreview('');
            setMessage('圖片已快速加入樣本庫，等待人工審核');
            await loadSamples();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
    }

    async function reviewSample(id, reviewStatus) {
        const response = await fetch(`/api/image-samples/${id}/review`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({reviewStatus, reviewerNote: ''}),
        });
        if (response.ok) await loadSamples();
        else setMessage('更新審核狀態失敗');
    }

    async function deleteSample(id) {
        if (!window.confirm('確定要刪除這筆圖片樣本嗎？')) return;
        const response = await fetch(`/api/image-samples/${id}`, {method: 'DELETE'});
        if (response.ok) await loadSamples();
        else setMessage('刪除樣本失敗');
    }

    async function analyzeSample(id) {
        setAnalyzingId(id);
        setMessage('AI 正在分析圖片…');
        try {
            const response = await fetch(`/api/image-samples/${id}/analyze`, {
                method: 'POST',
            });
            if (!response.ok) throw new Error('AI 圖片分析失敗');
            const result = await response.json();
            setCandidates(current => ({
                ...current,
                [id]: result.candidates || [],
            }));
            await loadSamples();
            setMessage('AI 圖片描述已更新，請確認內容後再審核。');
        } catch (error) {
            setMessage(error.message);
        } finally {
            setAnalyzingId(null);
        }
    }

    async function confirmProduct(sampleId, productId) {
        const response = await fetch(`/api/image-samples/${sampleId}/product`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({productId}),
        });
        if (response.ok) {
            setMessage('商品關聯已確認');
            await loadSamples();
        } else {
            setMessage('商品關聯確認失敗');
        }
    }

    return (
        <main className="sample-admin">
            <h1>圖片樣本庫</h1>
            <p>選擇圖片即可快速加入樣本庫，之後再進行人工審核。</p>

            <form className="sample-form" onSubmit={createSample}>
                <input type="file" accept="image/*" onChange={chooseFile} required/>
                {preview && <img className="sample-upload-preview" src={preview} alt="圖片預覽"/>}
                <input name="source" value={form.source} onChange={updateForm} placeholder="圖片來源"/>
                <input name="licenseType" value={form.licenseType} onChange={updateForm} placeholder="授權類型"/>
                <input name="productId" value={form.productId} onChange={updateForm} placeholder="關聯商品 ID" type="number"/>
                <textarea name="licenseNote" value={form.licenseNote} onChange={updateForm} placeholder="授權備註"/>
                <textarea name="aiDescription" value={form.aiDescription} onChange={updateForm} placeholder="AI 圖片描述（之後可自動產生）"/>
                <button type="submit" disabled={saving}>{saving ? '上傳中…' : '快速新增樣本'}</button>
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
                                {sample.aiMatchStatus && (
                                    <p>
                                        商品比對：{sample.aiMatchStatus}
                                        {sample.aiMatchConfidence != null &&
                                            `（${sample.aiMatchConfidence}%）`}
                                    </p>
                                )}
                                {sample.aiMatchReason && <p>{sample.aiMatchReason}</p>}
                                {candidates[sample.id]?.length > 0 && (
                                    <div>
                                        <p>請選擇候選商品：</p>
                                        {candidates[sample.id].map(candidate => (
                                            <button
                                                key={candidate.variantId}
                                                onClick={() => confirmProduct(
                                                    sample.id, candidate.productId)}
                                            >
                                                確認 {candidate.productName}（{candidate.model}）
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <button
                                    onClick={() => analyzeSample(sample.id)}
                                    disabled={analyzingId === sample.id}
                                >
                                    {analyzingId === sample.id ? '分析中…' : 'AI 分析'}
                                </button>
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
