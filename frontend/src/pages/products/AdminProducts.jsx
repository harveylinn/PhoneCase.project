import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';

async function request(url, options = {}) {
    const response = await fetch(url, {headers: {'Content-Type': 'application/json'}, ...options});
    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || Object.values(body ?? {})[0] || '操作失敗');
    }
    return response.status === 204 ? null : response.json();
}

const emptyProduct = {
    name: '',
    category: '手機殼',
    description: '',
    status: '上架',
    sampleImageUrl: ''
};

const emptyVariant = {
    brand: '',
    model: '',
    color: '',
    price: '',
    sku: '',
    status: '上架',
    tags: '',
    imageUrl: ''
};

const stylePreviewImages = [
    {names: ['solidx', 'solidsuit'], url: 'https://res.cloudinary.com/gpjb7mz7/image/upload/v1793135679/Solidx.webp'},
    {names: ['clearx'], url: 'https://res.cloudinary.com/gpjb7mz7/image/upload/v1793135689/Clearx.webp'},
    {names: ['modnx'], url: 'https://res.cloudinary.com/gpjb7mz7/image/upload/v1793135690/Modnx.webp'},
    {names: ['airx'], url: 'https://res.cloudinary.com/gpjb7mz7/image/upload/v1793135674/Airx.webp'},
    {names: ['bumper'], url: 'https://res.cloudinary.com/gpjb7mz7/image/upload/v1793135691/Bumper.webp'},
    {names: ['clear'], url: 'https://res.cloudinary.com/gpjb7mz7/image/upload/v1793135690/Clear.webp'}
];

function getStylePreviewUrl(name) {
    const normalized = (name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return stylePreviewImages.find(item => item.names.some(alias => normalized.includes(alias)))?.url ?? '';
}

// embedded：嵌入後台版面（/admin/products）時不顯示本頁的側邊選單，由後台側邊欄導覽
export default function AdminProducts({embedded = false}) {
    const [products, setProducts] = useState([]);
    const [selected, setSelected] = useState(null);
    const [productForm, setProductForm] = useState(emptyProduct);
    const [variantForm, setVariantForm] = useState(emptyVariant);
    const [editingVariantId, setEditingVariantId] = useState(null);
    const [previewImageUrl, setPreviewImageUrl] = useState('');
    const [keyword, setKeyword] = useState('');
    const [status, setStatus] = useState('all');
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const stylePreviewUrl = getStylePreviewUrl(productForm.name);

    async function loadProducts() {
        setLoading(true);
        try {
            setProducts(await request('/api/products'));
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadProducts();
    }, []);

    const filtered = useMemo(() => products.filter(product => {
        const matchesKeyword = !keyword || `${product.name} ${product.category}`.toLowerCase().includes(keyword.toLowerCase());
        const matchesStatus = status === 'all' || (status === 'available' && product.status === '上架') || (status === 'inactive' && product.status === '下架');
        return matchesKeyword && matchesStatus;
    }), [products, keyword, status]);

    function showNotice(message) {
        setNotice(message);
        window.setTimeout(() => setNotice(''), 3500);
    }

    function selectProduct(product) {
        setSelected(product);
        setProductForm({
            name: product.name ?? '',
            category: product.category ?? '',
            description: product.description ?? '',
            status: product.status ?? '上架',
            sampleImageUrl: ''
        });
        resetVariant();
    }

    function resetVariant() {
        setEditingVariantId(null);
        setVariantForm(emptyVariant);
        setPreviewImageUrl('');
    }

    function updateProductField(event) {
        setProductForm({...productForm, [event.target.name]: event.target.value});
    }

    function updateVariantField(event) {
        setVariantForm({...variantForm, [event.target.name]: event.target.value});
    }

    async function saveProduct(event) {
        event.preventDefault();
        const {sampleImageUrl, ...productPayload} = productForm;
        const resolvedSampleImageUrl = sampleImageUrl?.trim() || getStylePreviewUrl(productForm.name);
        try {
            const saved = await request(selected ? `/api/products/${selected.id}` : '/api/products', {
                method: selected ? 'PUT' : 'POST',
                body: JSON.stringify(productPayload)
            });
            if (!selected && resolvedSampleImageUrl) {
                await request('/api/image-samples', {
                    method: 'POST',
                    body: JSON.stringify({
                        imageUrl: resolvedSampleImageUrl,
                        source: 'Cloudinary',
                        licenseType: '待確認',
                        productId: saved.id
                    })
                });
            }
            showNotice('商品系列已儲存');
            await loadProducts();
            const refreshed = selected ? saved : saved;
            selectProduct(refreshed);
        } catch (err) {
            setError(err.message);
        }
    }

    async function toggleStatus(product) {
        const next = product.status === '上架' ? '下架' : '上架';
        try {
            await request(`/api/products/${product.id}/status?status=${encodeURIComponent(next)}`, {method: 'PATCH'});
            showNotice(`商品已${next}`);
            await loadProducts();
        } catch (err) {
            setError(err.message);
        }
    }

    async function deleteProduct(product) {
        if (!window.confirm(`確定刪除「${product.name}」以及底下所有規格嗎？`)) return;
        try {
            await request(`/api/products/${product.id}`, {method: 'DELETE'});
            showNotice('商品已刪除');
            setSelected(null);
            await loadProducts();
        } catch (err) {
            setError(err.message);
        }
    }

    async function saveVariant(event) {
        event.preventDefault();
        if (!selected) return;
        const payload = {
            brand: variantForm.brand,
            model: variantForm.model,
            color: variantForm.color,
            price: Number(variantForm.price),
            sku: variantForm.sku,
            status: variantForm.status,
            tags: variantForm.tags
        };
        try {
            const saved = await request(editingVariantId ? `/api/products/${selected.id}/variants/${editingVariantId}` : `/api/products/${selected.id}/variants`, {
                method: editingVariantId ? 'PUT' : 'POST',
                body: JSON.stringify(payload)
            });
            if (variantForm.imageUrl) {
                const old = selected.variants?.find(item => item.id === editingVariantId);
                const oldImage = old?.images?.find(item => item.isPrimary) ?? old?.images?.[0];
                const imagePayload = {imageUrl: variantForm.imageUrl, sortOrder: 1, isPrimary: true};
                await request(oldImage ? `/api/variants/${saved.id}/images/${oldImage.id}` : `/api/variants/${saved.id}/images`, {
                    method: oldImage ? 'PUT' : 'POST',
                    body: JSON.stringify(imagePayload)
                });
            }
            showNotice('商品規格已儲存');
            const refreshed = await request(`/api/products/${selected.id}`);
            setProducts(items => items.map(item => item.id === refreshed.id ? refreshed : item));
            selectProduct(refreshed);
        } catch (err) {
            setError(err.message);
        }
    }

    async function deleteVariant(variant) {
        if (!selected || !window.confirm(`確定刪除 ${variant.brand} ${variant.model} 嗎？`)) return;
        try {
            await request(`/api/products/${selected.id}/variants/${variant.id}`, {method: 'DELETE'});
            showNotice('規格已刪除');
            const refreshed = await request(`/api/products/${selected.id}`);
            setProducts(items => items.map(item => item.id === refreshed.id ? refreshed : item));
            selectProduct(refreshed);
        } catch (err) {
            setError(err.message);
        }
    }

    function editVariant(variant) {
        const image = variant.images?.find(item => item.isPrimary) ?? variant.images?.[0];
        setEditingVariantId(variant.id);
        setVariantForm({
            brand: variant.brand ?? '',
            model: variant.model ?? '',
            color: variant.color ?? '',
            price: variant.price ?? '',
            sku: variant.sku ?? '',
            status: variant.status ?? '上架',
            tags: variant.tags ?? '',
            imageUrl: image?.imageUrl ?? ''
        });
        setPreviewImageUrl('');
    }

    return (
        <main className="admin-page page-shell">
            <div className="admin-heading">
                <div><p className="eyebrow">CASELAB ADMIN · REACT</p><h1>商品管理</h1><p
                    className="muted">管理商品系列、手機規格與圖片</p></div>
                <button className="button button-primary" onClick={() => {
                    setSelected(null);
                    setProductForm(emptyProduct);
                    resetVariant();
                }}>＋ 新增商品
                </button>
            </div>
            {notice && <div className="admin-notice">{notice}</div>}{error && <div className="admin-error">{error}
            <button onClick={() => setError('')}>關閉</button>
        </div>}
            <div className={embedded ? '' : 'admin-with-sidebar'}>
                {!embedded && <aside className="admin-sidebar panel">
                    <p className="admin-sidebar-title">後台管理</p>
                    <Link className="is-active" to="/admin-products">商品系列管理</Link>
                    <Link to="/admin-products/variants">手機品項／SKU</Link>
                    <Link to="/admin/samples">圖片樣本庫</Link>
                </aside>}
                <section className="admin-layout">
                <aside className="admin-list panel">
                    <div className="admin-list-tools"><input placeholder="搜尋商品" value={keyword}
                                                             onChange={event => setKeyword(event.target.value)}/><select
                        value={status} onChange={event => setStatus(event.target.value)}>
                        <option value="all">全部狀態</option>
                        <option value="available">上架中</option>
                        <option value="inactive">已下架</option>
                    </select></div>
                    {loading ? <p className="muted">正在載入…</p> : filtered.map(product => <button key={product.id}
                                                                                                    className={`admin-list-item ${selected?.id === product.id ? 'is-selected' : ''}`}
                                                                                                    onClick={() => selectProduct(product)}>
                        <strong>{product.name}</strong><span>{product.variants?.length ?? 0} 筆規格 · {product.status}</span>
                    </button>)}</aside>
                <section className="admin-editor panel">
                    <div className="product-editor-heading">
                        <h2>{selected ? `編輯：${selected.name}` : '新增商品系列'}</h2>
                        {stylePreviewUrl && <button className="button button-outline" type="button"
                                                    onClick={() => setPreviewImageUrl(stylePreviewUrl)}>
                            預覽款式圖片
                        </button>}
                    </div>
                    <form onSubmit={saveProduct} className="admin-form"><label>商品名稱<input name="name"
                                                                                              value={productForm.name}
                                                                                              onChange={updateProductField}
                                                                                              required/></label><label>分類<input
                        name="category" value={productForm.category} onChange={updateProductField}
                        required/></label><label>狀態<select name="status" value={productForm.status}
                                                             onChange={updateProductField}>
                        <option value="上架">上架</option>
                        <option value="下架">下架</option>
                    </select></label><label className="wide">商品描述<textarea name="description"
                                                                               value={productForm.description}
                                                                               onChange={updateProductField} rows="3"/></label>
                        {!selected && <label className="wide">AI 範例圖 Cloudinary URL
                            <div className="image-url-field">
                                <input name="sampleImageUrl" value={productForm.sampleImageUrl || stylePreviewUrl}
                                       onChange={updateProductField}
                                       placeholder="貼上此款式的 Cloudinary 圖片 URL"/>
                                {getStylePreviewUrl(productForm.name) && <button className="button button-outline"
                                                                                  type="button"
                                                                                  onClick={() => setPreviewImageUrl(getStylePreviewUrl(productForm.name))}>
                                    預覽固定款式圖
                                </button>}
                            </div>
                            <span className="form-help">儲存商品後會自動加入圖片樣本庫，狀態為待審核。</span>
                        </label>}
                        <button className="button button-primary" type="submit">儲存商品系列</button>
                    </form>
                    {selected && <>
                        <div className="variant-heading"><h2>商品規格</h2>
                            <button className="button button-outline" onClick={resetVariant}>＋ 新增規格</button>
                        </div>
                        <div className="variant-table-wrap">
                            <table className="variant-table">
                                <thead>
                                <tr>
                                    <th>品牌／型號</th>
                                    <th>顏色</th>
                                    <th>價格</th>
                                    <th>庫存</th>
                                    <th>SKU</th>
                                    <th>操作</th>
                                </tr>
                                </thead>
                                <tbody>{(selected.variants ?? []).map(variant => <tr key={variant.id}>
                                    <td><strong>{variant.brand}</strong><br/>{variant.model}</td>
                                    <td>{variant.color}</td>
                                    <td>NT$ {Number(variant.price).toLocaleString()}</td>
                                    <td>{variant.stock}</td>
                                    <td>{variant.sku}</td>
                                    <td>
                                        <button className="link-button" onClick={() => editVariant(variant)}>編輯
                                        </button>
                                        <button className="danger-link" onClick={() => deleteVariant(variant)}>刪除
                                        </button>
                                    </td>
                                </tr>)}</tbody>
                            </table>
                        </div>
                        <form onSubmit={saveVariant} className="admin-form variant-form">
                            <h3>{editingVariantId ? '編輯規格' : '新增規格'}</h3><label>品牌<input name="brand"
                                                                                                   value={variantForm.brand}
                                                                                                   onChange={updateVariantField}
                                                                                                   required/></label><label>手機型號<input
                            name="model" value={variantForm.model} onChange={updateVariantField}
                            required/></label><label>顏色<input name="color" value={variantForm.color}
                                                                onChange={updateVariantField} required/></label><label>價格<input
                            name="price" type="number" min="0" value={variantForm.price} onChange={updateVariantField}
                            required/></label>
                            <label>SKU<input name="sku" value={variantForm.sku} onChange={updateVariantField} required/>
                            </label>
                            <label className="wide">商品標籤
                                <input
                                    name="tags"
                                    value={variantForm.tags}
                                    onChange={updateVariantField}
                                    placeholder="例如：可愛風,卡通,粉色"
                                />
                            </label>
                            <label>狀態<select
                                name="status" value={variantForm.status} onChange={updateVariantField}>
                                <option value="上架">上架</option>
                                <option value="下架">下架</option>
                            </select></label><label className="wide">圖片路徑
                                <div className="image-url-field">
                                    <input name="imageUrl"
                                           value={variantForm.imageUrl}
                                           onChange={updateVariantField}
                                           placeholder="貼上 Cloudinary 圖片 URL"/>
                                    <button className="button button-outline" type="button"
                                            disabled={!variantForm.imageUrl.trim()}
                                            onClick={() => setPreviewImageUrl(variantForm.imageUrl.trim())}>
                                        預覽圖片
                                    </button>
                                </div>
                            </label>
                            <button className="button button-primary" type="submit">儲存規格</button>
                        </form>
                        <button className="danger-button" onClick={() => deleteProduct(selected)}>刪除商品系列</button>
                    </>}
                </section>
                </section>
            </div>
            {previewImageUrl && <div className="image-preview-backdrop" role="presentation"
                                     onMouseDown={event => event.target === event.currentTarget && setPreviewImageUrl('')}>
                <div className="image-preview-modal" role="dialog" aria-modal="true" aria-label="圖片預覽">
                    <div className="image-preview-heading">
                        <h2>手機殼圖片預覽</h2>
                        <button className="image-preview-close" type="button"
                                onClick={() => setPreviewImageUrl('')} aria-label="關閉預覽">×</button>
                    </div>
                    <div className="image-preview-content">
                        <img src={previewImageUrl} alt="手機殼預覽" onError={event => {
                            event.currentTarget.style.display = 'none';
                        }}/>
                        <p className="muted">如果圖片沒有顯示，請確認 Cloudinary URL 可以公開存取。</p>
                    </div>
                </div>
            </div>}
        </main>
    );
}
