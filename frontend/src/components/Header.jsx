
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { getLoginUrl } from '../utils/authRedirect';

import MemberMenu from './MemberMenu';
import CartNavLink from './CartNavLink';

// ==========================================
// 網站共用 Navbar
// 只負責顯示畫面與導覽
// 不直接處理購物車 API
// ==========================================

export default function Header() {

  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(location.search).get('q') ?? '');
  const searchInputRef = useRef(null);
  const showCatalogSearch = location.pathname === '/' || location.pathname.startsWith('/products');

  useEffect(() => {
    setSearchTerm(new URLSearchParams(location.search).get('q') ?? '');
  }, [location.search]);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  function submitSearch(event) {
    event.preventDefault();
    const query = searchTerm.trim();
    navigate(
      query ? `/products?q=${encodeURIComponent(query)}` : '/products'
    );
    setIsSearchOpen(false);
  }
  const { currentMember, status } = useAuth();

  return (
    <header className="site-header">

      <div className="header-brand-group">
        <Link className="brand" to="/">CASELAB</Link>
        {showCatalogSearch && (
          <div className="header-search-wrap">
            <button
              className="header-search-toggle"
              type="button"
              onClick={() => setIsSearchOpen(open => !open)}
              aria-label={isSearchOpen ? '關閉商品搜尋' : '開啟商品搜尋'}
              aria-expanded={isSearchOpen}
              aria-controls="header-catalog-search"
            >
              {isSearchOpen ? (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg>
              )}
            </button>
            {isSearchOpen && (
              <form id="header-catalog-search" className="header-search-form" role="search" onSubmit={submitSearch}>
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="搜尋商品、型號、顏色或風格"
                  aria-label="搜尋商品、型號、顏色或風格"
                />
                <button type="submit">搜尋</button>
              </form>
            )}
          </div>
        )}
      </div>

      <nav
        className="header-nav"
        style={{
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >

        <Link to="/">首頁</Link>
        <Link to="/products">商品專區</Link>
        {/* 購物車圖示與數量交給獨立元件 */}
        <CartNavLink />
        {status === 'checking' && (
          <span>身分確認中…</span>
        )}

        {currentMember ? (
          <MemberMenu />
        ) : (
          <Link to={getLoginUrl(location)}>
            登入/註冊
          </Link>
        )}

        <Link className="nav-placeholder" to="/admin">
          後台管理
        </Link>

      </nav>
    </header>
  );
}
