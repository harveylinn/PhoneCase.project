
import { Link, useLocation } from 'react-router-dom';
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
  const { currentMember, status } = useAuth();

  return (
    <header className="site-header">

      <Link className="brand" to="/">
        CASELAB
      </Link>

      <nav
        className="header-nav"
        style={{
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >

        <Link to="/">商品專區</Link>

        <a href="#design">設計理念</a>

        <a href="#story">品牌故事</a>

        <Link to="/orderlist">
          我的訂單
        </Link>

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
