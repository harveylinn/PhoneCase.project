
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getProducts } from '../../services/productApi.js';
import './HomePage.css';

const brands = [
  { name: 'iPhone 系列', keyword: 'iPhone', symbol: '◯' },
  { name: 'Samsung Galaxy', keyword: 'Samsung', symbol: '◇' },
  { name: '探索所有商品', keyword: '', symbol: '↗' },
];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    let active = true;

    getProducts()
      .then(data => {
        if (active) {
          setProducts(Array.isArray(data) ? data : []);
        }
      })
      .catch(err => {
        if (active) {
          setError(err.message || '商品載入失敗');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!location.hash) return;

    const id = decodeURIComponent(location.hash.slice(1));
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [location.hash]);

  const featured = useMemo(() => {
    return products
      .flatMap(product =>
        (product.variants ?? []).map(variant => ({
          product,
          variant,
        }))
      )
      .filter(({ variant }) =>
        Number(variant.price) >= 0 &&
        Number(variant.stock) > 0
      )
      .slice(0, 4);
  }, [products]);


  return (
    <main className="home">

      {/* 01. Hero：沿用商品列表原本的 Banner */}
      <section className="home-banner-section">
        <div className="catalog-hero">
          <div className="catalog-hero-copy">
            <p className="eyebrow">
              CASELAB PHONE CASES
            </p>

            <h1>
              質感手機殼
              <br />
              為日常加分
            </h1>

            <p>
              兼顧保護、手感與生活風格，找到適合你的手機殼。
            </p>

            <Link className="button button-primary" to="/products">
              探索商品 →
            </Link>
          </div>
        </div>
      </section>


      {/* 02. 品牌分類 */}
      <section className="home-section home-categories">
        <div className="home-section-heading">
          <p className="home-eyebrow">FIND YOUR FIT</p>
          <h2>找到你的完美搭配。</h2>
          <p>選擇你的手機系列，開始探索。</p>
        </div>

        <div className="home-category-grid">
          {brands.map(brand => (
            <Link
              key={brand.name}
              className="home-category-card"
              to={
                brand.keyword
                  ? `/products?q=${encodeURIComponent(brand.keyword)}`
                  : '/products'
              }
            >
              <span className="home-category-symbol">
                {brand.symbol}
              </span>
              <strong>{brand.name}</strong>
              <span className="home-category-arrow">↗</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 03. 精選商品 */}
      <section className="home-section home-featured">
        <div className="home-featured-heading">
          <div>
            <p className="home-eyebrow">OUR SELECTION</p>
            <h2>日常，也有新選擇。</h2>
            <p>從我們精選的手機殼開始，展現你的風格。</p>
          </div>
          <Link to="/products" className="home-text-link">
            查看所有商品 ↗
          </Link>
        </div>

        {loading && (
          <p className="home-state" role="status">
            正在載入精選商品…
          </p>
        )}

        {!loading && error && (
          <div className="home-state" role="alert">
            <p>{error}</p>
            <Link to="/products">前往商品專區</Link>
          </div>
        )}

        {!loading && !error && featured.length === 0 && (
          <p className="home-state">目前尚無可推薦的商品。</p>
        )}

        <div className="home-product-grid">
          {featured.map(({ product, variant }) => {
            const image =
              variant.images?.find(img => img.isPrimary) ??
              variant.images?.[0];

            return (
              <Link
                className="home-product-card"
                key={variant.id}
                to={`/products/${product.id}?variantId=${variant.id}`}
              >
                <div className="home-product-image">
                  {image?.imageUrl ? (
                    <img
                      src={image.imageUrl}
                      alt={`${product.name} ${variant.model}`}
                      loading="lazy"
                    />
                  ) : (
                    <span>CASELAB</span>
                  )}
                </div>
                <div className="home-product-info">
                  <span>{variant.brand}</span>
                  <h3>{product.name}</h3>
                  <p>{variant.model} · {variant.color}</p>
                  <strong>
                    NT$ {Number(variant.price).toLocaleString()}
                  </strong>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 04. AI 推薦 */}
      <section className="home-ai-section">
        <div>
          <p className="home-eyebrow">
            A LITTLE HELP, A BETTER MATCH.
          </p>
          <h2>選不出來？讓 AI 幫你找。</h2>
          <p>
            不確定哪一款最適合你？
            <br />
            使用網站右下角的 AI 聊天助手，探索合適的手機殼。
          </p>
        </div>

        <div className="home-ai-graphic" aria-hidden="true">
          <span>✦</span>
          <div className="home-ai-bubble">Hello! ✨</div>
        </div>
      </section>

      {/* 05. 品牌特色 */}
      <section className="home-section home-values" id="design">
        <div className="home-section-heading">
          <p className="home-eyebrow">MADE FOR EVERYDAY</p>
          <h2>細節，成就每一天。</h2>
        </div>

        <div className="home-values-grid">
          <article>
            <span>01 /</span>
            <h3>安心防護</h3>
            <p>從日常使用出發，探索兼顧保護與設計的款式。</p>
          </article>
          <article>
            <span>02 /</span>
            <h3>貼合裝置</h3>
            <p>依照手機品牌與型號，尋找相容的手機殼規格。</p>
          </article>
          <article>
            <span>03 /</span>
            <h3>專屬風格</h3>
            <p>從顏色到款式，找到適合自己的日常搭配。</p>
          </article>
        </div>
      </section>

      
    </main>
  );
}
