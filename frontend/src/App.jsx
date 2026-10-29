import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ProductList from './pages/products/ProductList.jsx';
import ProductDetail from './pages/products/ProductDetail.jsx';
import AdminProducts from './pages/products/AdminProducts.jsx';
import ImageSamples from './pages/samples/ImageSamples.jsx';
import VariantsCatalog from './pages/products/VariantsCatalog.jsx';
import AiChatWidget from './components/AiChatWidget.jsx';
import CartPage from './pages/cart/CartPage';
import RegisterPage from './pages/member/RegisterPage';
import LoginPage from './pages/member/LoginPage';
import ProfilePage from './pages/member/ProfilePage';
import { useAuth } from './auth/useAuth';
import MemberRoute from './auth/MemberRoute';
import Admin from './pages/admin/admin.jsx';
import CheckOutPage from './pages/order/CheckoutPage.tsx'
import { getGuestCartCount } from './utils/cartStorage';
import OrderModule from './pages/order/OrderModule';


// 首頁欄
function Header() {
  const { currentMember, status, logout } = useAuth();
  const [cartCount, setCartCount] = useState(getGuestCartCount);

  useEffect(() => {
    const updateCartCount = () => {
      setCartCount(getGuestCartCount());
    };

    window.addEventListener('cartUpdated', updateCartCount);
    window.addEventListener('storage', updateCartCount);

    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
      window.removeEventListener('storage', updateCartCount);
    };
  }, []);

  return (
    <header className="site-header">
      <Link className="brand" to="/">CASELAB</Link>

      <nav className="header-nav" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <Link to="/">商品專區</Link>
        <Link to="/admin/samples">圖片樣本庫</Link>
        <a href="#design">設計理念</a>
        <a href="#story">品牌故事</a>
        <Link to="/cart" className="header-cart-link">購物車 ({cartCount})</Link>
        {status === 'checking' && <span>身分確認中…</span>}
        {currentMember ? <>
          <Link to="/profile" style={{ maxWidth: '12rem', overflowWrap: 'anywhere' }}>會員中心：{currentMember.name}</Link>
          <button type="button" onClick={logout}>登出</button>
        </> : <>
          <Link to="/login">登入</Link>
          <Link to="/register">註冊</Link>
        </>}
      </nav>
    </header>
  );
}

// 分頁
export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname === '/admin'
    || location.pathname.startsWith('/admin-products')
    || location.pathname.startsWith('/admin/samples');

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/admin-products" element={<AdminProducts />} />

        <Route path="/cart" element={<CartPage />} />

        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<MemberRoute><ProfilePage /></MemberRoute>} />

        <Route path="/checkout" element={<OrderModule />} />
        <Route path="/orderdetail" element={<OrderModule initialPage="list" />} />
        <Route path="/orderlist" element={<OrderModule initialPage="list" />} />

        <Route path="/admin" element={<Admin />} />
        <Route path="/admin-products/variants" element={<VariantsCatalog />} />
        <Route path="/admin/samples" element={<ImageSamples />} />
        <Route path="*" element={<ProductList />} />
      </Routes>
      {!isAdminRoute && <AiChatWidget />}
    </>
  );
}
