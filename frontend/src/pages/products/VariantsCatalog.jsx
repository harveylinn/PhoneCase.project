import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {getProducts} from '../../services/productApi.js';
import {styleLabel} from '../../components/ProductCard.jsx';

export default function VariantsCatalog() {
    const [products, setProducts] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [brand, setBrand] = useState('');
    const [status, setStatus] = useState('');
    const [sort, setSort] = useState('model');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const emptyVariant = {productId: '', brand: '', model: '', color: '', price: '', sku: '', status: '上架', tags: ''};
    const [form, setForm] = useState(emptyVariant);
    const [page, setPage] = useState(1);
    const pageSize = 20;

    useEffect(() => {
        getProducts()
            .then(setProducts)
            .catch(err => setError(err.message || '無法讀取手機品項'))
            .finally(() => setLoading(false));
    }, []);

    const rows = useMemo(() => products.flatMap(product =>
        (product.variants ?? []).map(variant => ({product, variant}))
    ), [products]);

    const brands = useMemo(() => [...new Set(rows.map(({variant}) => variant.brand).filter(Boolean))].sort(), [rows]);

    const filteredRows = useMemo(() => {
        const search = keyword.trim().toLowerCase();
        return rows
            .filter(({product, variant}) => {
                const text = `${product.name} ${variant.brand} ${variant.model} ${variant.color} ${variant.sku} ${variant.tags ?? ''}`.toLowerCase();
                return (!search || text.includes(search)) && (!brand || variant.brand === brand) && (!status || variant.status === status);
            })
            .sort((a, b) => {
                if (sort === 'price') return Number(a.variant.price) - Number(b.variant.price);
                if (sort === 'stock') return Number(a.variant.stock) - Number(b.variant.stock);
                return `${a.variant.brand} ${a.variant.model}`.localeCompare(`${b.variant.brand} ${b.variant.model}`);
            });
    }, [rows, keyword, brand, status, sort]);

    const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    const visibleRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

    useEffect(() => {
        setPage(1);
    }, [keyword, brand, status, sort]);

    function clearFilters() {
        setKeyword('');
        setBrand('');
        setStatus('');
        setPage(1);
    }

    function openCreate() {
        setEditing({id: null});
        setForm({...emptyVariant, productId: products[0]?.id ?? ''});
        setError('');
    }

    function openEdit(row) {
        const {product, variant} = row;
        setEditing({id: variant.id, productId: product.id});
        setForm({productId: product.id, brand: variant.brand ?? '', model: variant.model ?? '', color: variant.color ?? '', price: variant.price ?? '', sku: variant.sku ?? '', status: variant.status ?? '上架', tags: variant.tags ?? ''});
        setError('');
    }

    function updateForm(event) {
        setForm(current => ({...current, [event.target.name]: event.target.value}));
    }

    async function saveVariant(event) {
        event.preventDefault();
        if (!form.productId) return setError('請先選擇商品系列');
        setSaving(true);
        try {
            const {productId: _productId, ...variantFields} = form;
            // 庫存由庫存後台管理，商品品項頁不送出 stock，避免覆蓋庫存資料。
            const payload = {...variantFields, price: Number(form.price)};
            const url = editing?.id
                ? `/api/products/${editing.productId}/variants/${editing.id}`
                : `/api/products/${form.productId}/variants`;
            const response = await fetch(url, {method: editing?.id ? 'PUT' : 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)});
            if (!response.ok) throw new Error('品項儲存失敗');
            const refreshed = await getProducts();
            setProducts(refreshed);
            setEditing(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function disableVariant(row) {
        if (!window.confirm(`確定要將「${row.variant.brand} ${row.variant.model}」下架嗎？`)) return;
        const response = await fetch(`/api/products/${row.product.id}/variants/${row.variant.id}/status?status=下架`, {method: 'PATCH'});
        if (!response.ok) return setError('品項下架失敗');
        setProducts(await getProducts());
    }

    return (
        <main className="admin-page page-shell variants-catalog-page">
            <div className="admin-heading">
                <div>
                    <p className="eyebrow">CASELAB ADMIN · CATALOG</p>
                    <h1>手機品項總表</h1>
                    <p className="muted">一次檢索所有手機型號、顏色、庫存與 SKU。</p>
                </div>
                <button className="button button-primary" type="button" onClick={openCreate}>＋ 新增手機品項</button>
            </div>

            <div className="admin-with-sidebar">
                <aside className="admin-sidebar panel">
                    <p className="admin-sidebar-title">後台管理</p>
                    <Link to="/admin-products">商品系列管理</Link>
                    <Link className="is-active" to="/admin-products/variants">手機品項／SKU</Link>
                    <Link to="/admin/samples">圖片樣本庫</Link>
                </aside>

                <section className="variants-content">
                    <div className="variant-toolbar panel">
                        <div className="variant-search-group">
                            <label>搜尋品項<input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="型號、顏色、SKU、標籤" /></label>
                            <label>品牌<select value={brand} onChange={event => setBrand(event.target.value)}><option value="">全部品牌</option>{brands.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
                            <label>狀態<select value={status} onChange={event => setStatus(event.target.value)}><option value="">全部狀態</option><option value="上架">上架</option><option value="下架">下架</option></select></label>
                            <label>排序<select value={sort} onChange={event => setSort(event.target.value)}><option value="model">品牌／型號</option><option value="price">價格低到高</option><option value="stock">庫存低到高</option></select></label>
                        </div>
                        <button className="text-button" type="button" onClick={clearFilters}>清除條件</button>
                    </div>

                    <div className="variants-summary"><strong>{filteredRows.length}</strong> 個品項符合條件</div>

                    {loading && <div className="state-card panel">正在載入手機品項…</div>}
                    {error && <div className="admin-error">{error}</div>}
                    {!loading && !error && <div className="variants-table-wrap panel">
                        <table className="variants-catalog-table">
                        <thead><tr><th>品項</th><th>品牌／型號</th><th>顏色</th><th>價格</th><th>庫存</th><th>SKU</th><th>狀態</th><th>操作</th></tr></thead>
                            <tbody>
                                {visibleRows.map(({product, variant}) => {
                                    const image = variant.images?.find(item => item.isPrimary) ?? variant.images?.[0];
                                    return <tr key={variant.id}>
                                        <td><div className="variant-catalog-product">{image ? <img src={image.imageUrl} alt="" /> : <span className="variant-catalog-placeholder">—</span>}<span>{styleLabel(product.name)}</span></div></td>
                                        <td><strong>{variant.brand}</strong><br /><span className="muted">{variant.model}</span></td>
                                        <td>{variant.color || '—'}</td>
                                        <td className="catalog-price">NT$ {Number(variant.price).toLocaleString()}</td>
                                        <td><span className={Number(variant.stock) <= 5 ? 'stock-low' : 'stock-ok'}>{variant.stock}</span></td>
                                        <td><code>{variant.sku || '—'}</code></td>
                                        <td><span className={`catalog-status ${variant.status === '上架' ? 'is-live' : 'is-off'}`}>{variant.status}</span></td>
                                        <td><Link className="link-button" to={`/products/${product.id}?variantId=${variant.id}`}>查看</Link><button className="link-button" type="button" onClick={() => openEdit({product, variant})}>編輯</button>{variant.status === '上架' && <button className="danger-link" type="button" onClick={() => disableVariant({product, variant})}>下架</button>}</td>
                                    </tr>;
                                })}
                            </tbody>
                        </table>
                        {!filteredRows.length && <div className="state-card">找不到符合條件的手機品項</div>}
                        {filteredRows.length > 0 && <div className="catalog-pagination"><button className="button button-outline" type="button" disabled={page <= 1} onClick={() => setPage(current => current - 1)}>上一頁</button><span>第 {page} / {pageCount} 頁 · 每頁 {pageSize} 筆</span><button className="button button-outline" type="button" disabled={page >= pageCount} onClick={() => setPage(current => current + 1)}>下一頁</button></div>}
                    </div>}
                </section>
            </div>

            {editing && <div className="variant-editor-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && setEditing(null)}>
                <form className="variant-editor panel" onSubmit={saveVariant}>
                    <div className="variant-editor-heading"><div><p className="eyebrow">CATALOG ITEM</p><h2>{editing.id ? '編輯手機品項' : '新增手機品項'}</h2></div><button className="variant-editor-close" type="button" onClick={() => setEditing(null)}>×</button></div>
                    {!editing.id && <label>商品系列<select name="productId" value={form.productId} onChange={updateForm} required><option value="">請選擇商品系列</option>{products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>}
                    <div className="variant-editor-grid"><label>品牌<input name="brand" value={form.brand} onChange={updateForm} required /></label><label>手機型號<input name="model" value={form.model} onChange={updateForm} required /></label><label>顏色<input name="color" value={form.color} onChange={updateForm} required /></label><label>價格<input name="price" type="number" min="0" value={form.price} onChange={updateForm} required /></label><label>SKU<input name="sku" value={form.sku} onChange={updateForm} /></label><label>狀態<select name="status" value={form.status} onChange={updateForm}><option value="上架">上架</option><option value="下架">下架</option></select></label><label>Tags<input name="tags" value={form.tags} onChange={updateForm} placeholder="例如：霧面,磁吸,輕薄" /></label></div>
                    <div className="variant-editor-actions"><button className="button button-outline" type="button" onClick={() => setEditing(null)}>取消</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? '儲存中…' : '儲存品項'}</button></div>
                </form>
            </div>}
        </main>
    );
}
