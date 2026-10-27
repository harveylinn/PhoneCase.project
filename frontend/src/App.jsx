import { Link, Route, Routes } from 'react-router-dom';
import ProductList from './pages/products/ProductList.jsx';
import ProductDetail from './pages/products/ProductDetail.jsx';
import AdminProducts from './pages/products/AdminProducts.jsx';
import CartPage from './pages/cart/CartPage';
import RegisterPage from './pages/member/RegisterPage';
import LoginPage from './pages/member/LoginPage';
import ProfilePage from './pages/member/ProfilePage';
import Admin from './pages/admin/admin.jsx';


function Header() {
  return (
    <header className="site-header">
      <Link className="brand" to="/">CASELAB</Link>
      <nav className="header-nav">
        <Link to="/">商品專區</Link>
        <a href="#design">設計理念</a>
        <a href="#story">品牌故事</a>
        <Link to="/login">會員</Link>
        <Link to="/cart">購物車</Link>
        <Link className="nav-placeholder" to="/admin">後台管理</Link>
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

        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/admin" element={<Admin />} />


        <Route path="*" element={<ProductList />} />
      </Routes>
    </>
  );
}
