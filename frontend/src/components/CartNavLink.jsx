
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCartCount } from '../hooks/useCartCount';

// Navbar 購物車圖示與商品數量
export default function CartNavLink() {

  // 取得目前登入身分的購物車總數量
  const cartCount = useCartCount();

  return (
    <Link
      to="/cart"
      className="header-cart-link"
      aria-label={
        cartCount === null
          ? '購物車，正在取得商品數量'
          : `購物車，共 ${cartCount} 件商品`
      }
      title="購物車"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      {/* lucide-react 購物車圖示 */}
      <ShoppingCart size={20} strokeWidth={2} />

      {/* 尚未取得會員數量時不顯示錯誤的 0 */}
      <span>
        {cartCount === null ? '(...)' : `(${cartCount})`}
      </span>
    </Link>
  );
}
