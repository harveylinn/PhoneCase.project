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
import MemberMenu from './components/MemberMenu';
import { getLoginUrl } from './utils/authRedirect';
import Admin from './pages/admin/admin.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import {
  AdminMembersPage,
  AdminOrdersPage,
  AdminProductsPage,
  UnlistedProductsPage
} from './pages/admin/AdminPages.jsx';
import CheckOutPage from './pages/order/CheckoutPage.tsx'
import { getGuestCartCount } from './utils/cartStorage';
import OrderModule from './pages/order/OrderModule';


// 首頁欄
function Header() {
  const location = useLocation();
  const { currentMember, status } = useAuth();
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
        <Link to="/orderlist">我的訂單</Link>
        <Link to="/cart" className="header-cart-link">購物車 ({cartCount})</Link>
        {status === 'checking' && <span>身分確認中…</span>}
        {currentMember ? <MemberMenu /> : <>
          <Link to={getLoginUrl(location)}>登入/註冊</Link>
        </>}
        <Link className="nav-placeholder" to="/admin">後台管理</Link>
      </nav>
    </header>
  );
}

// 分頁
export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname === '/admin'
    || location.pathname.startsWith('/admin/')
    || location.pathname.startsWith('/admin-products');
  // 後台版面（/admin、/admin/products、/admin/orders、/admin/members）有自己的側邊欄，不顯示商城頁首
  const isAdminLayout = /^\/admin(\/(products|orders|members)(\/.*)?)?\/?$/.test(location.pathname);

  return (
    <>
      {!isAdminLayout && <Header />}
      <Routes>
        <Route path="/" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/admin-products" element={<AdminProducts />} />

        <Route path="/cart" element={<CartPage />} />

        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<MemberRoute><ProfilePage /></MemberRoute>} />

        <Route path="/checkout" element={<MemberRoute><OrderModule /></MemberRoute>} />
        <Route path="/orderdetail" element={<MemberRoute><OrderModule initialPage="list" /></MemberRoute>} />
        <Route path="/orderlist" element={<MemberRoute><OrderModule initialPage="list" /></MemberRoute>} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Admin />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/unlisted" element={<UnlistedProductsPage />} />
          <Route path="orders" element={<AdminOrdersPage key="all" filter="all" />} />
          <Route path="orders/unpaid" element={<AdminOrdersPage key="unpaid" filter="unpaid" />} />
          <Route path="orders/unshipped" element={<AdminOrdersPage key="unshipped" filter="unshipped" />} />
          <Route path="orders/unpicked" element={<AdminOrdersPage key="unpicked" filter="unpicked" />} />
          <Route path="members" element={<AdminMembersPage />} />
        </Route>
        <Route path="/admin-products/variants" element={<VariantsCatalog />} />
        <Route path="/admin/samples" element={<ImageSamples />} />
        <Route path="*" element={<ProductList />} />
      </Routes>
      {!isAdminRoute && <AiChatWidget />}
    </>
  );
}
