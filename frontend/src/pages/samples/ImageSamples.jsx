import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {adminFetch} from '../admin/adminFetch.js';

const emptyForm = {
    imageUrl: '',
    source: 'Cloudinary',
    licenseType: '',
    licenseNote: '',
    aiDescription: '',
    productId: '',
};

function skuPart(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '')
        .toUpperCase();
}

function colorSkuPart(value) {
    const color = String(value || '').trim().toLowerCase();
    const colors = {
        '黑色': 'BLK', '黑': 'BLK', '白色': 'WHT', '白': 'WHT',
        '透明': 'CLR', '透明色': 'CLR', '藍色': 'BLU', '海軍藍': 'NVY',
        '粉色': 'PNK', '櫻花粉': 'PNK', '紅色': 'RED', '綠色': 'GRN',
        '紫色': 'PUR', '灰色': 'GRY', '酷黑灰': 'GRY', '霧透藍': 'BLU',
    };
    return colors[color] || skuPart(value) || 'COLOR';
}

function modelSkuPart(value) {
    const model = String(value || '').trim();
    const iphone = model.match(/iphone\s*(\d+)\s*(pro\s*max|pro|max|plus|air)?/i);
    if (iphone) {
        const suffix = (iphone[2] || '').replace(/\s+/g, '').toUpperCase();
        return `IP${iphone[1]}${suffix === 'PRO' ? 'P' : suffix === 'PROMAX' ? 'PM' : suffix}`;
    }
    const galaxy = model.match(/galaxy\s*(s|z|a)\s*(\d+)(\s*(ultra|plus|fe))?/i);
    if (galaxy) {
        const suffix = (galaxy[4] || '').replace(/\s+/g, '').toUpperCase();
        return `G${galaxy[1].toUpperCase()}${galaxy[2]}${suffix === 'ULTRA' ? 'U' : suffix === 'PLUS' ? 'P' : suffix}`;
    }
    return skuPart(model) || 'MODEL';
}

function familySkuPart(value) {
    const family = String(value || '').trim().toLowerCase();
    if (/solidx|solidsuit/.test(family)) return 'SOLID';
    if (/clearx/.test(family)) return 'CLEARX';
    return skuPart(value) || 'CASE';
}

function makeSku(productName, brand, model, color) {
    const family = familySkuPart(productName);
    const brandPart = skuPart(brand) || 'BRAND';
    const modelPart = modelSkuPart(model);
    const colorPart = colorSkuPart(color);
    return `${family}-${brandPart}-${modelPart}-${colorPart}`;
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
    const [corrections, setCorrections] = useState({});
    const [message, setMessage] = useState('');
    const [products, setProducts] = useState([]);
    const [creatingSkuId, setCreatingSkuId] = useState(null);
    const [skuDrafts, setSkuDrafts] = useState({});

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
                headers: {'Content-Type': 'application/json'},
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
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({reviewStatus, reviewerNote: ''}),
        });
        if (response.ok) {
            await loadSamples();
            setMessage(reviewStatus === '通過'
                ? '樣本已通過，圖片已加入關聯 SKU；若品項原本沒有主圖，這張圖會成為主圖。'
                : '樣本已退回');
        } else {
            const error = await response.json().catch(() => ({}));
            setMessage(error.message || '更新審核狀態失敗');
        }
    }

    async function setSampleAsPrimaryImage(sample) {
        if (!sample.variantId) return;
        try {
            const productsResponse = await adminFetch('/api/products');
            if (!productsResponse.ok) throw new Error('無法讀取商品圖片資料');
            const productList = await productsResponse.json();
            const variant = productList.flatMap(product => product.variants || [])
                .find(item => String(item.id) === String(sample.variantId));
            if (!variant) throw new Error('找不到樣本關聯的手機品項');

            const images = variant.images || [];
            const existingImage = images.find(image => image.imageUrl === sample.imageUrl);
            if (existingImage?.isPrimary) {
                setMessage('這張樣本圖片已經是商品主圖。');
                return;
            }

            const imagePayload = {
                imageUrl: sample.imageUrl,
                sortOrder: Math.max(1, Number(existingImage?.sortOrder) || images.length + 1),
                isPrimary: true,
            };
            const imageResponse = await adminFetch(existingImage
                ? `/api/variants/${sample.variantId}/images/${existingImage.id}`
                : `/api/variants/${sample.variantId}/images`, {
                method: existingImage ? 'PUT' : 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(imagePayload),
            });
            if (!imageResponse.ok) {
                const error = await imageResponse.json().catch(() => ({}));
                throw new Error(error.message || '設定商品主圖失敗');
            }
            setMessage('已將樣本圖片設為商品主圖；原主圖仍保留在圖片清單中。');
        } catch (error) {
            setMessage(error.message || '設定商品主圖失敗');
        }
    }

    async function deleteSample(id) {
        if (!window.confirm('確定要刪除這筆圖片樣本嗎？')) return;
        const response = await adminFetch(`/api/image-samples/${id}`, {method: 'DELETE'});
        if (response.ok) await loadSamples();
        else setMessage('刪除樣本失敗');
    }

    async function analyzeSample(id) {
        setAnalyzingId(id);
        setCandidates(current => ({...current, [id]: []}));
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

    function updateCorrection(sampleId, field, value) {
        // 欄位一修改就移除舊候選，避免誤把前一次 AI 結果當成修正後結果。
        setCandidates(current => ({...current, [sampleId]: []}));
        setCorrections(current => ({
            ...current,
            [sampleId]: {...current[sampleId], [field]: value},
        }));
    }

    function detectedValue(sample, field) {
        const text = sample.aiDescription || '';
        const labels = {
            brand: '品牌',
            model: '型號',
            color: '顏色',
            styleTag: '風格',
        };
        const label = labels[field];
        const match = text.match(new RegExp(`${label}\\s*[=:：]\\s*([^、，。\\n]+)`));
        const value = match?.[1]?.trim();
        return value && value !== '未確認' ? value : '';
    }

    function correctionValue(sample, field) {
        const value = corrections[sample.id]?.[field];
        return value !== undefined ? value : detectedValue(sample, field);
    }

    async function searchCorrectedCandidates(sampleId) {
        setAnalyzingId(sampleId);
        setCandidates(current => ({...current, [sampleId]: []}));
        setMessage('依人工修正條件重新搜尋候選…');
        try {
            const response = await adminFetch(`/api/image-samples/${sampleId}/candidates`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    brand: correctionValue(samples.find(sample => sample.id === sampleId), 'brand'),
                    model: correctionValue(samples.find(sample => sample.id === sampleId), 'model'),
                    color: correctionValue(samples.find(sample => sample.id === sampleId), 'color'),
                    styleTag: correctionValue(samples.find(sample => sample.id === sampleId), 'styleTag'),
                }),
            });
            const result = await response.json().catch(() => []);
            if (!response.ok) throw new Error(result.message || '候選搜尋失敗');
            setCandidates(current => ({...current, [sampleId]: result}));
            await loadSamples();
            setMessage(result.length
                ? '候選已依人工修正條件更新，請確認正確品項。'
                : '沒有符合候選；請調整條件或保留待審核。');
        } catch (error) {
            setMessage(error.message);
        } finally {
            setAnalyzingId(null);
        }
    }

    async function confirmProduct(sampleId, productId, variantId) {
        const response = await adminFetch(`/api/image-samples/${sampleId}/product`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({productId, variantId}),
        });
        if (response.ok) {
            setMessage('商品關聯已確認');
            await loadSamples();
        } else {
            setMessage('商品關聯確認失敗');
        }
    }

    async function openSkuForm(sample) {
        try {
            const response = await adminFetch('/api/products');
            if (!response.ok) throw new Error('無法讀取商品系列');
            const productList = await response.json();
            setProducts(productList);
            setCreatingSkuId(sample.id);
            const correction = corrections[sample.id] || {};
            setSkuDrafts(current => {
                const previous = current[sample.id] || {};
                const draft = {
                    ...previous,
                    productId: previous.productId || '',
                    brand: correctionValue(sample, 'brand') || correction.brand || '',
                    model: correctionValue(sample, 'model') || correction.model || '',
                    color: correctionValue(sample, 'color') || correction.color || '',
                    price: previous.price || '',
                    tags: correctionValue(sample, 'styleTag') || correction.styleTag || '',
                };
                if (!previous.skuEdited) {
                    const family = responseProductName(productList, draft.productId);
                    draft.sku = makeSku(family, draft.brand, draft.model, draft.color);
                }
                return {...current, [sample.id]: draft};
            });
        } catch (error) { setMessage(error.message); }
    }

    function responseProductName(productList, productId) {
        return productList.find(product => String(product.id) === String(productId))?.name || '';
    }

    function updateSkuDraft(sampleId, field, value) {
        setSkuDrafts(current => {
            const draft = {...current[sampleId], [field]: value};
            if (field === 'sku') {
                draft.skuEdited = true;
            } else if (['productId', 'brand', 'model', 'color'].includes(field) && !draft.skuEdited) {
                const productName = responseProductName(products, draft.productId);
                draft.sku = makeSku(productName, draft.brand, draft.model, draft.color);
            }
            return {...current, [sampleId]: draft};
        });
    }

    function regenerateSku(sampleId) {
        setSkuDrafts(current => {
            const draft = {...current[sampleId], skuEdited: false};
            draft.sku = makeSku(responseProductName(products, draft.productId), draft.brand, draft.model, draft.color);
            return {...current, [sampleId]: draft};
        });
    }

    async function createSkuFromSample(sample) {
        const draft = skuDrafts[sample.id];
        if (!draft?.productId || !draft.brand?.trim() || !draft.model?.trim()
            || !draft.color?.trim() || !draft.price || !draft.sku?.trim()) {
            setMessage('請選商品系列並填妥品牌、型號、顏色、價格與 SKU。');
            return;
        }
        try {
            const response = await adminFetch(`/api/products/${draft.productId}/variants`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    brand: draft.brand.trim(), model: draft.model.trim(), color: draft.color.trim(),
                    price: Number(draft.price), stock: 0, sku: draft.sku.trim(), status: '上架',
                    tags: draft.tags || '',
                }),
            });
            const variant = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(variant.message || '新增 SKU 失敗');
            await confirmProduct(sample.id, Number(draft.productId), variant.id);
            setCreatingSkuId(null);
            setMessage(`SKU ${variant.sku} 已建立並關聯到樣本；庫存預設為 0，請由庫存管理設定。`);
            await loadSamples();
        } catch (error) { setMessage(error.message); }
    }

    function startDescriptionEdit(sample) {
        setEditingDescriptionId(sample.id);
        setDescriptionDraft(sample.aiDescription || '');
    }

    async function saveDescription(id) {
        const response = await adminFetch(`/api/image-samples/${id}/description`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
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
                                {!sample.variantId && <div className="sample-correction-fields">
                                    <strong>人工修正後重新找候選</strong>
                                    <input aria-label="修正品牌" value={correctionValue(sample, 'brand')}
                                           onChange={event => updateCorrection(sample.id, 'brand', event.target.value)}
                                           placeholder="品牌，例如 Samsung" />
                                    <input aria-label="修正型號" value={correctionValue(sample, 'model')}
                                           onChange={event => updateCorrection(sample.id, 'model', event.target.value)}
                                           placeholder="型號，例如 Galaxy S26；不確定可留白" />
                                    <input aria-label="修正顏色" value={correctionValue(sample, 'color')}
                                           onChange={event => updateCorrection(sample.id, 'color', event.target.value)}
                                           placeholder="顏色，例如黑色" />
                                    <input aria-label="修正風格" value={correctionValue(sample, 'styleTag')}
                                           onChange={event => updateCorrection(sample.id, 'styleTag', event.target.value)}
                                           placeholder="風格標籤（選填）" />
                                    <button type="button" onClick={() => searchCorrectedCandidates(sample.id)}
                                            disabled={analyzingId === sample.id || !correctionValue(sample, 'brand').trim()}>
                                        依修正條件搜尋候選
                                    </button>
                                </div>}
                                {sample.variantId && <p className="sample-confirmed-link">
                                    已精確關聯手機品項：#{sample.variantId}
                                </p>}
                                {sample.reviewStatus === '通過' && sample.variantId && <button
                                    type="button"
                                    onClick={() => setSampleAsPrimaryImage(sample)}
                                >設為商品主圖</button>}
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
                                {!sample.variantId && <button type="button" onClick={() => openSkuForm(sample)}>
                                    建立新 SKU 並關聯
                                </button>}
                                {creatingSkuId === sample.id && <section className="sample-sku-create">
                                    <div className="sample-sku-heading">
                                        <div><span>建立商品品項</span><h3>建立新 SKU 並關聯</h3></div>
                                        <span className="sample-sku-step">審核資料帶入</span>
                                    </div>
                                    <p className="sample-sku-help">系統會依商品系列、品牌、型號與顏色產生 SKU；確認資料後仍可自行修改。</p>
                                    <div className="sample-sku-fields">
                                        <label className="sample-sku-field sample-sku-field-wide">商品系列
                                            <select value={skuDrafts[sample.id]?.productId || ''}
                                                    onChange={event => updateSkuDraft(sample.id, 'productId', event.target.value)}>
                                                <option value="">選擇商品系列</option>
                                                {products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
                                            </select>
                                        </label>
                                        <label className="sample-sku-field">手機品牌
                                            <input value={skuDrafts[sample.id]?.brand || ''} onChange={event => updateSkuDraft(sample.id, 'brand', event.target.value)} placeholder="例如 Samsung" />
                                        </label>
                                        <label className="sample-sku-field">手機型號
                                            <input value={skuDrafts[sample.id]?.model || ''} onChange={event => updateSkuDraft(sample.id, 'model', event.target.value)} placeholder="例如 Galaxy S26" />
                                        </label>
                                        <label className="sample-sku-field">手機殼顏色
                                            <input value={skuDrafts[sample.id]?.color || ''} onChange={event => updateSkuDraft(sample.id, 'color', event.target.value)} placeholder="例如 黑色" />
                                        </label>
                                        <label className="sample-sku-field">售價
                                            <div className="sample-sku-price"><span>NT$</span><input type="number" min="0" step="1" value={skuDrafts[sample.id]?.price || ''} onChange={event => updateSkuDraft(sample.id, 'price', event.target.value)} placeholder="輸入售價" /></div>
                                        </label>
                                        <label className="sample-sku-field sample-sku-field-wide">SKU 編號
                                            <div className="sample-sku-code-row">
                                                <input value={skuDrafts[sample.id]?.sku || ''} onChange={event => updateSkuDraft(sample.id, 'sku', event.target.value)} placeholder="依上方資料自動產生" />
                                                <button type="button" className="sample-sku-regenerate" onClick={() => regenerateSku(sample.id)}>重新產生</button>
                                            </div>
                                        </label>
                                    </div>
                                    <div className="sample-sku-actions">
                                        <button type="button" onClick={() => createSkuFromSample(sample)}>建立並關聯</button>
                                        <button type="button" className="sample-sku-cancel" onClick={() => setCreatingSkuId(null)}>取消</button>
                                        <span>庫存由庫存管理設定</span>
                                    </div>
                                </section>}
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
                                {!sample.variantId && <p className="sample-review-hint">請先確認正確的手機品項，才能通過審核。</p>}
                                <button
                                    onClick={() => reviewSample(sample.id, '通過')}
                                    disabled={!sample.variantId || sample.reviewStatus === '通過'}
                                >通過</button>
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
