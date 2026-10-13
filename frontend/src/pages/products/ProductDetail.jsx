import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getProduct } from '../../services/productApi.js';
import { styleLabel } from '../../components/ProductCard.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [variantId, setVariantId] = useState(searchParams.get('variantId') ?? '');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [modelKeyword, setModelKeyword] = useState('');
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    getProduct(id).then(setProduct).catch(error => setError(error.message));
  }, [id]);

  const variants = product?.variants ?? [];
  const selectedVariant = variants.find(item => String(item.id) === String(variantId)) ?? variants[0];
  const brands = [...new Set(variants.map(item => item.brand).filter(Boolean))];
  const brandVariants = variants.filter(item => item.brand === selectedBrand);
  const modelVariants = [...new Map(brandVariants.map(item => [item.model, item])).values()]
    .filter(item => item.model.toLowerCase().includes(modelKeyword.toLowerCase()));
  const images = selectedVariant?.images ?? [];
  const selectedImage = images[imageIndex] ?? images[0];

  useEffect(() => {
    if (selectedVariant) {
      setVariantId(String(selectedVariant.id));
      setSelectedBrand(selectedVariant.brand);
      setImageIndex(0);
    }
  }, [selectedVariant?.id]);

  const modelName = useMemo(() => {
    if (!selectedVariant) return '';
    return selectedVariant.model.startsWith(selectedVariant.brand)
      ? selectedVariant.model
      : `${selectedVariant.brand} ${selectedVariant.model}`;
  }, [selectedVariant]);

  if (error) return <main className="page-shell"><div className="state-card">{error}<br /><Link to="/">返回商品列表</Link></div></main>;
  if (!product || !selectedVariant) return <main className="page-shell"><div className="state-card">正在載入商品…</div></main>;

  return (
    <main className="page-shell detail-page">
      <div className="breadcrumb"><Link to="/">商品列表</Link><span>›</span>商品詳細</div>
      <article className="product-detail">
        <section className="detail-media">
          <div className="detail-image-frame">
            {selectedImage ? <img className="detail-image" src={selectedImage.imageUrl} alt={`${product.name} ${modelName}`} /> : <div className="product-image-placeholder">尚無商品圖片</div>}
          </div>
          <div className="detail-thumbnails">
            {images.map((image, index) => <button key={image.id ?? image.imageUrl} className={`detail-thumbnail ${index === imageIndex ? 'is-active' : ''}`} onClick={() => setImageIndex(index)}><img src={image.imageUrl} alt={`商品圖片 ${index + 1}`} /></button>)}
          </div>
        </section>
        <section className="detail-copy">
          <p className="detail-category">{styleLabel(product.name)}</p>
          <h1>{styleLabel(product.name)}</h1>
          <p className="detail-description">{product.description}</p>
          <div className="detail-info">
            <div className="device-choice">
              <strong>選擇手機品牌</strong>
              <div className="detail-brand-buttons" role="group" aria-label="選擇手機品牌">
                {brands.map(brand => <button key={brand} type="button" className={`detail-brand-button ${selectedBrand === brand ? 'is-selected' : ''}`} onClick={() => {
                  const firstVariant = variants.find(item => item.brand === brand);
                  setSelectedBrand(brand);
                  if (firstVariant) setVariantId(String(firstVariant.id));
                  setImageIndex(0);
                }}>{brand}</button>)}
              </div>
            </div>
            <div className="device-choice">
              <strong>選擇手機型號</strong>
              <input className="model-search" value={modelKeyword} onChange={event => setModelKeyword(event.target.value)} placeholder="搜尋手機型號，例如 Pro、S26" aria-label="搜尋手機型號" />
              <div className="detail-model-list" role="group" aria-label="選擇手機型號">
                {modelVariants.map(variant => <button key={variant.id} type="button" className={`detail-model-button ${String(selectedVariant.id) === String(variant.id) ? 'is-selected' : ''}`} onClick={() => { setVariantId(String(variant.id)); setImageIndex(0); }}>{variant.model}</button>)}
                {modelVariants.length === 0 && <span className="model-empty">找不到符合的手機型號</span>}
              </div>
            </div>
            <div className="detail-price-row"><strong>價格</strong><span>NT$ {Number(selectedVariant.price).toLocaleString()}</span></div>
            <div><strong>顏色</strong><span>{selectedVariant.color}</span></div>
          </div>
          <div className="detail-benefits"><div><strong>日常防護</strong><span>安心保護手機外觀</span></div><div><strong>精準開孔</strong><span>貼合手機按鍵與鏡頭</span></div><div><strong>舒適手感</strong><span>適合長時間使用</span></div></div>
          <div className="detail-note"><strong>商品提醒</strong><p>圖片為商品款式示意，實際規格依所選手機型號與顏色為準。</p></div>
          <Link className="button button-outline" to="/">返回商品列表</Link>
        </section>
      </article>
    </main>
  );
}
