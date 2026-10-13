import { Link, Route, Routes } from 'react-router-dom';
import ProductList from './pages/products/ProductList.jsx';
import ProductDetail from './pages/products/ProductDetail.jsx';
import AdminProducts from './pages/products/AdminProducts.jsx';

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
        <Route path="/admin" element={<AdminProducts />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="*" element={<ProductList />} />
      </Routes>
    </>
  );
}
