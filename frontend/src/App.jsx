import { Link, Route, Routes } from 'react-router-dom';
import ProductList from './pages/products/ProductList.jsx';
import ProductDetail from './pages/products/ProductDetail.jsx';
import AdminProducts from './pages/products/AdminProducts.jsx';
import CartPage from './pages/cart/CartPage';
import RegisterPage from './pages/member/RegisterPage';
import LoginPage from './pages/member/LoginPage';
import ProfilePage from './pages/member/ProfilePage';
import Admin from './pages/admin/admin.jsx';
import { useEffect, useState } from 'react';
import { getGuestCartCount } from './utils/cartStorage';


// 首頁欄
function Header() {
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

      <nav className="header-nav">
        <Link to="/">商品專區</Link>
        <a href="#design">設計理念</a>
        <a href="#story">品牌故事</a>
        <Link to="/cart" className="header-cart-link">購物車 ({cartCount})</Link>
      </nav>
    </header>
  );
}

// 分頁
export default function App() {
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
        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/admin" element={<Admin />} />


        <Route path="*" element={<ProductList />} />
      </Routes>
    </>
  );
}
