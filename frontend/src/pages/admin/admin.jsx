import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Search } from 'lucide-react';

/* 後台專用樣式（全部以 .adm 為前綴，避免影響其他頁面），由 AdminLayout 載入 */
export const adminStyles = `
.adm {
  --adm-bg: #ffffff;
  --adm-card: #ffffff;
  --adm-paper: #f5f2ed;
  --adm-soft: #f7f9fb;
  --adm-border: #e5eaf0;
  --adm-border-soft: #eef1f4;
  --adm-text: #1d3557;
  --adm-navy: #122b50;
  --adm-muted: #6d7b8c;
  --adm-faint: #9aa5b1;
  --adm-coral: #ff625d;
  --adm-coral-dark: #e9504b;
  --adm-coral-soft: #fff5f3;
  --adm-warn: #b7791f;
  --adm-warn-soft: #fdf6ea;
  --adm-danger: #bd403d;
  --adm-danger-soft: #fff0ee;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
  background: var(--adm-bg);
  color: var(--adm-text);
  font-family: "Noto Sans TC", "Microsoft JhengHei", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
}
.adm *, .adm *::before, .adm *::after { box-sizing: border-box; }
.adm h1, .adm h2, .adm h3, .adm h4, .adm p { margin: 0; }
.adm button, .adm input, .adm select { font: inherit; }
.adm button { cursor: pointer; }
.adm svg { flex-shrink: 0; }

/* ---------- Header（比照商城首頁 hero 區塊） ---------- */
.adm-header {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 4% 0;
}
.adm-header-inner {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 36px 44px;
  border-radius: 18px;
  background: linear-gradient(110deg, var(--adm-paper), #e9eef1);
}
.adm-eyebrow {
  display: block;
  margin-bottom: 8px;
  color: var(--adm-coral);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 3px;
}
.adm-brand h1 { color: var(--adm-navy); font-size: clamp(28px, 4vw, 40px); font-weight: 900; line-height: 1.2; }
.adm-brand p { margin-top: 8px; color: var(--adm-muted); }
.adm-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid var(--adm-border);
  border-radius: 999px;
  background: #fff;
  color: var(--adm-navy);
  font-size: 13px;
  white-space: nowrap;
}
.adm-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3aa66b;
  animation: adm-pulse 2s ease-in-out infinite;
}
@keyframes adm-pulse { 50% { opacity: 0.4; } }

/* ---------- Layout ---------- */
.adm-main {
  flex: 1;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 4% 64px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.adm-top-grid {
  display: grid;
  grid-template-columns: 7fr 5fr;
  gap: 24px;
  align-items: stretch;
}
.adm-card {
  background: var(--adm-card);
  border: 1px solid var(--adm-border);
  border-radius: 14px;
}
.adm-card-pad { padding: 24px 28px; display: flex; flex-direction: column; }
.adm-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 20px;
}
.adm-card-head h2 { color: var(--adm-navy); font-size: 22px; font-weight: 800; }
.adm-hint { font-size: 13px; color: var(--adm-muted); }

/* ---------- Sales stats ---------- */
.adm-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.adm-stat-box { border-radius: 12px; padding: 18px; border: 1px solid var(--adm-border); background: var(--adm-soft); }
.adm-stat-box.today { background: var(--adm-coral-soft); border-color: #ffdcd9; }
.adm-stat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--adm-border);
}
.adm-stat-box.today .adm-stat-head { border-color: #ffdcd9; }
.adm-stat-title { color: var(--adm-navy); font-size: 15px; font-weight: 800; }
.adm-stat-tag {
  padding: 2px 10px;
  border-radius: 999px;
  background: #fff;
  color: var(--adm-coral);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
}
.adm-stat-items { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px; }
.adm-stat-label { color: var(--adm-muted); }
.adm-stat-value { color: var(--adm-navy); font-size: 20px; font-weight: 800; }
.adm-stat-best { color: var(--adm-coral); font-size: 13px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ---------- Sales trend ---------- */
.adm-trend {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-top: 16px;
  padding: 18px;
  border-radius: 12px;
  border: 1px solid var(--adm-border);
}
.adm-trend-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
.adm-trend-sum { margin-left: 10px; color: var(--adm-muted); font-size: 12px; }
.adm-trend-tabs { display: flex; gap: 4px; padding: 3px; border-radius: 999px; background: var(--adm-soft); }
.adm-trend-tab {
  padding: 4px 14px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--adm-muted);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.adm-trend-tab.is-active { background: #fff; color: var(--adm-coral); box-shadow: 0 1px 3px rgba(18, 43, 80, 0.12); }
.adm-trend-chart { position: relative; flex: 1; display: flex; align-items: flex-end; min-height: 160px; }
.adm-trend-chart svg { width: 100%; height: auto; display: block; overflow: visible; }
.adm-trend-grid { stroke: var(--adm-border-soft); stroke-width: 1; }
.adm-trend-axis { fill: var(--adm-faint); font-size: 11px; }
.adm-trend-bar { fill: #ffb3af; transition: fill 0.15s; }
.adm-trend-bar.is-hover { fill: var(--adm-coral); }
.adm-trend-tip {
  position: absolute;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--adm-navy);
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
}
.adm-trend-tip strong { font-size: 12px; }

/* ---------- Document ops ---------- */
.adm-doc-list { display: flex; flex-direction: column; gap: 10px; }
.adm-doc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--adm-soft);
  border: 1px solid transparent;
  transition: border-color 0.15s, background-color 0.15s;
}
.adm-doc-row:hover { border-color: #ffdcd9; background: var(--adm-coral-soft); }
.adm-doc-name { min-width: 80px; color: var(--adm-navy); font-size: 14px; font-weight: 700; }
.adm-doc-btns { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }

/* ---------- Buttons ---------- */
.adm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 999px;
  border: 1px solid transparent;
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;
  white-space: nowrap;
}
.adm-btn-lg { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 800; }
.adm-btn-primary { background: var(--adm-coral); color: #fff; }
.adm-btn-primary:hover { background: var(--adm-coral-dark); }
.adm-btn-white { background: #fff; color: var(--adm-navy); border-color: var(--adm-border); }
.adm-btn-white:hover { border-color: var(--adm-coral); color: var(--adm-coral); }
.adm-btn-gray { background: #f1f3f5; color: var(--adm-muted); }
.adm-btn-gray:hover { background: var(--adm-border); color: var(--adm-navy); }
.adm-btn-dark { background: var(--adm-navy); color: #fff; }
.adm-btn-dark:hover { background: #0b1d38; }
.adm-btn-danger { background: var(--adm-danger); color: #fff; }
.adm-btn-danger:hover { background: #a33532; }
.adm-btn-danger-soft { background: #fff; color: var(--adm-danger); border-color: #f0bbb8; }
.adm-btn-danger-soft:hover { background: var(--adm-danger-soft); }
.adm-btn-soft { background: var(--adm-coral-soft); color: var(--adm-coral); border-color: #ffdcd9; }
.adm-btn-soft:hover { background: #ffe9e6; }

/* ---------- Report tables ---------- */
.adm-section { overflow: hidden; }
.adm-section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 22px 28px;
  border-bottom: 1px solid var(--adm-border);
}
.adm-section-title h2 { color: var(--adm-navy); font-size: 22px; font-weight: 800; }
.adm-section-title p { margin-top: 2px; font-size: 13px; color: var(--adm-muted); }
.adm-pill { font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 999px; border: 1px solid; }
.adm-pill.warn { background: var(--adm-warn-soft); color: var(--adm-warn); border-color: #f1dcb4; }
.adm-pill.danger { background: var(--adm-danger-soft); color: var(--adm-danger); border-color: #f0bbb8; }
.adm-table-wrap { overflow: auto; max-height: 480px; }
.adm-table-wrap .adm-table th { position: sticky; top: 0; z-index: 1; }
.adm-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
.adm-table th {
  padding: 12px;
  background: #fff;
  color: var(--adm-muted);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  border-bottom: 1px solid var(--adm-border);
}
.adm-table td { padding: 12px; color: var(--adm-text); border-bottom: 1px solid var(--adm-border-soft); }
.adm-table tbody tr:hover { background: var(--adm-soft); }
.adm-table .c { text-align: center; }
.adm-table .r { text-align: right; }
.adm-table .mono { font-family: ui-monospace, Consolas, monospace; font-weight: 600; color: var(--adm-navy); }
.adm-empty { padding: 32px 16px; text-align: center; color: var(--adm-muted); }

/* ---------- Header links / sync status ---------- */
.adm-header-side { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
.adm-links { display: flex; gap: 16px; font-size: 13px; font-weight: 700; }
.adm-links a { color: var(--adm-navy); text-decoration: none; }
.adm-links a:hover { color: var(--adm-coral); }
.adm-status.syncing .adm-dot { background: #e0a43a; }
.adm-status.failed .adm-dot { background: var(--adm-danger); animation: none; }

/* ---------- CRM ---------- */
.adm-input.adm-crm-search { width: min(300px, 100%); }
.adm-crm-tiles {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  padding: 20px 28px 0;
}
.adm-crm-tile { padding: 14px 16px; border-radius: 12px; background: var(--adm-soft); }
.adm-crm-tile span { display: block; color: var(--adm-muted); font-size: 12px; }
.adm-crm-tile strong { color: var(--adm-navy); font-size: 22px; font-weight: 800; }
.adm-crm-tile small { margin-left: 2px; color: var(--adm-muted); font-size: 12px; font-weight: 600; }
.adm-crm-tabs { display: flex; gap: 8px; overflow-x: auto; padding: 18px 28px; border-bottom: 1px solid var(--adm-border); }
.adm-crm-tab {
  flex: 0 0 auto;
  padding: 7px 16px;
  border: 1px solid var(--adm-border);
  border-radius: 999px;
  background: #fff;
  color: var(--adm-navy);
  font-size: 13px;
}
.adm-crm-tab span { margin-left: 4px; color: var(--adm-faint); font-size: 12px; }
.adm-crm-tab:hover, .adm-crm-tab.is-active { border-color: var(--adm-coral); background: var(--adm-coral); color: #fff; }
.adm-crm-tab:hover span, .adm-crm-tab.is-active span { color: #ffe1df; }
.adm-sub { display: block; color: var(--adm-faint); font-size: 11px; }
.adm-tag { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; white-space: nowrap; }
.adm-tag.vip { background: var(--adm-coral); color: #fff; }
.adm-tag.regular { background: #eef2f7; color: var(--adm-navy); }
.adm-tag.new { background: #eaf7ef; color: #247341; }
.adm-tag.dormant { background: var(--adm-warn-soft); color: var(--adm-warn); }
.adm-tag.none { background: #f1f3f5; color: var(--adm-muted); }
.adm-tag.ok { background: #eaf7ef; color: #247341; }
.adm-tag.off { background: var(--adm-danger-soft); color: var(--adm-danger); }

/* ---------- Footer ---------- */
.adm-footer {
  padding: 24px 16px;
  text-align: center;
  font-size: 12px;
  color: var(--adm-muted);
  border-top: 1px solid var(--adm-border);
}

/* ---------- Modal ---------- */
.adm-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(18, 43, 80, 0.35);
  backdrop-filter: blur(3px);
}
.adm-overlay.top { z-index: 50; background: rgba(18, 43, 80, 0.5); }
.adm-modal {
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--adm-border);
  border-radius: 18px;
  box-shadow: 0 18px 60px rgba(18, 43, 80, 0.18);
}
.adm-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--adm-border);
}
.adm-modal-head h3 { color: var(--adm-navy); font-size: 20px; font-weight: 800; }
.adm-close { display: flex; padding: 4px; border: 0; border-radius: 6px; background: none; color: var(--adm-muted); }
.adm-close:hover { color: var(--adm-coral); }
.adm-modal-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
.adm-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--adm-paper);
  color: var(--adm-navy);
  font-size: 13px;
}
.adm-notice-time {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #fff;
  color: var(--adm-muted);
}
.adm-form { display: flex; flex-direction: column; gap: 16px; }
.adm-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; font-size: 13px; }
.adm-label { display: block; margin-bottom: 6px; font-weight: 700; color: var(--adm-navy); }
.adm-input,
.adm-select {
  width: 100%;
  padding: 10px 12px;
  font-size: 13px;
  color: var(--adm-text);
  background: #fff;
  border: 1px solid #ccd5df;
  border-radius: 7px;
  outline: none;
}
.adm-input::placeholder { color: var(--adm-faint); }
.adm-input:focus,
.adm-select:focus { border-color: var(--adm-coral); box-shadow: 0 0 0 3px rgba(255, 98, 93, 0.15); }
.adm-input[readonly] { background: var(--adm-soft); color: var(--adm-muted); border-color: var(--adm-border); }
.adm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--adm-border);
}
.adm-search-bar { display: flex; align-items: center; gap: 8px; }
.adm-search-bar .adm-input { flex: 1; }
.adm-search-bar .adm-select { width: auto; font-family: ui-monospace, Consolas, monospace; }
.adm-result { border: 1px solid var(--adm-border); border-radius: 12px; overflow-x: auto; }
.adm-placeholder {
  padding: 36px;
  text-align: center;
  font-size: 13px;
  color: var(--adm-muted);
  border: 1px dashed var(--adm-border);
  border-radius: 14px;
}
.adm-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  font-size: 13px;
  background: var(--adm-soft);
  border-radius: 12px;
}
.adm-detail h4 { padding-bottom: 10px; color: var(--adm-navy); font-weight: 800; border-bottom: 1px solid var(--adm-border); }
.adm-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.adm-detail-label { display: block; color: var(--adm-muted); }
.adm-detail-mono { font-family: ui-monospace, Consolas, monospace; font-weight: 700; color: var(--adm-navy); }
.adm-detail .adm-actions { border-top: 0; padding-top: 0; }

/* ---------- Delete confirm ---------- */
.adm-confirm {
  width: 100%;
  max-width: 448px;
  padding: 28px;
  background: #fff;
  border: 1px solid var(--adm-border);
  border-radius: 18px;
  box-shadow: 0 18px 60px rgba(18, 43, 80, 0.22);
}
.adm-confirm h4 { margin-bottom: 12px; color: var(--adm-navy); font-size: 20px; font-weight: 800; }
.adm-confirm p { margin-bottom: 20px; font-size: 13px; line-height: 1.8; color: var(--adm-muted); }
.adm-confirm strong { font-family: ui-monospace, Consolas, monospace; color: var(--adm-danger); }

/* ---------- RWD ---------- */
@media (max-width: 1024px) {
  .adm-top-grid { grid-template-columns: 1fr; }
  .adm-crm-tiles { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .adm-header, .adm-main { padding-left: 16px; padding-right: 16px; }
  .adm-header-inner { flex-direction: column; align-items: flex-start; padding: 28px 22px; }
  .adm-header-side { align-items: flex-start; }
  .adm-crm-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 16px 18px 0; }
  .adm-crm-tabs { padding: 14px 18px; }
  .adm-card-pad, .adm-section-head { padding: 20px 18px; }
  .adm-stats-grid, .adm-form-grid, .adm-detail-grid { grid-template-columns: 1fr; }
  .adm-doc-row { flex-direction: column; align-items: flex-start; }
  .adm-doc-btns { justify-content: flex-start; }
  .adm-search-bar { flex-wrap: wrap; }
}
`;

// 瀏覽器當地日期 yyyy-MM-dd（不用 toISOString，避免 UTC 時差造成日期少一天）
export const getLocalDateString = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

export const formatNumber = (value) => Number(value || 0).toLocaleString();

const emptyForm = {
  orderNo: '',
  productName: '',
  productCode: '',
  brand: '',
  color: '',
  model: '',
  quantity: 1,
  unitPrice: 0,
  targetName: ''
};

export default function App() {
  const [mainModalOpen, setMainModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentType, setCurrentType] = useState('訂單');
  const [currentAction, setCurrentAction] = useState('新增');

  const [formData, setFormData] = useState(emptyForm);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchOperator, setSearchOperator] = useState('=');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState('');

  // 單據新增、修改、刪除成功後遞增，讓銷售統計重新讀取
  const [statsVersion, setStatsVersion] = useState(0);
  const refreshStats = () => setStatsVersion((version) => version + 1);

  // 開啟後台時先同步商城資料（商品規格 → 庫存、商城訂單 → 訂單），完成後重新讀取各區塊
  const [syncState, setSyncState] = useState('syncing');
  useEffect(() => {
    fetch('/api/admin/sync', { method: 'POST' })
      .then((response) => setSyncState(response.ok ? 'done' : 'failed'))
      .catch(() => setSyncState('failed'))
      .finally(refreshStats);
  }, []);

  const openDocModal = (type, action) => {
    setCurrentType(type);
    setCurrentAction(action);
    setSearchResults([]);
    setHasSearched(false);
    setSearchKeyword('');
    setFormData(emptyForm);
    setMainModalOpen(true);
  };

  const closeMainModal = () => {
    setMainModalOpen(false);
    setSelectedItem(null);
  };

  const openDeleteConfirm = (docId) => {
    setPendingDeleteId(docId);
    setDeleteModalOpen(true);
  };

  const closeDeleteConfirm = () => {
    setDeleteModalOpen(false);
    setPendingDeleteId('');
  };

  // 讀取後端回傳的錯誤訊息，例如「單號已存在」「庫存不足」
  const getErrorMessage = async (response) => {
    const err = await response.json().catch(() => ({}));
    return err.message || Object.values(err).join('、') || `HTTP ${response.status}`;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      docType: currentType,
      orderNo: formData.orderNo,
      productName: formData.productName,
      productNo: formData.productCode,
      brand: formData.brand,
      color: formData.color,
      model: formData.model,
      quantity: Number(formData.quantity) || 0,
      unitPrice: Number(formData.unitPrice) || 0,
      customerName: formData.targetName
    };

    try {
      const response = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(`【${currentType}】新增成功並寫入資料庫！`);
        refreshStats();
        closeMainModal();
      } else {
        alert(`新增失敗：${await getErrorMessage(response)}`);
      }
    } catch (error) {
      console.error('Error creating document:', error);
      alert('無法連線至 Java 後端 (http://localhost:8080)');
    }
  };

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `/api/admin/documents/search?docType=${encodeURIComponent(currentType)}&keyword=${encodeURIComponent(
          searchKeyword
        )}&operator=${encodeURIComponent(searchOperator)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      } else {
        setSearchResults([]);
        alert(`查詢失敗：${await getErrorMessage(response)}`);
      }
    } catch (error) {
      console.error('Error searching documents:', error);
      setSearchResults([]);
      alert('無法連線至 Java 後端，查詢失敗');
    }
    setHasSearched(true);
  };

  const handleUpdateSubmit = async (item) => {
    try {
      const response = await fetch(
        `/api/admin/documents/${encodeURIComponent(item.orderNo)}?docType=${encodeURIComponent(currentType)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        }
      );
      if (response.ok) {
        alert(`單據 ${item.orderNo} 已成功修改並傳送至資料庫！`);
        setSelectedItem(null);
        refreshStats();
        handleSearch();
      } else {
        alert(`修改失敗：${await getErrorMessage(response)}`);
      }
    } catch (error) {
      console.error('Error updating document:', error);
      alert('無法連線至 Java 後端，更新失敗');
    }
  };

  const executeDelete = async () => {
    try {
      const response = await fetch(
        `/api/admin/documents/${encodeURIComponent(pendingDeleteId)}?docType=${encodeURIComponent(currentType)}`,
        { method: 'DELETE' }
      );
      if (response.ok) {
        alert(`單據 ${pendingDeleteId} 已成功從資料庫刪除！`);
        refreshStats();
      } else {
        alert(`單據 ${pendingDeleteId} 刪除失敗：${await getErrorMessage(response)}`);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('無法連線至 Java 後端，刪除失敗');
    } finally {
      closeDeleteConfirm();
      closeMainModal();
    }
  };

  return (
    <>
      <AdminPageTitle title="Dashboard">
        <span className={`adm-status ${syncState}`}>
          <span className="adm-dot"></span>
          {syncLabels[syncState]}
        </span>
      </AdminPageTitle>

      <main className="adm-main">
        <OverviewSection refreshKey={statsVersion} />

        <div className="adm-top-grid">
          <SalesStatsCard refreshKey={statsVersion} />
          <DocumentOpsCard onOpenModal={openDocModal} />
        </div>

        <CrmSection refreshKey={statsVersion} />
        <InventoryReportTable refreshKey={statsVersion} />
        <OrderReportTable refreshKey={statsVersion} />
      </main>

      {mainModalOpen && (
        <MainModal
          type={currentType}
          action={currentAction}
          onClose={closeMainModal}
          formData={formData}
          setFormData={setFormData}
          onCreateSubmit={handleCreateSubmit}
          searchKeyword={searchKeyword}
          setSearchKeyword={setSearchKeyword}
          searchOperator={searchOperator}
          setSearchOperator={setSearchOperator}
          onSearch={handleSearch}
          searchResults={searchResults}
          hasSearched={hasSearched}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          onUpdateSubmit={handleUpdateSubmit}
          onOpenDelete={openDeleteConfirm}
        />
      )}

      {deleteModalOpen && (
        <DeleteConfirmModal
          targetId={pendingDeleteId}
          onCancel={closeDeleteConfirm}
          onConfirm={executeDelete}
        />
      )}
    </>
  );
}

const syncLabels = {
  syncing: '同步商城資料中…',
  done: '已同步商城資料',
  failed: '商城資料同步失敗'
};

// 各後台分頁共用的標題列（比照設計稿：左側大標題，右側放狀態或操作）
export function AdminPageTitle({ title, desc, children }) {
  return (
    <header className="adm-page-title">
      <div>
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
      </div>
      {children && <div className="adm-page-title-side">{children}</div>}
    </header>
  );
}

// 商城訂單狀態（order.order_status）顯示文字
export const orderStatusLabels = {
  PENDING_PAYMENT: '未結帳',
  PENDING_SHIPMENT: '待出貨',
  PAID: '已付款',
  SHIPPED: '已出貨',
  COMPLETED: '已完成',
  CANCELLED: '已取消'
};

export const orderStatusClass = {
  PENDING_PAYMENT: 'warn',
  PENDING_SHIPMENT: 'new',
  PAID: 'new',
  SHIPPED: 'regular',
  COMPLETED: 'ok',
  CANCELLED: 'off'
};

// Dashboard 上方總覽：今日訂單、本月營業額、商品數、會員數，以及最近 5 筆商城訂單
function OverviewSection({ refreshKey }) {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/overview?date=${getLocalDateString()}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setOverview(data);
        setError(false);
      })
      .catch((err) => {
        console.error('Error loading overview:', err);
        setOverview(null);
        setError(true);
      });
  }, [refreshKey]);

  const kpis = [
    ['今日訂單', overview && formatNumber(overview.todayOrders)],
    ['本月營業額', overview && `NT$${formatNumber(overview.monthRevenue)}`],
    ['商品數', overview && formatNumber(overview.productCount)],
    ['會員數', overview && formatNumber(overview.memberCount)]
  ];

  return (
    <>
      <div className="adm-kpis">
        {kpis.map(([label, value]) => (
          <div key={label} className="adm-kpi">
            <span>{label}</span>
            <strong>{value ?? '-'}</strong>
          </div>
        ))}
      </div>

      <section className="adm-recent">
        <div className="adm-recent-head">
          <h2>最近訂單</h2>
          <Link to="/admin/orders">查看所有訂單</Link>
        </div>
        <table className="adm-table adm-recent-table">
          <thead>
            <tr>
              <th>訂單編號</th>
              <th>會員</th>
              <th className="r">金額</th>
              <th>狀態</th>
            </tr>
          </thead>
          <tbody>
            {(overview?.recentOrders || []).length > 0 ? (
              overview.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="mono">#{order.orderNumber}</td>
                  <td>{order.memberName || order.receiverName || '-'}</td>
                  <td className="r">NT${formatNumber(order.totalAmount)}</td>
                  <td>
                    <span className={`adm-tag ${orderStatusClass[order.orderStatus] || ''}`}>
                      {orderStatusLabels[order.orderStatus] || order.orderStatus}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="adm-empty">
                  {error ? '無法取得訂單資料' : '目前沒有訂單'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}

function StatBox({ variant, title, tag, prefix, data }) {
  // 銷售數量相同的最佳單品全部列出
  const bestSellers = (data?.bestProducts || []).map(
    (product) => `${product.productName}（${formatNumber(data.bestQuantity)} 個）`
  );

  return (
    <div className={`adm-stat-box ${variant}`}>
      <div className="adm-stat-head">
        <span className="adm-stat-title">{title}</span>
        <span className="adm-stat-tag">{tag}</span>
      </div>
      <div className="adm-stat-items">
        <div>
          <p className="adm-stat-label">{prefix}銷售金額</p>
          <p className="adm-stat-value">{data ? `$${formatNumber(data.amount)}` : '-'}</p>
        </div>
        <div>
          <p className="adm-stat-label">{prefix}銷售數量</p>
          <p className="adm-stat-value">{data ? formatNumber(data.quantity) : '-'}</p>
        </div>
        <div>
          <p className="adm-stat-label">{prefix}訂單數量</p>
          <p className="adm-stat-value">{data ? formatNumber(data.orders) : '-'}</p>
        </div>
        <div>
          <p className="adm-stat-label">最佳銷售單品</p>
          {bestSellers.length > 0 ? (
            bestSellers.map((bestSeller) => (
              <p key={bestSeller} className="adm-stat-best" title={bestSeller}>
                {bestSeller}
              </p>
            ))
          ) : (
            <p className="adm-stat-best">-</p>
          )}
        </div>
      </div>
    </div>
  );
}

// 銷售統計只計算訂單，日期以瀏覽器當地日期送給後端
function SalesStatsCard({ refreshKey }) {
  const [stats, setStats] = useState(null);
  const [statsDate, setStatsDate] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const date = getLocalDateString();
    setStatsDate(date);

    fetch(`/api/admin/documents/stats?date=${date}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setStats(data);
        setLoadFailed(false);
      })
      .catch((error) => {
        console.error('Error loading sales stats:', error);
        setStats(null);
        setLoadFailed(true);
      });
  }, [refreshKey]);

  return (
    <div className="adm-card adm-card-pad">
      <div className="adm-card-head">
        <h2>銷售統計</h2>
        <span className="adm-hint">{loadFailed ? '無法取得銷售數據' : `統計日期：${statsDate}`}</span>
      </div>

      <div className="adm-stats-grid">
        <StatBox
          variant="today"
          title="今日銷售數據"
          tag="Today"
          prefix="今日"
          data={stats?.today}
        />
        <StatBox
          variant="month"
          title="本月銷售數據"
          tag="This Month"
          prefix="本月"
          data={stats?.month}
        />
      </div>

      <SalesTrendChart refreshKey={refreshKey} />
    </div>
  );
}

// 銷售趨勢圖：每日 = 近 30 天、每月 = 近 12 個月，長條為銷售金額
const trendModes = [
  ['daily', '每日'],
  ['monthly', '每月']
];

function SalesTrendChart({ refreshKey }) {
  const [trend, setTrend] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [mode, setMode] = useState('daily');
  const [hoverIndex, setHoverIndex] = useState(null);

  useEffect(() => {
    fetch(`/api/admin/documents/stats/trend?date=${getLocalDateString()}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setTrend(data);
        setLoadFailed(false);
      })
      .catch((error) => {
        console.error('Error loading sales trend:', error);
        setTrend(null);
        setLoadFailed(true);
      });
  }, [refreshKey]);

  const points = trend?.[mode] || [];
  const total = points.reduce((sum, point) => sum + point.amount, 0);
  const maxAmount = Math.max(...points.map((point) => point.amount), 0);

  // 座標軸上限取整，讓刻度好讀
  const step = maxAmount > 0 ? 10 ** Math.floor(Math.log10(maxAmount)) : 1;
  const axisMax = maxAmount > 0 ? Math.ceil(maxAmount / step) * step : 1000;
  const ticks = [0, 0.5, 1].map((ratio) => axisMax * ratio);

  const width = 640;
  const height = 200;
  const pad = { top: 12, right: 8, bottom: 26, left: 52 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const slot = points.length ? plotW / points.length : plotW;
  const barW = Math.max(2, slot * 0.62);
  const y = (value) => pad.top + plotH - (value / axisMax) * plotH;
  const shortLabel = (label) => (mode === 'daily' ? label.slice(5).replace('-', '/') : label.replace('-', '/'));
  // 每日顯示約 6 個日期標籤，每月全部顯示
  const labelEvery = mode === 'daily' ? 5 : 1;
  const hovered = hoverIndex != null ? points[hoverIndex] : null;

  return (
    <div className="adm-trend">
      <div className="adm-trend-head">
        <div>
          <span className="adm-stat-title">銷售趨勢</span>
          <span className="adm-trend-sum">
            {mode === 'daily' ? '近 30 天' : '近 12 個月'}合計 ${formatNumber(total)}
          </span>
        </div>
        <div className="adm-trend-tabs">
          {trendModes.map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setMode(key);
                setHoverIndex(null);
              }}
              className={`adm-trend-tab ${mode === key ? 'is-active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="adm-trend-chart">
        {loadFailed ? (
          <p className="adm-empty">無法取得銷售趨勢</p>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="銷售金額趨勢圖">
            {ticks.map((tick) => (
              <g key={tick}>
                <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} className="adm-trend-grid" />
                <text x={pad.left - 8} y={y(tick) + 4} textAnchor="end" className="adm-trend-axis">
                  {tick >= 10000 ? `${formatNumber(tick / 1000)}k` : formatNumber(tick)}
                </text>
              </g>
            ))}
            {points.map((point, index) => {
              const x = pad.left + slot * index + (slot - barW) / 2;
              const barH = pad.top + plotH - y(point.amount);
              return (
                <g
                  key={point.label}
                  onMouseEnter={() => setHoverIndex(index)}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  <rect x={pad.left + slot * index} y={pad.top} width={slot} height={plotH} fill="transparent" />
                  <rect
                    x={x}
                    y={pad.top + plotH - Math.max(barH, point.amount > 0 ? 2 : 0)}
                    width={barW}
                    height={Math.max(barH, point.amount > 0 ? 2 : 0)}
                    rx={Math.min(3, barW / 2)}
                    className={`adm-trend-bar ${hoverIndex === index ? 'is-hover' : ''}`}
                  />
                  {(index % labelEvery === 0 || index === points.length - 1) && (
                    <text x={x + barW / 2} y={height - 8} textAnchor="middle" className="adm-trend-axis">
                      {shortLabel(point.label)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
        {hovered && (
          <div
            className="adm-trend-tip"
            style={{
              left: `${((pad.left + slot * (hoverIndex + 0.5)) / width) * 100}%`,
              // 右半邊的長條提示框往左展開，避免超出卡片
              transform: hoverIndex >= points.length / 2 ? 'translateX(calc(-100% - 8px))' : 'translateX(8px)'
            }}
          >
            <strong>{hovered.label}</strong>
            <span>銷售金額 ${formatNumber(hovered.amount)}</span>
            <span>
              銷售數量 {formatNumber(hovered.quantity)}・訂單 {formatNumber(hovered.orders)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentOpsCard({ onOpenModal }) {
  const docTypes = ['庫存', '採購單', '入庫單', '出庫單', '訂單'];

  return (
    <div className="adm-card adm-card-pad">
      <div className="adm-card-head">
        <h2>單據操作管理</h2>
        <span className="adm-hint">營運單據快捷動作</span>
      </div>

      <div className="adm-doc-list">
        {docTypes.map((name) => (
          <div key={name} className="adm-doc-row">
            <span className="adm-doc-name">{name}</span>
            <div className="adm-doc-btns">
              <button onClick={() => onOpenModal(name, '新增')} className="adm-btn adm-btn-primary">
                新增
              </button>
              <button onClick={() => onOpenModal(name, '查詢')} className="adm-btn adm-btn-white">
                查詢
              </button>
              <button onClick={() => onOpenModal(name, '修改')} className="adm-btn adm-btn-white">
                修改
              </button>
              <button onClick={() => onOpenModal(name, '刪除')} className="adm-btn adm-btn-danger-soft">
                刪除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 簡易 CRM：會員消費概況與分群（VIP / 一般 / 新客 / 非活躍 / 未下單）
const crmSegments = ['全部', 'VIP', '一般', '新客', '非活躍', '未下單'];
const segmentClass = { VIP: 'vip', 一般: 'regular', 新客: 'new', 非活躍: 'dormant', 未下單: 'none' };

// manage 為 true 時（會員管理頁）多一欄操作，可停權 / 恢復會員
export function CrmSection({ refreshKey, manage = false }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(false);
  const [segment, setSegment] = useState('全部');
  const [keyword, setKeyword] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const toggleStatus = async (customer) => {
    const next = customer.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const verb = next === 'ACTIVE' ? '恢復' : '停權';
    if (!window.confirm(`確定要${verb}會員「${customer.name}」（${customer.customerCode}）嗎？`)) {
      return;
    }
    const response = await fetch(`/api/admin/members/${customer.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next })
    }).catch(() => null);
    if (response?.ok) {
      setReloadKey((key) => key + 1);
    } else {
      const err = await response?.json().catch(() => ({}));
      alert(`${verb}失敗：${err?.message || '無法連線至後端'}`);
    }
  };

  useEffect(() => {
    fetch(`/api/admin/crm?date=${getLocalDateString()}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setReport(data);
        setError(false);
      })
      .catch((err) => {
        console.error('Error loading CRM:', err);
        setReport(null);
        setError(true);
      });
  }, [refreshKey, reloadKey]);

  const summary = report?.summary;
  const word = keyword.trim().toLowerCase();
  const customers = (report?.customers || []).filter(
    (customer) =>
      (segment === '全部' || customer.segment === segment) &&
      (!word ||
        [customer.name, customer.account, customer.email, customer.phone, customer.customerCode].some((value) =>
          (value || '').toLowerCase().includes(word)
        ))
  );
  const countOf = (name) =>
    name === '全部' ? report?.customers.length ?? 0 : (report?.customers || []).filter((c) => c.segment === name).length;

  const tiles = [
    ['會員總數', summary?.members, '位'],
    ['有消費會員', summary?.buyers, '位'],
    ['本月新會員', summary?.newMembers, '位'],
    ['VIP 會員', summary?.vip, '位'],
    ['平均客單價', summary ? `$${formatNumber(summary.averageOrder)}` : null, ''],
    ['回購率', summary?.repeatRate, '%']
  ];

  return (
    <section className="adm-card adm-section">
      <div className="adm-section-head">
        <div className="adm-section-title">
          <h2>會員 CRM</h2>
          <p>依會員消費紀錄自動分群：VIP 累計消費滿 $30,000、非活躍為超過 60 天未下單、新客首購 30 天內</p>
        </div>
        <input
          type="text"
          placeholder="搜尋姓名、帳號、電話或會員代號"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="adm-input adm-crm-search"
        />
      </div>

      <div className="adm-crm-tiles">
        {tiles.map(([label, value, unit]) => (
          <div key={label} className="adm-crm-tile">
            <span>{label}</span>
            <strong>
              {value ?? '-'}
              {value != null && unit && <small>{unit}</small>}
            </strong>
          </div>
        ))}
      </div>

      <div className="adm-crm-tabs">
        {crmSegments.map((name) => (
          <button
            key={name}
            onClick={() => setSegment(name)}
            className={`adm-crm-tab ${segment === name ? 'is-active' : ''}`}
          >
            {name} <span>{countOf(name)}</span>
          </button>
        ))}
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>會員代號</th>
              <th>姓名</th>
              <th>帳號 / Email</th>
              <th>電話</th>
              <th className="r">訂單數</th>
              <th className="r">累計消費</th>
              <th className="r">平均客單價</th>
              <th>最近下單</th>
              <th className="c">分群</th>
              <th className="c">狀態</th>
              {manage && <th className="c">操作</th>}
            </tr>
          </thead>
          <tbody>
            {customers.length > 0 ? (
              customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="mono">{customer.customerCode}</td>
                  <td>
                    <strong>{customer.name}</strong>
                  </td>
                  <td>
                    {customer.account}
                    <span className="adm-sub">{customer.email}</span>
                  </td>
                  <td>{customer.phone || '-'}</td>
                  <td className="r">{formatNumber(customer.orders)}</td>
                  <td className="r">${formatNumber(customer.spending)}</td>
                  <td className="r">{customer.orders ? `$${formatNumber(customer.averageOrder)}` : '-'}</td>
                  <td>
                    {customer.lastOrderDate || '-'}
                    {customer.daysSinceLastOrder != null && (
                      <span className="adm-sub">{customer.daysSinceLastOrder} 天前</span>
                    )}
                  </td>
                  <td className="c">
                    <span className={`adm-tag ${segmentClass[customer.segment]}`}>{customer.segment}</span>
                  </td>
                  <td className="c">
                    {customer.status === 'ACTIVE' ? (
                      <span className="adm-tag ok">正常</span>
                    ) : (
                      <span className="adm-tag off">停權</span>
                    )}
                  </td>
                  {manage && (
                    <td className="c">
                      <button
                        onClick={() => toggleStatus(customer)}
                        className={`adm-btn ${customer.status === 'ACTIVE' ? 'adm-btn-danger-soft' : 'adm-btn-soft'}`}
                      >
                        {customer.status === 'ACTIVE' ? '停權' : '恢復'}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={manage ? 11 : 10} className="adm-empty">
                  {error ? '無法取得會員資料' : '沒有符合條件的會員'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// 讀取異常報告資料，refreshKey 改變時重新讀取；失敗時 error 為 true
function useReportData(url, refreshKey) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setRows(data);
        setError(false);
      })
      .catch((err) => {
        console.error('Error loading report:', err);
        setRows([]);
        setError(true);
      });
  }, [url, refreshKey]);

  return { rows, error };
}

const formatDateTime = (value) => (value ? value.replace('T', ' ').slice(0, 16) : '-');

// rows：每列為 { key, cells }，cells 依 columns 的順序排列
function ReportTable({ color, title, desc, badge, columns, rows = [], error = false }) {
  return (
    <section className="adm-card adm-section">
      <div className="adm-section-head">
        <div className="adm-section-title">
          <h2>{title}</h2>
          <p>{desc}</p>
        </div>
        <span className={`adm-pill ${color}`}>{badge}</span>
      </div>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              {columns.map(([label, align]) => (
                <th key={label} className={align}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.key}>
                  {row.cells.map((cell, index) => (
                    <td key={columns[index][0]} className={columns[index][1]}>
                      {cell ?? '-'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="adm-empty">
                  {error ? '無法取得資料' : '目前沒有資料'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// 庫存異常：庫存數量低於安全庫存量
function InventoryReportTable({ refreshKey }) {
  const { rows, error } = useReportData('/api/admin/documents/alerts/inventory', refreshKey);

  return (
    <ReportTable
      color="warn"
      title="庫存異常報告"
      desc="庫存量低於安全庫存值或數據異常項目"
      badge={`共 ${rows.length} 項警示`}
      error={error}
      rows={rows.map((item, index) => ({
        key: item.orderNo,
        cells: [
          index + 1,
          item.productName,
          <span className="mono">{item.orderNo}</span>,
          item.brand,
          item.color,
          item.model,
          formatNumber(item.quantity),
          `$${formatNumber(item.unitPrice)}`,
          `$${formatNumber(item.totalPrice)}`,
          formatNumber(item.safetyStock),
          formatDateTime(item.updatedAt),
          item.quantity <= 0
            ? '缺貨'
            : `低於安全庫存 ${formatNumber(item.safetyStock - item.quantity)} 個`
        ]
      }))}
      columns={[
        ['項次', 'c'],
        ['品名'],
        ['品號'],
        ['品牌'],
        ['顏色'],
        ['型號'],
        ['數量', 'r'],
        ['成本', 'r'],
        ['總計', 'r'],
        ['安全庫存量', 'r'],
        ['更新時間'],
        ['備註']
      ]}
    />
  );
}

// 訂單異常：訂單日期超過 3 天仍未出貨，日期以瀏覽器當地日期送給後端
function OrderReportTable({ refreshKey }) {
  const { rows, error } = useReportData(
    `/api/admin/documents/alerts/orders?date=${getLocalDateString()}`,
    refreshKey
  );

  return (
    <ReportTable
      color="danger"
      title="訂單異常報告"
      desc="訂單日期超過三天仍未出貨之訂單"
      badge={`共 ${rows.length} 筆異常`}
      error={error}
      rows={rows.map(({ order, orderDate, days }, index) => ({
        key: order.orderNo,
        cells: [
          index + 1,
          <span className="mono">{order.orderNo}</span>,
          order.productName,
          order.brand,
          order.color,
          order.model,
          formatNumber(order.quantity),
          `$${formatNumber(order.unitPrice)}`,
          `$${formatNumber(order.totalPrice)}`,
          order.customerName,
          order.customerId,
          `${orderDate} 下單，已 ${days} 天未出貨（${order.status}）`
        ]
      }))}
      columns={[
        ['項次', 'c'],
        ['訂單編號'],
        ['品名'],
        ['品牌'],
        ['顏色'],
        ['型號'],
        ['數量', 'r'],
        ['單價', 'r'],
        ['總計', 'r'],
        ['客戶名稱'],
        ['客戶代號'],
        ['異常原因']
      ]}
    />
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="adm-label">{label}</label>
      {children}
    </div>
  );
}

function MainModal({
  type,
  action,
  onClose,
  formData,
  setFormData,
  onCreateSubmit,
  searchKeyword,
  setSearchKeyword,
  searchOperator,
  setSearchOperator,
  onSearch,
  searchResults,
  hasSearched,
  selectedItem,
  setSelectedItem,
  onUpdateSubmit,
  onOpenDelete
}) {
  const timestamp = new Date().toLocaleString();
  const updateField = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  return (
    <div className="adm-overlay">
      <div className="adm-modal">
        <div className="adm-modal-head">
          <h3>
            {type} - {action}
          </h3>
          <button onClick={onClose} className="adm-close" aria-label="關閉">
            <X size={20} />
          </button>
        </div>

        <div className="adm-modal-body">
          {action === '新增' ? (
            <form onSubmit={onCreateSubmit} className="adm-form">
              <div className="adm-notice">
                <span>新增 {type} 資料表紀錄</span>
                <span className="adm-notice-time">更新時間：{timestamp}</span>
              </div>

              <div className="adm-form-grid">
                <FormField label={`${type}單號 (PK)`}>
                  <input
                    type="text"
                    required
                    placeholder="如：2609190001"
                    value={formData.orderNo}
                    onChange={updateField('orderNo')}
                    className="adm-input"
                  />
                </FormField>
                <FormField label="品名">
                  <input
                    type="text"
                    required
                    placeholder="輸入商品名稱"
                    value={formData.productName}
                    onChange={updateField('productName')}
                    className="adm-input"
                  />
                </FormField>
                {/* 庫存的品號就是上方的主鍵，不需要另外填寫 */}
                {type !== '庫存' && (
                  <FormField label="品號">
                    <input
                      type="text"
                      required
                      placeholder="如：PC-IP15-BK"
                      value={formData.productCode}
                      onChange={updateField('productCode')}
                      className="adm-input"
                    />
                  </FormField>
                )}
                <FormField label="品牌">
                  <input
                    type="text"
                    required
                    placeholder="如：Apple"
                    value={formData.brand}
                    onChange={updateField('brand')}
                    className="adm-input"
                  />
                </FormField>
                <FormField label="顏色">
                  <input
                    type="text"
                    placeholder="如：黑色"
                    value={formData.color}
                    onChange={updateField('color')}
                    className="adm-input"
                  />
                </FormField>
                <FormField label="型號">
                  <input
                    type="text"
                    placeholder="如：iPhone 15"
                    value={formData.model}
                    onChange={updateField('model')}
                    className="adm-input"
                  />
                </FormField>
                <FormField label="數量">
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={updateField('quantity')}
                    className="adm-input"
                  />
                </FormField>
                <FormField label={type === '庫存' ? '成本 ($)' : '單價 ($)'}>
                  <input
                    type="number"
                    value={formData.unitPrice}
                    onChange={updateField('unitPrice')}
                    className="adm-input"
                  />
                </FormField>
                <FormField label="總計 ($)">
                  <input
                    type="number"
                    value={(Number(formData.quantity) || 0) * (Number(formData.unitPrice) || 0)}
                    readOnly
                    className="adm-input"
                  />
                </FormField>
                <FormField label={type === '訂單' ? '客戶名稱/會員名稱' : '供應商名稱'}>
                  <input
                    type="text"
                    placeholder="輸入名稱"
                    value={formData.targetName}
                    onChange={updateField('targetName')}
                    className="adm-input"
                  />
                </FormField>
              </div>

              <div className="adm-actions">
                <button type="button" onClick={onClose} className="adm-btn adm-btn-lg adm-btn-gray">
                  取消
                </button>
                <button type="submit" className="adm-btn adm-btn-lg adm-btn-primary">
                  儲存並匯入資料庫
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="adm-search-bar">
                <input
                  type="text"
                  placeholder={`請輸入 ${type} 單號關鍵字...`}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="adm-input"
                />
                <select
                  value={searchOperator}
                  onChange={(e) => setSearchOperator(e.target.value)}
                  className="adm-select"
                >
                  <option value="=">= (完全比對)</option>
                  <option value="%">% (模糊搜尋)</option>
                  <option value=">=">&gt;= (大於等於)</option>
                  <option value="<=">&lt;= (小於等於)</option>
                  <option value=">">&gt; (大於)</option>
                  <option value="<">&lt; (小於)</option>
                </select>
                <button onClick={onSearch} className="adm-btn adm-btn-lg adm-btn-dark">
                  <Search size={14} /> 搜尋
                </button>
              </div>

              {hasSearched ? (
                <div className="adm-result">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>單號 (Op: {searchOperator})</th>
                        <th>品名</th>
                        <th className="r">數量</th>
                        <th className="r">總計</th>
                        <th className="c">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.length > 0 ? (
                        searchResults.map((item) => (
                          <tr key={item.orderNo}>
                            <td className="mono">{item.orderNo}</td>
                            <td>{item.productName}</td>
                            <td className="r">{item.quantity}</td>
                            <td className="r">${item.totalPrice}</td>
                            <td className="c">
                              {action === '查詢' && (
                                <button
                                  onClick={() => setSelectedItem(item)}
                                  className="adm-btn adm-btn-soft"
                                >
                                  檢視詳細資訊
                                </button>
                              )}
                              {action === '修改' && (
                                <button
                                  onClick={() => setSelectedItem(item)}
                                  className="adm-btn adm-btn-soft"
                                >
                                  修改數據並儲存
                                </button>
                              )}
                              {action === '刪除' && (
                                <button
                                  onClick={() => onOpenDelete(item.orderNo)}
                                  className="adm-btn adm-btn-danger-soft"
                                >
                                  選擇刪除
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="adm-empty">
                            查無符合條件之單據
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="adm-placeholder">請輸入單號條件並點擊「搜尋」按鈕...</div>
              )}

              {selectedItem && (
                <div className="adm-detail">
                  <h4>{action === '修改' ? '【編輯單據資料】' : '【單據詳細資訊】'}</h4>
                  <div className="adm-detail-grid">
                    <div>
                      <span className="adm-detail-label">單號：</span>
                      <span className="adm-detail-mono">{selectedItem.orderNo}</span>
                    </div>
                    <div>
                      <span className="adm-detail-label">品名：</span>
                      {action === '修改' ? (
                        <input
                          type="text"
                          value={selectedItem.productName}
                          onChange={(e) =>
                            setSelectedItem({ ...selectedItem, productName: e.target.value })
                          }
                          className="adm-input"
                        />
                      ) : (
                        <span>{selectedItem.productName}</span>
                      )}
                    </div>
                    <div>
                      <span className="adm-detail-label">數量：</span>
                      {action === '修改' ? (
                        <input
                          type="number"
                          value={selectedItem.quantity}
                          onChange={(e) =>
                            setSelectedItem({ ...selectedItem, quantity: Number(e.target.value) })
                          }
                          className="adm-input"
                        />
                      ) : (
                        <span>{selectedItem.quantity}</span>
                      )}
                    </div>
                    <div>
                      <span className="adm-detail-label">客戶名稱：</span>
                      <span>{selectedItem.customerName || '-'}</span>
                    </div>
                  </div>

                  {action === '修改' && (
                    <div className="adm-actions">
                      <button onClick={() => setSelectedItem(null)} className="adm-btn adm-btn-gray">
                        取消
                      </button>
                      <button onClick={() => onUpdateSubmit(selectedItem)} className="adm-btn adm-btn-primary">
                        儲存更新至資料庫
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ targetId, onCancel, onConfirm }) {
  return (
    <div className="adm-overlay top">
      <div className="adm-confirm">
        <h4>確認刪除單據？</h4>
        <p>
          您確定要刪除單號 <strong>{targetId}</strong> 的這筆單據嗎？此動作將同步直接傳回資料庫刪除且無法復原。
        </p>
        <div className="adm-actions">
          <button onClick={onCancel} className="adm-btn adm-btn-lg adm-btn-gray">
            取消
          </button>
          <button onClick={onConfirm} className="adm-btn adm-btn-lg adm-btn-danger">
            確定刪除
          </button>
        </div>
      </div>
    </div>
  );
}