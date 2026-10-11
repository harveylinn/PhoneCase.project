import { useEffect, useMemo, useState } from 'react';
import ProductCard, { styleLabels, styleLabel } from '../components/ProductCard.jsx';
import { getProducts } from '../services/productApi.js';

const styles = ['', ...Object.keys(styleLabels)];

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [style, setStyle] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('caselab-favorites') ?? '[]'));

  useEffect(() => { getProducts().then(setProducts).catch(error => setError(error.message)).finally(() => setLoading(false)); }, []);
  const items = useMemo(() => products.flatMap(product => (product.variants ?? []).map(variant => ({ product, variant }))), [products]);
  const brands = [...new Set(items.map(item => item.variant.brand))];
  const models = [...new Set(items.filter(item => !brand || item.variant.brand === brand).map(item => item.variant.model))];
  const styleCounts = Object.fromEntries(Object.keys(styleLabels).map(item => [item, items.filter(entry => entry.product.name === item).length]));
  const brandCounts = Object.fromEntries(brands.map(item => [item, items.filter(entry => entry.variant.brand === item).length]));

  const filteredItems = useMemo(() => {
    const result = items.filter(({ product, variant }) => {
      const text = `${product.name} ${product.description ?? ''} ${variant.brand} ${variant.model} ${variant.color}`.toLowerCase();
      return (!keyword || text.includes(keyword.toLowerCase())) && (!brand || variant.brand === brand) && (!model || variant.model === model) && (!style || product.name === style);
    });
    return result.sort((a, b) => sort === 'price-asc' ? a.variant.price - b.variant.price : sort === 'price-desc' ? b.variant.price - a.variant.price : sort === 'name' ? a.variant.model.localeCompare(b.variant.model) : b.variant.id - a.variant.id);
  }, [items, keyword, brand, model, style, sort]);

  function toggleFavorite(id) {
    const next = favorites.includes(String(id)) ? favorites.filter(item => item !== String(id)) : [...favorites, String(id)];
    setFavorites(next); localStorage.setItem('caselab-favorites', JSON.stringify(next));
  }
  function clearFilters() { setBrand(''); setModel(''); setStyle(''); setKeyword(''); }

  return (
    <main className="page-shell">
      <section className="catalog-hero"><div className="catalog-hero-copy"><p className="eyebrow">CASELAB PHONE CASES</p><h1>質感手機殼<br />為日常加分</h1><p>兼顧保護、手感與生活風格，找到適合你的手機殼。</p><a className="button button-primary" href="#catalog">探索商品 →</a></div></section>
      <section className="device-picker"><div className="picker-heading"><h2>選擇你的裝置型號</h2><button className="text-button" onClick={clearFilters}>清除選擇</button></div><div className="brand-buttons">{brands.map(item => <button key={item} className={`brand-button ${brand === item ? 'is-selected' : ''}`} onClick={() => { setBrand(item); setModel(''); }}>{item}</button>)}</div><select className="model-select" value={model} disabled={!brand} onChange={event => setModel(event.target.value)}><option value="">{brand ? '全部型號' : '請先選擇品牌'}</option>{models.map(item => <option key={item} value={item}>{item}</option>)}</select></section>
      <nav className="category-tabs">{styles.map(item => <button key={item || 'all'} className={`category-tab ${style === item ? 'is-active' : ''}`} onClick={() => setStyle(item)}>{item ? styleLabel(item) : '全部'}</button>)}</nav>
      <div className="catalog-layout" id="catalog"><aside className="filter-panel"><div className="filter-title"><h2>篩選條件</h2><button className="text-button" onClick={clearFilters}>清除</button></div><label>關鍵字<input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="搜尋商品或型號" /></label><details open><summary>商品款式</summary><div className="filter-options"><label className="filter-check"><input type="checkbox" checked={!style} onChange={() => setStyle('')} /><span>全部款式</span></label>{Object.keys(styleLabels).map(item => <label className="filter-check" key={item}><input type="checkbox" checked={style === item} onChange={() => setStyle(style === item ? '' : item)} /><span>{styleLabel(item)} <small>({styleCounts[item]})</small></span></label>)}</div></details><details open><summary>品牌</summary><div className="filter-options"><label className="filter-check"><input type="checkbox" checked={!brand} onChange={() => { setBrand(''); setModel(''); }} /><span>全部品牌</span></label>{brands.map(item => <label className="filter-check" key={item}><input type="checkbox" checked={brand === item} onChange={() => { setBrand(brand === item ? '' : item); setModel(''); }} /><span>{item} <small>({brandCounts[item]})</small></span></label>)}</div></details></aside><section className="catalog-results"><div className="results-toolbar"><p className="muted">找到 {filteredItems.length} 件商品</p><label className="sort-control">排序 <select value={sort} onChange={event => setSort(event.target.value)}><option value="newest">最新上架</option><option value="price-asc">價格由低到高</option><option value="price-desc">價格由高到低</option><option value="name">名稱排序</option></select></label></div>{loading && <div className="state-card">正在載入商品…</div>}{error && <div className="state-card">{error}</div>}{!loading && !error && filteredItems.length === 0 && <div className="state-card empty-state"><strong>找不到符合條件的商品</strong><span>請調整關鍵字或篩選條件。</span><button className="button button-primary" onClick={clearFilters}>清除篩選</button></div>}{!loading && !error && filteredItems.length > 0 && <div className="product-grid">{filteredItems.map(item => <ProductCard key={item.variant.id} item={item} favorite={favorites.includes(String(item.variant.id))} onFavorite={toggleFavorite} />)}</div>}</section></div>
    </main>
  );
}
