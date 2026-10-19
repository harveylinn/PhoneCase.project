import { Link, Route, Routes } from 'react-router-dom';
import ProductList from './pages/products/ProductList.jsx';
import ProductDetail from './pages/products/ProductDetail.jsx';
import AdminProducts from './pages/products/AdminProducts.jsx';
import CartPage from './pages/cart/CartPage';
import RegisterPage from './pages/member/RegisterPage';
import LoginPage from './pages/member/LoginPage';
import ProfilePage from './pages/member/ProfilePage';
import Admin from './pages/admin/admin.jsx';
import OrderModule from './pages/order/OrderModule';

function Header() {
  return (
    <header className="site-header">
      <Link className="brand" to="/">CASELAB</Link>
      <nav className="header-nav">
        <Link to="/">商品專區</Link>
        <a href="#design">設計理念</a>
        <a href="#story">品牌故事</a>
        <span className="nav-placeholder">會員／購物車</span>
      </nav>
    </header>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/admin-products" element={<AdminProducts />} />

        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<OrderModule />} />

        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/admin" element={<Admin />} />


        <Route path="*" element={<ProductList />} />
      </Routes>
    </>
  );
}
