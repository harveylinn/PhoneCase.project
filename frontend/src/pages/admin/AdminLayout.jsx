import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { adminStyles } from './admin.jsx';

// 後台側邊選單：滑鼠移到有子選單的項目時展開子標籤（目前所在的區塊保持展開）
const menu = [
  { label: 'Dashboard', to: '/admin', end: true },
  {
    label: '商品管理',
    to: '/admin/products',
    children: [
      { label: '所有商品', to: '/admin/products', end: true },
      { label: '未上架', to: '/admin/products/unlisted' }
    ]
  },
  {
    label: '訂單管理',
    to: '/admin/orders',
    children: [
      { label: '所有訂單', to: '/admin/orders', end: true },
      { label: '未結帳', to: '/admin/orders/unpaid' },
      { label: '未出貨', to: '/admin/orders/unshipped' },
      { label: '未取貨', to: '/admin/orders/unpicked' }
    ]
  },
  { label: '會員管理', to: '/admin/members' }
];

/* 版面樣式：深色側邊欄 + 淺色內容區（比照設計稿），配色覆寫 admin.jsx 的 .adm 變數 */
const layoutStyles = `
.adm.adml {
  --adm-navy: #17171f;
  --adm-text: #2b2b33;
  --adm-muted: #6e6e78;
  --adm-faint: #a0a0aa;
  --adm-border: #e6e6ea;
  --adm-border-soft: #efeff2;
  --adm-coral: #17171f;
  --adm-coral-dark: #000000;
  --adm-coral-soft: #f1f1f4;
  --adm-paper: #f4f4f6;
  --adm-soft: #f7f7f9;
  --adm-sidebar: #17171f;
  flex-direction: row;
  background: #f6f6f8;
}
.adml-sidebar {
  position: sticky;
  top: 0;
  flex: 0 0 220px;
  height: 100vh;
  padding: 28px 0;
  background: var(--adm-sidebar);
  color: #fff;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.adml-brand {
  padding: 0 26px 36px;
  font-size: 19px;
  font-weight: 900;
  line-height: 1.25;
  letter-spacing: 0.5px;
  color: #fff;
}
.adml-nav { display: flex; flex-direction: column; gap: 4px; }
.adml-link {
  display: block;
  padding: 12px 30px;
  color: #b9b9c3;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.15s, background 0.15s;
}
.adml-link:hover { color: #fff; background: rgba(255, 255, 255, 0.06); }
.adml-link.active { color: #fff; font-weight: 800; }
.adml-item.has-sub > .adml-link::after { content: '›'; float: right; transition: transform 0.15s; }
.adml-item.has-sub:hover > .adml-link::after,
.adml-item.has-sub:focus-within > .adml-link::after,
.adml-item.is-open > .adml-link::after { transform: rotate(90deg); }
.adml-sub {
  display: none;
  padding: 2px 0 8px;
}
.adml-item:hover > .adml-sub,
.adml-item:focus-within > .adml-sub,
.adml-item.is-open > .adml-sub { display: block; }
.adml-sub .adml-link {
  padding: 8px 30px 8px 46px;
  font-size: 13px;
  font-weight: 500;
  color: #9a9aa5;
}
.adml-sub .adml-link.active { color: #fff; font-weight: 700; box-shadow: inset 3px 0 0 #fff; }
.adml-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* 標題列與 Dashboard 總覽 */
.adm-page-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 36px 4% 0;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}
.adm-page-title h1 { color: var(--adm-navy); font-size: 30px; font-weight: 900; letter-spacing: 0.3px; }
.adm-page-title p { margin-top: 6px; color: var(--adm-muted); }
.adm-page-title-side { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.adm-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.adm-kpi {
  padding: 22px 26px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--adm-border);
}
.adm-kpi span { display: block; color: var(--adm-muted); font-size: 13px; }
.adm-kpi strong { display: block; margin-top: 10px; color: var(--adm-navy); font-size: 26px; font-weight: 900; }
.adm-recent { padding: 22px 26px; border-radius: 12px; background: #fff; border: 1px solid var(--adm-border); }
.adm-recent-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.adm-recent-head h2 { color: var(--adm-navy); font-size: 20px; font-weight: 800; }
.adm-recent-head a { color: var(--adm-muted); font-size: 13px; text-decoration: none; }
.adm-recent-head a:hover { color: var(--adm-navy); }
.adm-tag.warn { background: var(--adm-warn-soft); color: var(--adm-warn); }

/* admin.jsx 中寫死的珊瑚色，改為與側邊欄一致的黑灰色系 */
.adml .adm-stat-box.today,
.adml .adm-stat-box.today .adm-stat-head,
.adml .adm-doc-row:hover,
.adml .adm-btn-soft { border-color: var(--adm-border); }
.adml .adm-btn-soft:hover { background: #e7e7ec; }
.adml .adm-trend-bar { fill: #b9b9c4; }
.adml .adm-trend-bar.is-hover { fill: var(--adm-navy); }
.adml .adm-crm-tab:hover span, .adml .adm-crm-tab.is-active span { color: #d4d4dc; }
.adml .adm-input:focus, .adml .adm-select:focus { border-color: var(--adm-navy); box-shadow: 0 0 0 3px rgba(23, 23, 31, 0.12); }

/* 未上架、訂單、會員等清單頁 */
.adm-list-tools { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
.adm-list-tools .adm-input { max-width: 320px; }
.adm-inline-input { width: 96px; padding: 6px 8px; border: 1px solid var(--adm-border); border-radius: 6px; }
.adm-inline-select { max-width: 170px; padding: 6px 8px; border: 1px solid var(--adm-border); border-radius: 6px; background: #fff; }
.adm-table-nowrap th, .adm-table-nowrap td { white-space: nowrap; }
.adm-table-nowrap td.wrap { white-space: normal; min-width: 180px; }
.adm-row-actions { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }

/* 未上架商品：多個圖片路徑欄位，左側為縮圖預覽 */
.adm-image-fields { display: flex; flex-direction: column; gap: 6px; min-width: 280px; }
.adm-image-field { display: flex; align-items: center; gap: 6px; }
.adm-image-thumb {
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  border-radius: 6px;
  border: 1px solid var(--adm-border);
  background: var(--adm-soft);
  color: var(--adm-faint);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.adm-image-thumb img { width: 100%; height: 100%; object-fit: cover; }
.adm-image-input { flex: 1; min-width: 0; padding: 6px 8px; border: 1px solid var(--adm-border); border-radius: 6px; font-size: 13px; }
.adm-image-input:focus { outline: none; border-color: var(--adm-navy); }
.adm-image-remove { flex: 0 0 26px; height: 26px; border: none; border-radius: 6px; background: transparent; color: var(--adm-muted); font-size: 16px; }
.adm-image-remove:hover { background: var(--adm-danger-soft); color: var(--adm-danger); }
.adm-image-add { align-self: flex-start; padding: 2px 4px; border: none; background: transparent; color: var(--adm-muted); font-size: 12px; font-weight: 700; }
.adm-image-add:hover { color: var(--adm-navy); }
.adm-notice { padding: 10px 14px; border-radius: 8px; background: #eaf7ef; color: #247341; font-weight: 700; }
.adm-error { padding: 10px 14px; border-radius: 8px; background: var(--adm-danger-soft); color: var(--adm-danger); font-weight: 700; }

/* 商品管理沿用商品頁元件，嵌入後台時調整外距 */
.adml-content .admin-page.page-shell { padding-top: 32px; }
.adml .admin-page .eyebrow { color: var(--adm-muted); }
.adml .admin-page h1, .adml .admin-page h2 { color: var(--adm-navy); }
.adml .admin-page .button-primary { background: var(--adm-navy); border-color: var(--adm-navy); color: #fff; }
.adml .admin-page .button-primary:hover { background: #000; }
.adml .admin-page .button-outline { border-color: var(--adm-navy); color: var(--adm-navy); }
.adml .admin-page .admin-list-item.is-selected { border-color: var(--adm-navy); }

@media (max-width: 1024px) {
  .adm-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 860px) {
  .adm.adml { flex-direction: column; }
  .adml-sidebar { position: static; height: auto; flex: none; padding: 16px 0 8px; }
  .adml-brand { padding: 0 16px 12px; }
  .adml-nav { flex-direction: row; flex-wrap: wrap; gap: 0; }
  .adml-link { padding: 10px 16px; }
  .adml-item.has-sub > .adml-link::after { display: none; }
  .adml-item:hover > .adml-sub, .adml-item:focus-within > .adml-sub { display: none; }
  .adml-item.is-open > .adml-sub { display: flex; flex-wrap: wrap; width: 100%; }
  .adml-item.is-open { width: 100%; order: 10; }
  .adml-sub .adml-link { padding: 8px 16px; }
  .adml-sub .adml-link.active { box-shadow: inset 0 -2px 0 #fff; }
  .adm-page-title { padding: 24px 16px 0; }
}
@media (max-width: 520px) {
  .adm-kpis { grid-template-columns: minmax(0, 1fr); }
}
`;

export default function AdminLayout() {
  const { pathname } = useLocation();

  return (
    <div className="adm adml">
      <style>{adminStyles}</style>
      <style>{layoutStyles}</style>

      <aside className="adml-sidebar">
        <div className="adml-brand">
          PHONECase
          <br />
          ADMIN
        </div>
        <nav className="adml-nav">
          {menu.map((item) => {
            const isOpen = item.children && pathname.startsWith(item.to);
            return (
              <div
                key={item.label}
                className={`adml-item ${item.children ? 'has-sub' : ''} ${isOpen ? 'is-open' : ''}`}
              >
                <NavLink to={item.to} end={item.end} className="adml-link">
                  {item.label}
                </NavLink>
                {item.children && (
                  <div className="adml-sub">
                    {item.children.map((child) => (
                      <NavLink key={child.to} to={child.to} end={child.end} className="adml-link">
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div className="adml-item">
            <NavLink to="/" end className="adml-link">
              返回前台
            </NavLink>
          </div>
        </nav>
      </aside>

      <div className="adml-content">
        <Outlet />
        <footer className="adm-footer">
          Phonecase Enterprise ERP &amp; Inventory Management System &copy; 2026. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
