import { Link, Route, Routes, useLocation } from 'react-router-dom';
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
import MemberRoute from './auth/MemberRoute';
import Admin from './pages/admin/admin.jsx';
import SupportAdmin from './pages/admin/SupportAdmin.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import {
  AdminMembersPage,
  AdminOrdersPage,
  AdminProductsPage,
  UnlistedProductsPage
} from './pages/admin/AdminPages.jsx';
import CheckOutPage from './pages/order/CheckoutPage.tsx'
import OrderModule from './pages/order/OrderModule';
import Header from './components/Header';


// 分頁
export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname === '/admin'
    || location.pathname.startsWith('/admin/')
    || location.pathname.startsWith('/admin-products');
  // 後台版面（/admin、商品、訂單、會員、圖片樣本庫）使用共用側邊欄，不顯示商城頁首
  const isAdminLayout = /^\/admin(\/(products|orders|members|samples)(\/.*)?)?\/?$/.test(location.pathname);

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
          <Route path="samples" element={<ImageSamples />} />
        </Route>
        <Route path="/admin-products/variants" element={<VariantsCatalog />} />
        <Route path="/admin/support" element={<SupportAdmin />} />
        <Route path="*" element={<ProductList />} />
      </Routes>
      {!isAdminRoute && <AiChatWidget />}
    </>
  );
}
