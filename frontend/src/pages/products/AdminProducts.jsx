import { useEffect, useMemo, useState } from 'react';

async function request(url, options = {}) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || Object.values(body ?? {})[0] || '操作失敗');
  }
  return response.status === 204 ? null : response.json();
}

const emptyProduct = { name: '', category: '手機殼', description: '', status: '上架' };
const emptyVariant = { brand: '', model: '', color: '', price: '', stock: 0, sku: '', status: '上架', imageUrl: '' };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [variantForm, setVariantForm] = useState(emptyVariant);
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadProducts() {
    setLoading(true);
    try { setProducts(await request('/api/products')); setError(''); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadProducts(); }, []);

  const filtered = useMemo(() => products.filter(product => {
    const matchesKeyword = !keyword || `${product.name} ${product.category}`.toLowerCase().includes(keyword.toLowerCase());
    const matchesStatus = status === 'all' || (status === 'available' && product.status === '上架') || (status === 'inactive' && product.status === '下架');
    return matchesKeyword && matchesStatus;
  }), [products, keyword, status]);

  function showNotice(message) { setNotice(message); window.setTimeout(() => setNotice(''), 3500); }
  function selectProduct(product) { setSelected(product); setProductForm({ name: product.name ?? '', category: product.category ?? '', description: product.description ?? '', status: product.status ?? '上架' }); resetVariant(); }
  function resetVariant() { setEditingVariantId(null); setVariantForm(emptyVariant); }
  function updateProductField(event) { setProductForm({ ...productForm, [event.target.name]: event.target.value }); }
  function updateVariantField(event) { setVariantForm({ ...variantForm, [event.target.name]: event.target.value }); }

  async function saveProduct(event) {
    event.preventDefault();
    try {
      const saved = await request(selected ? `/api/products/${selected.id}` : '/api/products', { method: selected ? 'PUT' : 'POST', body: JSON.stringify(productForm) });
      showNotice('商品系列已儲存');
      await loadProducts();
      const refreshed = selected ? saved : saved;
      selectProduct(refreshed);
    } catch (err) { setError(err.message); }
  }

  async function toggleStatus(product) {
    const next = product.status === '上架' ? '下架' : '上架';
    try { await request(`/api/products/${product.id}/status?status=${encodeURIComponent(next)}`, { method: 'PATCH' }); showNotice(`商品已${next}`); await loadProducts(); }
    catch (err) { setError(err.message); }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`確定刪除「${product.name}」以及底下所有規格嗎？`)) return;
    try { await request(`/api/products/${product.id}`, { method: 'DELETE' }); showNotice('商品已刪除'); setSelected(null); await loadProducts(); }
    catch (err) { setError(err.message); }
  }

  async function saveVariant(event) {
    event.preventDefault();
    if (!selected) return;
    const payload = { brand: variantForm.brand, model: variantForm.model, color: variantForm.color, price: Number(variantForm.price), stock: Number(variantForm.stock), sku: variantForm.sku, status: variantForm.status };
    try {
      const saved = await request(editingVariantId ? `/api/products/${selected.id}/variants/${editingVariantId}` : `/api/products/${selected.id}/variants`, { method: editingVariantId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      if (variantForm.imageUrl) {
        const old = selected.variants?.find(item => item.id === editingVariantId);
        const oldImage = old?.images?.find(item => item.isPrimary) ?? old?.images?.[0];
        const imagePayload = { imageUrl: variantForm.imageUrl, sortOrder: 1, isPrimary: true };
        await request(oldImage ? `/api/variants/${saved.id}/images/${oldImage.id}` : `/api/variants/${saved.id}/images`, { method: oldImage ? 'PUT' : 'POST', body: JSON.stringify(imagePayload) });
      }
      showNotice('商品規格已儲存');
      const refreshed = await request(`/api/products/${selected.id}`);
      setProducts(items => items.map(item => item.id === refreshed.id ? refreshed : item));
      selectProduct(refreshed);
    } catch (err) { setError(err.message); }
  }

  async function deleteVariant(variant) {
    if (!selected || !window.confirm(`確定刪除 ${variant.brand} ${variant.model} 嗎？`)) return;
    try { await request(`/api/products/${selected.id}/variants/${variant.id}`, { method: 'DELETE' }); showNotice('規格已刪除'); const refreshed = await request(`/api/products/${selected.id}`); setProducts(items => items.map(item => item.id === refreshed.id ? refreshed : item)); selectProduct(refreshed); }
    catch (err) { setError(err.message); }
  }

  function editVariant(variant) {
    const image = variant.images?.find(item => item.isPrimary) ?? variant.images?.[0];
    setEditingVariantId(variant.id);
    setVariantForm({ brand: variant.brand ?? '', model: variant.model ?? '', color: variant.color ?? '', price: variant.price ?? '', stock: variant.stock ?? 0, sku: variant.sku ?? '', status: variant.status ?? '上架', imageUrl: image?.imageUrl ?? '' });
  }

  return (
    <main className="admin-page page-shell">
      <div className="admin-heading"><div><p className="eyebrow">CASELAB ADMIN · REACT</p><h1>商品管理</h1><p className="muted">管理商品系列、手機規格與圖片</p></div><button className="button button-primary" onClick={() => { setSelected(null); setProductForm(emptyProduct); resetVariant(); }}>＋ 新增商品</button></div>
      {notice && <div className="admin-notice">{notice}</div>}{error && <div className="admin-error">{error}<button onClick={() => setError('')}>關閉</button></div>}
      <section className="admin-layout">
        <aside className="admin-list panel"><div className="admin-list-tools"><input placeholder="搜尋商品" value={keyword} onChange={event => setKeyword(event.target.value)} /><select value={status} onChange={event => setStatus(event.target.value)}><option value="all">全部狀態</option><option value="available">上架中</option><option value="inactive">已下架</option></select></div>{loading ? <p className="muted">正在載入…</p> : filtered.map(product => <button key={product.id} className={`admin-list-item ${selected?.id === product.id ? 'is-selected' : ''}`} onClick={() => selectProduct(product)}><strong>{product.name}</strong><span>{product.variants?.length ?? 0} 筆規格 · {product.status}</span></button>)}</aside>
        <section className="admin-editor panel">
          <h2>{selected ? `編輯：${selected.name}` : '新增商品系列'}</h2>
          <form onSubmit={saveProduct} className="admin-form"><label>商品名稱<input name="name" value={productForm.name} onChange={updateProductField} required /></label><label>分類<input name="category" value={productForm.category} onChange={updateProductField} required /></label><label>狀態<select name="status" value={productForm.status} onChange={updateProductField}><option value="上架">上架</option><option value="下架">下架</option></select></label><label className="wide">商品描述<textarea name="description" value={productForm.description} onChange={updateProductField} rows="3" /></label><button className="button button-primary" type="submit">儲存商品系列</button></form>
          {selected && <><div className="variant-heading"><h2>商品規格</h2><button className="button button-outline" onClick={resetVariant}>＋ 新增規格</button></div><div className="variant-table-wrap"><table className="variant-table"><thead><tr><th>品牌／型號</th><th>顏色</th><th>價格</th><th>SKU</th><th>操作</th></tr></thead><tbody>{(selected.variants ?? []).map(variant => <tr key={variant.id}><td><strong>{variant.brand}</strong><br />{variant.model}</td><td>{variant.color}</td><td>NT$ {Number(variant.price).toLocaleString()}</td><td>{variant.sku}</td><td><button className="link-button" onClick={() => editVariant(variant)}>編輯</button><button className="danger-link" onClick={() => deleteVariant(variant)}>刪除</button></td></tr>)}</tbody></table></div><form onSubmit={saveVariant} className="admin-form variant-form"><h3>{editingVariantId ? '編輯規格' : '新增規格'}</h3><label>品牌<input name="brand" value={variantForm.brand} onChange={updateVariantField} required /></label><label>手機型號<input name="model" value={variantForm.model} onChange={updateVariantField} required /></label><label>顏色<input name="color" value={variantForm.color} onChange={updateVariantField} required /></label><label>價格<input name="price" type="number" min="0" value={variantForm.price} onChange={updateVariantField} required /></label><label>庫存<input name="stock" type="number" min="0" value={variantForm.stock} onChange={updateVariantField} required /></label><label>SKU<input name="sku" value={variantForm.sku} onChange={updateVariantField} required /></label><label>狀態<select name="status" value={variantForm.status} onChange={updateVariantField}><option value="上架">上架</option><option value="下架">下架</option></select></label><label className="wide">圖片路徑<input name="imageUrl" value={variantForm.imageUrl} onChange={updateVariantField} placeholder="/images/xxx.webp" /></label><button className="button button-primary" type="submit">儲存規格</button></form><button className="danger-button" onClick={() => deleteProduct(selected)}>刪除商品系列</button></>}
        </section>
      </section>
    </main>
  );
}
