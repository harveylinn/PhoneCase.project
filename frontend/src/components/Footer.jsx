
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <strong>CASELAB.</strong>
          <span>JUST IN CASE. JUST YOUR STYLE.</span>
        </div>

        <nav className="site-footer-nav" aria-label="頁尾導覽">
          <Link to="/">首頁</Link>
          <Link to="/products">商品專區</Link>
          <Link to="/cart">購物車</Link>
        </nav>

        <small className="site-footer-copyright">
          © {new Date().getFullYear()} CASELAB.
        </small>
      </div>
    </footer>
  );
}
