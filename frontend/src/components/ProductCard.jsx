import { Link } from 'react-router-dom';

export const styleLabels = { AirX: '輕量防摔', 'SolidX / SolidSuit': '經典防摔', Clear: '透明防摔', 'Mod NX': '模組化防摔', Bumper: '邊框防摔', ClearX: '透明輕薄' };
export function styleLabel(name) { return styleLabels[name] ?? name; }

export default function ProductCard({ item, favorite, onFavorite }) {
  const { product, variant } = item;
  const image = variant.images?.find(item => item.isPrimary) ?? variant.images?.[0];
  const modelName = variant.model.startsWith(variant.brand) ? variant.model : `${variant.brand} ${variant.model}`;

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        {image ? <img src={image.imageUrl} alt={`${product.name} ${modelName}`} className="product-image" /> : <div className="product-image-placeholder">尚無商品圖片</div>}
        <button className={`favorite-button ${favorite ? 'is-favorite' : ''}`} onClick={() => onFavorite(variant.id)}>{favorite ? '♥' : '♡'}</button>
      </div>
      <div className="product-card-body">
        <span className="product-category">{styleLabel(product.name)}</span>
        <h3>{modelName}</h3>
        <div className="product-tags"><span>{variant.color}</span><span>{variant.stock > 0 ? '現貨' : '缺貨'}</span></div>
        <div className="product-card-footer"><strong className="product-price">NT$ {Number(variant.price).toLocaleString()}</strong><Link to={`/products/${product.id}?variantId=${variant.id}`}>查看商品 →</Link></div>
      </div>
    </article>
  );
}
