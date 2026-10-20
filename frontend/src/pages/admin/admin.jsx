import React, { useState } from 'react';
import {
  Smartphone,
  ChartLine,
  CalendarCheck,
  CalendarDays,
  FolderCog,
  Receipt,
  ShoppingCart,
  PackagePlus,
  Truck,
  TriangleAlert,
  CircleAlert,
  FileText,
  X,
  Search
} from 'lucide-react';

/* 本頁專用樣式（全部以 .adm 為前綴，避免影響其他頁面） */
const adminStyles = `
.adm {
  --adm-bg: #f8fafc;
  --adm-card: #ffffff;
  --adm-border: #e2e8f0;
  --adm-border-soft: #f1f5f9;
  --adm-text: #1e293b;
  --adm-muted: #64748b;
  --adm-faint: #94a3b8;
  --adm-dark: #0f172a;
  --adm-indigo: #4f46e5;
  --adm-indigo-dark: #4338ca;
  --adm-blue: #2563eb;
  --adm-emerald: #059669;
  --adm-amber: #d97706;
  --adm-rose: #e11d48;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
  background: var(--adm-bg);
  color: var(--adm-text);
  font-size: 14px;
  line-height: 1.5;
}
.adm *, .adm *::before, .adm *::after { box-sizing: border-box; }
.adm h1, .adm h2, .adm h3, .adm h4, .adm p { margin: 0; }
.adm button, .adm input, .adm select { font: inherit; }
.adm button { cursor: pointer; }
.adm svg { flex-shrink: 0; }

/* ---------- Header ---------- */
.adm-header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: var(--adm-dark);
  color: #fff;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.25);
}
.adm-header-inner {
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.adm-brand { display: flex; align-items: center; gap: 12px; }
.adm-brand-icon {
  display: flex;
  padding: 8px;
  border-radius: 8px;
  background: var(--adm-indigo);
}
.adm-brand h1 { font-size: 18px; font-weight: 700; line-height: 1.2; }
.adm-brand p { font-size: 12px; color: var(--adm-faint); }
.adm-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #1e293b;
  color: #cbd5e1;
  font-size: 12px;
  white-space: nowrap;
}
.adm-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  animation: adm-pulse 2s ease-in-out infinite;
}
@keyframes adm-pulse { 50% { opacity: 0.4; } }

/* ---------- Layout ---------- */
.adm-main {
  flex: 1;
  width: 100%;
  padding: 24px;
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
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
}
.adm-card-pad { padding: 20px; display: flex; flex-direction: column; }
.adm-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--adm-border-soft);
}
.adm-card-head h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
}
.adm-hint { font-size: 12px; color: var(--adm-faint); }

/* ---------- Sales stats ---------- */
.adm-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.adm-stat-box { border-radius: 8px; padding: 16px; border: 1px solid; }
.adm-stat-box.indigo { background: #eef2ff; border-color: #e0e7ff; }
.adm-stat-box.blue { background: #eff6ff; border-color: #dbeafe; }
.adm-stat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid;
}
.indigo .adm-stat-head { border-color: #e0e7ff; color: #312e81; }
.blue .adm-stat-head { border-color: #dbeafe; color: #1e3a8a; }
.adm-stat-title { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; }
.adm-stat-tag { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 4px; }
.indigo .adm-stat-tag { background: #c7d2fe; color: #3730a3; }
.blue .adm-stat-tag { background: #bfdbfe; color: #1e40af; }
.adm-stat-items { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; }
.adm-stat-label { color: var(--adm-muted); }
.adm-stat-value { font-size: 16px; font-weight: 700; }
.adm-stat-best { font-size: 12px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.indigo .adm-stat-best { color: var(--adm-indigo-dark); }
.blue .adm-stat-best { color: #1d4ed8; }

/* ---------- Document ops ---------- */
.adm-doc-list { display: flex; flex-direction: column; gap: 10px; }
.adm-doc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid var(--adm-border-soft);
}
.adm-doc-name { display: flex; align-items: center; gap: 8px; min-width: 80px; font-size: 13px; font-weight: 500; color: #334155; }
.adm-doc-btns { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }

/* ---------- Buttons ---------- */
.adm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid transparent;
  transition: background-color 0.15s, color 0.15s;
  white-space: nowrap;
}
.adm-btn-lg { padding: 8px 16px; border-radius: 8px; }
.adm-btn-white { background: #fff; color: #334155; border-color: #cbd5e1; }
.adm-btn-white:hover { background: #f1f5f9; }
.adm-btn-gray { background: #f1f5f9; color: #475569; }
.adm-btn-gray:hover { background: #e2e8f0; }
.adm-btn-dark { background: #1e293b; color: #fff; }
.adm-btn-dark:hover { background: var(--adm-dark); }
.adm-btn-indigo { background: var(--adm-indigo); color: #fff; }
.adm-btn-indigo:hover { background: var(--adm-indigo-dark); }
.adm-btn-emerald { background: var(--adm-emerald); color: #fff; }
.adm-btn-emerald:hover { background: #047857; }
.adm-btn-blue { background: var(--adm-blue); color: #fff; }
.adm-btn-blue:hover { background: #1d4ed8; }
.adm-btn-amber { background: var(--adm-amber); color: #fff; }
.adm-btn-amber:hover { background: #b45309; }
.adm-btn-rose { background: var(--adm-rose); color: #fff; }
.adm-btn-rose:hover { background: #be123c; }
.adm-btn-rose-soft { background: #fff1f2; color: var(--adm-rose); border-color: #fecdd3; }
.adm-btn-rose-soft:hover { background: #ffe4e6; }
.adm-btn-indigo-soft { background: #eef2ff; color: var(--adm-indigo); }
.adm-btn-indigo-soft:hover { background: #e0e7ff; }
.adm-btn-amber-soft { background: #fffbeb; color: #b45309; }
.adm-btn-amber-soft:hover { background: #fef3c7; }

/* ---------- Report tables ---------- */
.adm-section { overflow: hidden; }
.adm-section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  background: #fbfcfd;
  border-bottom: 1px solid var(--adm-border);
}
.adm-section-title { display: flex; align-items: center; gap: 8px; }
.adm-section-title h2 { font-size: 16px; font-weight: 700; }
.adm-section-title p { font-size: 12px; color: var(--adm-muted); }
.adm-icon-badge { display: flex; padding: 6px; border-radius: 8px; }
.adm-icon-badge.amber { background: #fef3c7; color: #b45309; }
.adm-icon-badge.rose { background: #ffe4e6; color: #be123c; }
.adm-pill { font-size: 12px; font-weight: 500; padding: 4px 10px; border-radius: 999px; border: 1px solid; }
.adm-pill.amber { background: #fffbeb; color: #b45309; border-color: #fde68a; }
.adm-pill.rose { background: #fff1f2; color: #be123c; border-color: #fecdd3; }
.adm-table-wrap { overflow-x: auto; }
.adm-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 12px; }
.adm-table th {
  padding: 12px;
  background: #f1f5f9;
  color: #475569;
  font-weight: 600;
  white-space: nowrap;
  border-bottom: 1px solid var(--adm-border);
}
.adm-table td { padding: 10px 12px; color: #334155; border-bottom: 1px solid var(--adm-border-soft); }
.adm-table tbody tr:hover { background: #f8fafc; }
.adm-table .c { text-align: center; }
.adm-table .r { text-align: right; }
.adm-table .mono { font-family: ui-monospace, Consolas, monospace; font-weight: 500; color: var(--adm-indigo); }
.adm-empty { padding: 16px; text-align: center; color: var(--adm-faint); }

/* ---------- Footer ---------- */
.adm-footer {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--adm-muted);
  background: #fff;
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
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
}
.adm-overlay.top { z-index: 50; background: rgba(2, 6, 23, 0.6); }
.adm-modal {
  width: 100%;
  max-width: 672px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--adm-border);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.25);
}
.adm-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--adm-border-soft);
}
.adm-modal-head h3 { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; }
.adm-close { display: flex; padding: 4px; border: 0; background: none; color: var(--adm-faint); }
.adm-close:hover { color: #475569; }
.adm-modal-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 16px; }
.adm-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  background: #eef2ff;
  border: 1px solid #e0e7ff;
  color: #3730a3;
  font-size: 12px;
}
.adm-notice-time {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #fff;
  border: 1px solid #c7d2fe;
}
.adm-form { display: flex; flex-direction: column; gap: 12px; }
.adm-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px; }
.adm-label { display: block; margin-bottom: 4px; font-weight: 500; color: #334155; }
.adm-input,
.adm-select {
  width: 100%;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--adm-text);
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
}
.adm-input:focus,
.adm-select:focus { border-color: var(--adm-indigo); box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2); }
.adm-input[readonly] { background: #f8fafc; color: var(--adm-muted); border-color: var(--adm-border); }
.adm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--adm-border-soft);
}
.adm-search-bar { display: flex; align-items: center; gap: 8px; }
.adm-search-bar .adm-input { flex: 1; padding: 8px 12px; border-radius: 8px; }
.adm-search-bar .adm-select { width: auto; padding: 8px; border-radius: 8px; font-family: ui-monospace, Consolas, monospace; }
.adm-result { border: 1px solid var(--adm-border); border-radius: 8px; overflow-x: auto; }
.adm-placeholder {
  padding: 32px;
  text-align: center;
  font-size: 12px;
  color: var(--adm-faint);
  border: 1px solid var(--adm-border);
  border-radius: 8px;
}
.adm-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  font-size: 12px;
  background: #f8fafc;
  border: 1px solid var(--adm-border);
  border-radius: 8px;
}
.adm-detail h4 { padding-bottom: 8px; font-weight: 700; border-bottom: 1px solid var(--adm-border); }
.adm-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.adm-detail-label { display: block; color: var(--adm-muted); }
.adm-detail-mono { font-family: ui-monospace, Consolas, monospace; font-weight: 600; }
.adm-detail .adm-actions { border-top: 0; padding-top: 0; }

/* ---------- Delete confirm ---------- */
.adm-confirm {
  width: 100%;
  max-width: 448px;
  padding: 24px;
  background: #fff;
  border: 1px solid #ffe4e6;
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(15, 23, 42, 0.3);
}
.adm-confirm-head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; color: var(--adm-rose); }
.adm-confirm-head .adm-icon-badge { padding: 8px; border-radius: 50%; background: #ffe4e6; }
.adm-confirm-head h4 { font-size: 16px; font-weight: 700; color: var(--adm-text); }
.adm-confirm p { margin-bottom: 16px; font-size: 12px; line-height: 1.7; color: #475569; }
.adm-confirm strong { font-family: ui-monospace, Consolas, monospace; color: var(--adm-rose); }

/* ---------- RWD ---------- */
@media (max-width: 1024px) {
  .adm-top-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .adm-header-inner, .adm-main { padding-left: 16px; padding-right: 16px; }
  .adm-brand p { display: none; }
  .adm-stats-grid, .adm-form-grid, .adm-detail-grid { grid-template-columns: 1fr; }
  .adm-doc-row { flex-direction: column; align-items: flex-start; }
  .adm-doc-btns { justify-content: flex-start; }
  .adm-search-bar { flex-wrap: wrap; }
}
`;

const emptyForm = {
  orderNo: '',
  productName: '',
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
    <div className="adm">
      <style>{adminStyles}</style>
      <Header />

      <main className="adm-main">
        <div className="adm-top-grid">
          <SalesStatsCard />
          <DocumentOpsCard onOpenModal={openDocModal} />
        </div>

        <InventoryReportTable />
        <OrderReportTable />
      </main>

      <footer className="adm-footer">
        Phonecase Enterprise ERP &amp; Inventory Management System &copy; 2026. All rights reserved.
      </footer>

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
    </div>
  );
}

function Header() {
  return (
    <header className="adm-header">
      <div className="adm-header-inner">
        <div className="adm-brand">
          <div className="adm-brand-icon">
            <Smartphone size={20} />
          </div>
          <div>
            <h1>Phonecase 管理系統</h1>
            <p>React + Spring Boot 商品庫存與單據儀表板</p>
          </div>
        </div>
        <span className="adm-status">
          <span className="adm-dot"></span>
          系統就緒 (React 模式)
        </span>
      </div>
    </header>
  );
}

function StatBox({ color, icon, title, tag, prefix }) {
  return (
    <div className={`adm-stat-box ${color}`}>
      <div className="adm-stat-head">
        <span className="adm-stat-title">
          {icon} {title}
        </span>
        <span className="adm-stat-tag">{tag}</span>
      </div>
      <div className="adm-stat-items">
        <div>
          <p className="adm-stat-label">{prefix}銷售金額</p>
          <p className="adm-stat-value">-</p>
        </div>
        <div>
          <p className="adm-stat-label">{prefix}銷售數量</p>
          <p className="adm-stat-value">-</p>
        </div>
        <div>
          <p className="adm-stat-label">{prefix}訂單數量</p>
          <p className="adm-stat-value">-</p>
        </div>
        <div>
          <p className="adm-stat-label">最佳銷售單品</p>
          <p className="adm-stat-best">-</p>
        </div>
      </div>
    </div>
  );
}

function SalesStatsCard() {
  return (
    <div className="adm-card adm-card-pad">
      <div className="adm-card-head">
        <h2>
          <ChartLine size={18} color="#4f46e5" />
          銷售統計
        </h2>
        <span className="adm-hint">即時數據待連線</span>
      </div>

      <div className="adm-stats-grid">
        <StatBox
          color="indigo"
          icon={<CalendarCheck size={16} color="#4f46e5" />}
          title="今日銷售數據"
          tag="Today"
          prefix="今日"
        />
        <StatBox
          color="blue"
          icon={<CalendarDays size={16} color="#2563eb" />}
          title="本月銷售數據"
          tag="This Month"
          prefix="本月"
        />
      </div>
    </div>
  );
}

function DocumentOpsCard({ onOpenModal }) {
  const docTypes = [
    { name: '訂單', Icon: Receipt, iconColor: '#6366f1', btnClass: 'adm-btn-indigo' },
    { name: '採購單', Icon: ShoppingCart, iconColor: '#10b981', btnClass: 'adm-btn-emerald' },
    { name: '入庫單', Icon: PackagePlus, iconColor: '#3b82f6', btnClass: 'adm-btn-blue' },
    { name: '出庫單', Icon: Truck, iconColor: '#f59e0b', btnClass: 'adm-btn-amber' }
  ];

  return (
    <div className="adm-card adm-card-pad">
      <div className="adm-card-head">
        <h2>
          <FolderCog size={18} color="#334155" />
          單據操作管理
        </h2>
        <span className="adm-hint">營運單據快捷動作</span>
      </div>

      <div className="adm-doc-list">
        {docTypes.map(({ name, Icon, iconColor, btnClass }) => (
          <div key={name} className="adm-doc-row">
            <span className="adm-doc-name">
              <Icon size={16} color={iconColor} /> {name}：
            </span>
            <div className="adm-doc-btns">
              <button onClick={() => onOpenModal(name, '新增')} className={`adm-btn ${btnClass}`}>
                新增
              </button>
              <button onClick={() => onOpenModal(name, '查詢')} className="adm-btn adm-btn-white">
                查詢
              </button>
              <button onClick={() => onOpenModal(name, '修改')} className="adm-btn adm-btn-white">
                修改
              </button>
              <button onClick={() => onOpenModal(name, '刪除')} className="adm-btn adm-btn-rose-soft">
                刪除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportTable({ color, icon, title, desc, badge, columns }) {
  return (
    <section className="adm-card adm-section">
      <div className="adm-section-head">
        <div className="adm-section-title">
          <div className={`adm-icon-badge ${color}`}>{icon}</div>
          <div>
            <h2>{title}</h2>
            <p>{desc}</p>
          </div>
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
            <tr>
              <td colSpan={columns.length} className="adm-empty">
                目前沒有資料
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InventoryReportTable() {
  return (
    <ReportTable
      color="amber"
      icon={<TriangleAlert size={18} />}
      title="庫存異常報告"
      desc="庫存量低於安全庫存值或數據異常項目"
      badge="共 0 項警示"
      columns={[
        ['項次', 'c'],
        ['品名'],
        ['品號'],
        ['顏色'],
        ['型號'],
        ['數量', 'r'],
        ['單價', 'r'],
        ['總計', 'r'],
        ['安全庫存量', 'r'],
        ['更新時間'],
        ['備註']
      ]}
    />
  );
}

function OrderReportTable() {
  return (
    <ReportTable
      color="rose"
      icon={<CircleAlert size={18} />}
      title="訂單異常報告"
      desc="付款卡關、缺貨延遲或資訊異常之訂單"
      badge="共 0 筆異常"
      columns={[
        ['項次', 'c'],
        ['訂單編號'],
        ['品名'],
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
            <FileText size={18} color="#4f46e5" /> {type} - {action}
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
                <FormField label="單價 ($)">
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
                <button type="submit" className="adm-btn adm-btn-lg adm-btn-indigo">
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
                                  className="adm-btn adm-btn-indigo-soft"
                                >
                                  檢視詳細資訊
                                </button>
                              )}
                              {action === '修改' && (
                                <button
                                  onClick={() => setSelectedItem(item)}
                                  className="adm-btn adm-btn-amber-soft"
                                >
                                  修改數據並儲存
                                </button>
                              )}
                              {action === '刪除' && (
                                <button
                                  onClick={() => onOpenDelete(item.orderNo)}
                                  className="adm-btn adm-btn-rose-soft"
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
                      <button onClick={() => onUpdateSubmit(selectedItem)} className="adm-btn adm-btn-amber">
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
        <div className="adm-confirm-head">
          <div className="adm-icon-badge">
            <TriangleAlert size={22} />
          </div>
          <h4>確認刪除單據？</h4>
        </div>
        <p>
          您確定要刪除單號 <strong>{targetId}</strong> 的這筆單據嗎？此動作將同步直接傳回資料庫刪除且無法復原。
        </p>
        <div className="adm-actions">
          <button onClick={onCancel} className="adm-btn adm-btn-lg adm-btn-gray">
            取消
          </button>
          <button onClick={onConfirm} className="adm-btn adm-btn-lg adm-btn-rose">
            確定刪除
          </button>
        </div>
      </div>
    </div>
  );
}
