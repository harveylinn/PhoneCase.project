import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

const emptyForm = {
    imageUrl: '',
    source: 'Cloudinary',
    licenseType: '',
    licenseNote: '',
    aiDescription: '',
    productId: '',
};

function adminFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? {Authorization: `Bearer ${token}`} : {}),
            ...options.headers,
        },
    });
}

export default function ImageSamples() {
    const [samples, setSamples] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [analyzingId, setAnalyzingId] = useState(null);
    const [editingDescriptionId, setEditingDescriptionId] = useState(null);
    const [descriptionDraft, setDescriptionDraft] = useState('');
    const [candidates, setCandidates] = useState({});
    const [message, setMessage] = useState('');

    async function loadSamples() {
        setLoading(true);
        try {
            const response = await adminFetch('/api/image-samples');
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
        setSaving(true);
        setMessage('');
        try {
            const imageUrl = form.imageUrl.trim();
            const url = new URL(imageUrl);
            if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com'
                || url.username || url.password || url.port || url.hash
                || !/^\/[^/]+\/image\/upload\/.+/.test(url.pathname)) {
                throw new Error('請貼上 Cloudinary 的 HTTPS 圖片網址');
            }
            const response = await adminFetch('/api/image-samples', {
                method: 'POST',
                body: JSON.stringify({
                    ...form,
                    imageUrl,
                    productId: form.productId ? Number(form.productId) : null,
                }),
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || '樣本資料儲存失敗');
            }
            setForm(emptyForm);
            setMessage('雲端圖片已加入樣本庫，等待人工審核');
            await loadSamples();
        } catch (error) {
            setMessage(error.message === 'Invalid URL' ? '請輸入完整的 Cloudinary 圖片網址' : error.message);
        } finally {
            setSaving(false);
        }
    }

    async function reviewSample(id, reviewStatus) {
        const response = await adminFetch(`/api/image-samples/${id}/review`, {
            method: 'PATCH',
            body: JSON.stringify({reviewStatus, reviewerNote: ''}),
        });
        if (response.ok) await loadSamples();
        else setMessage('更新審核狀態失敗');
    }

    async function deleteSample(id) {
        if (!window.confirm('確定要刪除這筆圖片樣本嗎？')) return;
        const response = await adminFetch(`/api/image-samples/${id}`, {method: 'DELETE'});
        if (response.ok) await loadSamples();
        else setMessage('刪除樣本失敗');
    }

    async function analyzeSample(id) {
        setAnalyzingId(id);
        setMessage('AI 正在分析圖片…');
        try {
            const response = await adminFetch(`/api/image-samples/${id}/analyze`, {
                method: 'POST',
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'AI 圖片分析失敗');
            }
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

    async function confirmProduct(sampleId, productId, variantId) {
        const response = await adminFetch(`/api/image-samples/${sampleId}/product`, {
            method: 'PATCH',
            body: JSON.stringify({productId, variantId}),
        });
        if (response.ok) {
            setMessage('商品關聯已確認');
            await loadSamples();
        } else {
            setMessage('商品關聯確認失敗');
        }
    }

    function startDescriptionEdit(sample) {
        setEditingDescriptionId(sample.id);
        setDescriptionDraft(sample.aiDescription || '');
    }

    async function saveDescription(id) {
        const response = await adminFetch(`/api/image-samples/${id}/description`, {
            method: 'PATCH',
            body: JSON.stringify({aiDescription: descriptionDraft.trim()}),
        });
        if (!response.ok) {
            setMessage('AI 分析修正失敗');
            return;
        }
        setEditingDescriptionId(null);
        setDescriptionDraft('');
        setMessage('AI 分析已修正，請確認後再通過審核。');
        await loadSamples();
    }

    return (
        <main className="sample-admin">
            <div className="admin-heading">
                <div>
                    <p className="eyebrow">CASELAB ADMIN · DATASET</p>
                    <h1>圖片樣本庫</h1>
                    <p className="muted">管理圖片來源、授權資訊、AI 描述與人工審核狀態。</p>
                </div>
            </div>

            <div className="admin-with-sidebar">
                <aside className="admin-sidebar panel">
                    <p className="admin-sidebar-title">後台管理</p>
                    <Link to="/admin-products">商品系列管理</Link>
                    <Link to="/admin-products/variants">手機品項／SKU</Link>
                    <Link className="is-active" to="/admin/samples">圖片樣本庫</Link>
                </aside>

                <section className="sample-admin-content">
                    <p className="sample-page-intro">先將圖片上傳到 Cloudinary，再貼上圖片網址加入樣本庫；本系統只儲存網址。</p>

                    <form className="sample-form" onSubmit={createSample}>
                <label>Cloudinary 圖片網址<input name="imageUrl" type="url" value={form.imageUrl} onChange={updateForm} placeholder="https://res.cloudinary.com/你的雲端名稱/image/upload/圖片.jpg" required maxLength={500}/></label>
                <input name="source" value={form.source} onChange={updateForm} placeholder="圖片來源"/>
                <input name="licenseType" value={form.licenseType} onChange={updateForm} placeholder="授權類型"/>
                <input name="productId" value={form.productId} onChange={updateForm} placeholder="關聯商品 ID" type="number"/>
                <textarea name="licenseNote" value={form.licenseNote} onChange={updateForm} placeholder="授權備註"/>
                <textarea name="aiDescription" value={form.aiDescription} onChange={updateForm} placeholder="AI 圖片描述（之後可自動產生）"/>
                <button type="submit" disabled={saving}>{saving ? '儲存中…' : '快速新增樣本'}</button>
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
                                {editingDescriptionId === sample.id ? (
                                    <div className="sample-description-editor">
                                        <textarea value={descriptionDraft}
                                                  onChange={event => setDescriptionDraft(event.target.value)}
                                                  rows="5"
                                                  placeholder="修正品牌、型號、顏色、風格與鏡頭特徵"/>
                                        <button onClick={() => saveDescription(sample.id)}
                                                disabled={!descriptionDraft.trim()}>儲存修正</button>
                                        <button onClick={() => {
                                            setEditingDescriptionId(null);
                                            setDescriptionDraft('');
                                        }}>取消</button>
                                    </div>
                                ) : (
                                    <p><strong>AI 辨識與圖片描述：</strong>{sample.aiDescription || '尚未建立 AI 描述'}</p>
                                )}
                                {(sample.aiMatchStatus || sample.variantId) && (
                                    <p>
                                        <strong>商品比對：</strong>
                                        {sample.variantId ? '人工已確認' : sample.aiMatchStatus}
                                        {!sample.variantId && sample.aiMatchConfidence != null &&
                                            `（${sample.aiMatchConfidence}%）`}
                                    </p>
                                )}
                                {sample.aiMatchReason && <p>{sample.aiMatchReason}</p>}
                                {sample.variantId && <p className="sample-confirmed-link">
                                    已精確關聯手機品項：#{sample.variantId}
                                </p>}
                                {!sample.variantId && candidates[sample.id]?.length > 0 && (
                                    <div className="sample-candidates">
                                        <p>請選擇候選商品：</p>
                                        {candidates[sample.id].map(candidate => (
                                            <div className="sample-candidate" key={candidate.variantId}>
                                                {candidate.imageUrl && <img src={candidate.imageUrl}
                                                                            alt="候選商品圖片"/>}
                                                <div>
                                                    <strong>{candidate.productName}</strong>
                                                    <p>{candidate.brand} {candidate.model}</p>
                                                    <p>{candidate.color || '顏色未確認'} · SKU：{candidate.sku || '未提供'}</p>
                                                </div>
                                                <button onClick={() => confirmProduct(
                                                    sample.id, candidate.productId, candidate.variantId)}>
                                                    確認此品項
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {editingDescriptionId !== sample.id && <button
                                    onClick={() => startDescriptionEdit(sample)}>
                                    修正 AI 分析
                                </button>}
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
                </section>
            </div>
        </main>
    );
}
