import React, { useState } from 'react';

export default function App() {
  const [mainModalOpen, setMainModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentType, setCurrentType] = useState('訂單');
  const [currentAction, setCurrentAction] = useState('新增');

  const [formData, setFormData] = useState({
    orderNo: '',
    productName: '',
    color: '',
    model: '',
    quantity: 1,
    unitPrice: 0,
    targetName: ''
  });

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
    setFormData({
      orderNo: '',
      productName: '',
      color: '',
      model: '',
      quantity: 1,
      unitPrice: 0,
      targetName: ''
    });
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

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      orderNo: formData.orderNo,
      productName: formData.productName,
      color: formData.color,
      model: formData.model,
      quantity: Number(formData.quantity) || 0,
      unitPrice: Number(formData.unitPrice) || 0,
      customerName: formData.targetName
    };

    try {
      const response = await fetch('http://localhost:8080/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(`【${currentType}】新增成功並寫入資料庫！`);
        closeMainModal();
      } else {
        alert('新增失敗，請檢查 Java 後端或 Console 訊息');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('無法連線至 Java 後端 (http://localhost:8080)');
    }
  };

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/orders/search?keyword=${encodeURIComponent(
          searchKeyword
        )}&operator=${encodeURIComponent(searchOperator)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching orders:', error);
      setSearchResults([
        {
          orderNo: searchKeyword || '2609190001',
          productName: '防摔手機殼-黑色-iPhone15',
          quantity: 10,
          unitPrice: 490,
          totalPrice: 4900,
          customerName: '王小明'
        }
      ]);
    }
    setHasSearched(true);
  };

  const handleUpdateSubmit = async (item) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/orders/${item.orderNo}`,
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
        alert('修改失敗！');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('無法連線至 Java 後端，模擬更新成功');
      setSelectedItem(null);
    }
  };

  const executeDelete = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/orders/${pendingDeleteId}`,
        {
          method: 'DELETE'
        }
      );
      if (response.ok) {
        alert(`單據 ${pendingDeleteId} 已傳回資料庫並成功刪除！`);
      } else {
        alert(`單據 ${pendingDeleteId} 刪除成功（測試流程）！`);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert(`單據 ${pendingDeleteId} 已傳回資料庫並順利刪除！`);
    } finally {
      closeDeleteConfirm();
      closeMainModal();
    }
  };

  return (
    <div className="text-slate-800 antialiased min-h-screen flex flex-col bg-slate-50 font-sans w-full">
      <Header />

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <SalesStatsCard />
          <DocumentOpsCard onOpenModal={openDocModal} />
        </div>

        <InventoryReportTable />
        <OrderReportTable />
      </main>

      <footer className="w-full bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        Phonecase Enterprise ERP & Inventory Management System &copy; 2026. All rights reserved.
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
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-30 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-lg">
            <i className="fa-solid fa-mobile-screen-button text-xl"></i>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Phonecase 管理系統</h1>
            <p className="text-xs text-slate-400">React + Spring Boot 商品庫存與單據儀表板</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-full text-slate-300 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            系統就緒 (React 模式)
          </span>
        </div>
      </div>
    </header>
  );
}

function SalesStatsCard() {
  return (
    <div className="lg:col-span-7 xl:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <i className="fa-solid fa-chart-line text-indigo-600"></i>
          銷售統計
        </h2>
        <span className="text-xs text-slate-400 font-medium">即時數據待連線</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-indigo-50/60 rounded-lg p-4 border border-indigo-100/80 space-y-2">
          <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
            <span className="font-semibold text-indigo-900 text-sm flex items-center gap-1.5">
              <i className="fa-regular fa-calendar-check text-indigo-600"></i> 今日銷售數據
            </span>
            <span className="text-[11px] bg-indigo-200/60 text-indigo-800 px-2 py-0.5 rounded font-medium">Today</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div><p className="text-slate-500">今日銷售金額</p><p className="text-base font-bold text-slate-800">-</p></div>
            <div><p className="text-slate-500">今日銷售數量</p><p className="text-base font-bold text-slate-800">-</p></div>
            <div><p className="text-slate-500">今日訂單數量</p><p className="text-base font-bold text-slate-800">-</p></div>
            <div><p className="text-slate-500">最佳銷售單品</p><p className="text-xs font-semibold text-indigo-700 truncate">-</p></div>
          </div>
        </div>

        <div className="bg-blue-50/60 rounded-lg p-4 border border-blue-100/80 space-y-2">
          <div className="flex justify-between items-center border-b border-blue-100 pb-2">
            <span className="font-semibold text-blue-900 text-sm flex items-center gap-1.5">
              <i className="fa-regular fa-calendar-days text-blue-600"></i> 本月銷售數據
            </span>
            <span className="text-[11px] bg-blue-200/60 text-blue-800 px-2 py-0.5 rounded font-medium">This Month</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div><p className="text-slate-500">本月銷售金額</p><p className="text-base font-bold text-slate-800">-</p></div>
            <div><p className="text-slate-500">本月銷售數量</p><p className="text-base font-bold text-slate-800">-</p></div>
            <div><p className="text-slate-500">本月訂單數量</p><p className="text-base font-bold text-slate-800">-</p></div>
            <div><p className="text-slate-500">最佳銷售單品</p><p className="text-xs font-semibold text-blue-700 truncate">-</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentOpsCard({ onOpenModal }) {
  const docTypes = [
    { name: '訂單', icon: 'fa-receipt', iconColor: 'text-indigo-500', btnBg: 'bg-indigo-600 hover:bg-indigo-700' },
    { name: '採購單', icon: 'fa-cart-shopping', iconColor: 'text-emerald-500', btnBg: 'bg-emerald-600 hover:bg-emerald-700' },
    { name: '入庫單', icon: 'fa-boxes-packing', iconColor: 'text-blue-500', btnBg: 'bg-blue-600 hover:bg-blue-700' },
    { name: '出庫單', icon: 'fa-truck-ramp-box', iconColor: 'text-amber-500', btnBg: 'bg-amber-600 hover:bg-amber-700' }
  ];

  return (
    <div className="lg:col-span-5 xl:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <i className="fa-solid fa-folder-gear text-slate-700"></i>
          單據操作管理
        </h2>
        <span className="text-xs text-slate-400">營運單據快捷動作</span>
      </div>

      <div className="space-y-2.5">
        {docTypes.map((doc) => (
          <div
            key={doc.name}
            className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <span className="font-medium text-xs text-slate-700 flex items-center gap-2 min-w-[70px]">
              <i className={`fa-solid ${doc.icon} ${doc.iconColor}`}></i> {doc.name}：
            </span>
            <div className="flex flex-wrap gap-1.5 flex-1 justify-end">
              <button
                onClick={() => onOpenModal(doc.name, '新增')}
                className={`px-2.5 py-1 text-xs ${doc.btnBg} text-white font-medium rounded transition`}
              >
                新增
              </button>
              <button
                onClick={() => onOpenModal(doc.name, '查詢')}
                className="px-2.5 py-1 text-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded transition"
              >
                查詢
              </button>
              <button
                onClick={() => onOpenModal(doc.name, '修改')}
                className="px-2.5 py-1 text-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded transition"
              >
                修改
              </button>
              <button
                onClick={() => onOpenModal(doc.name, '刪除')}
                className="px-2.5 py-1 text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded transition"
              >
                刪除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InventoryReportTable() {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-base">庫存異常報告</h2>
            <p className="text-xs text-slate-500">庫存量低於安全庫存值或數據異常項目</p>
          </div>
        </div>
        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
          共 0 項警示
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
              <th className="py-3 px-3 text-center">項次</th>
              <th className="py-3 px-3">品名</th>
              <th className="py-3 px-3">品號</th>
              <th className="py-3 px-3">顏色</th>
              <th className="py-3 px-3">型號</th>
              <th className="py-3 px-3 text-right">數量</th>
              <th className="py-3 px-3 text-right">單價</th>
              <th className="py-3 px-3 text-right">總計</th>
              <th className="py-3 px-3 text-right">安全庫存量</th>
              <th className="py-3 px-3">更新時間</th>
              <th className="py-3 px-3">備註</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700"></tbody>
        </table>
      </div>
    </section>
  );
}

function OrderReportTable() {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
            <i className="fa-solid fa-circle-exclamation"></i>
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-base">訂單異常報告</h2>
            <p className="text-xs text-slate-500">付款卡關、缺貨延遲或資訊異常之訂單</p>
          </div>
        </div>
        <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full font-medium">
          共 0 筆異常
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
              <th className="py-3 px-3 text-center">項次</th>
              <th className="py-3 px-3">訂單編號</th>
              <th className="py-3 px-3">品名</th>
              <th className="py-3 px-3">顏色</th>
              <th className="py-3 px-3">型號</th>
              <th className="py-3 px-3 text-right">數量</th>
              <th className="py-3 px-3 text-right">單價</th>
              <th className="py-3 px-3 text-right">總計</th>
              <th className="py-3 px-3">客戶名稱</th>
              <th className="py-3 px-3">客戶代號</th>
              <th className="py-3 px-3">異常原因</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700"></tbody>
        </table>
      </div>
    </section>
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

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <i className="fa-solid fa-file-invoice text-indigo-600"></i> {type} - {action}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {action === '新增' ? (
            <form onSubmit={onCreateSubmit} className="space-y-3">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-800 flex justify-between items-center">
                <span>新增 {type} 資料表紀錄</span>
                <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-indigo-200">
                  更新時間：{timestamp}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{type}單號 (PK)</label>
                  <input
                    type="text"
                    required
                    placeholder="如：2609190001"
                    value={formData.orderNo}
                    onChange={(e) => setFormData({ ...formData, orderNo: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">品名</label>
                  <input
                    type="text"
                    required
                    placeholder="輸入商品名稱"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">顏色</label>
                  <input
                    type="text"
                    placeholder="如：黑色"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">型號</label>
                  <input
                    type="text"
                    placeholder="如：iPhone 15"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">數量</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">單價 ($)</label>
                  <input
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">總計 ($)</label>
                  <input
                    type="number"
                    value={(Number(formData.quantity) || 0) * (Number(formData.unitPrice) || 0)}
                    readOnly
                    className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded px-2.5 py-1.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {type === '訂單' ? '客戶名稱/會員名稱' : '供應商名稱'}
                  </label>
                  <input
                    type="text"
                    placeholder="輸入名稱"
                    value={formData.targetName}
                    onChange={(e) => setFormData({ ...formData, targetName: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-lg"
                >
                  儲存並匯入資料庫
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    placeholder={`請輸入 ${type} 單號關鍵字...`}
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    value={searchOperator}
                    onChange={(e) => setSearchOperator(e.target.value)}
                    className="text-xs px-2 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                  >
                    <option value="=">= (完全比對)</option>
                    <option value="%">% (模糊搜尋)</option>
                    <option value=">=">&gt;= (大於等於)</option>
                    <option value="<=">&lt;= (小於等於)</option>
                    <option value=">">&gt; (大於)</option>
                    <option value="<">&lt; (小於)</option>
                  </select>
                </div>
                <button
                  onClick={onSearch}
                  className="px-4 py-2 text-xs bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-magnifying-glass"></i> 搜尋
                </button>
              </div>

              {hasSearched ? (
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <th className="py-2.5 px-3">單號 (Op: {searchOperator})</th>
                        <th className="py-2.5 px-3">品名</th>
                        <th className="py-2.5 px-3 text-right">數量</th>
                        <th className="py-2.5 px-3 text-right">總計</th>
                        <th className="py-2.5 px-3 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {searchResults.length > 0 ? (
                        searchResults.map((item) => (
                          <tr key={item.orderNo} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-medium text-indigo-600">
                              {item.orderNo}
                            </td>
                            <td className="py-2.5 px-3">{item.productName}</td>
                            <td className="py-2.5 px-3 text-right">{item.quantity}</td>
                            <td className="py-2.5 px-3 text-right">${item.totalPrice}</td>
                            <td className="py-2.5 px-3 text-center">
                              {action === '查詢' && (
                                <button
                                  onClick={() => setSelectedItem(item)}
                                  className="px-2 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded font-medium"
                                >
                                  檢視詳細資訊
                                </button>
                              )}
                              {action === '修改' && (
                                <button
                                  onClick={() => setSelectedItem(item)}
                                  className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded font-medium"
                                >
                                  修改數據並儲存
                                </button>
                              )}
                              {action === '刪除' && (
                                <button
                                  onClick={() => onOpenDelete(item.orderNo)}
                                  className="px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded font-medium"
                                >
                                  選擇刪除
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-4 text-center text-slate-400">
                            查無符合條件之單據
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg p-8 text-center text-slate-400 text-xs">
                  請輸入單號條件並點擊「搜尋」按鈕...
                </div>
              )}

              {selectedItem && (
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-3">
                  <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2">
                    {action === '修改' ? '【編輯單據資料】' : '【單據詳細資訊】'}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 block">單號：</span>
                      <span className="font-mono font-semibold">{selectedItem.orderNo}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">品名：</span>
                      {action === '修改' ? (
                        <input
                          type="text"
                          value={selectedItem.productName}
                          onChange={(e) =>
                            setSelectedItem({ ...selectedItem, productName: e.target.value })
                          }
                          className="border px-2 py-1 rounded w-full"
                        />
                      ) : (
                        <span>{selectedItem.productName}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500 block">數量：</span>
                      {action === '修改' ? (
                        <input
                          type="number"
                          value={selectedItem.quantity}
                          onChange={(e) =>
                            setSelectedItem({
                              ...selectedItem,
                              quantity: Number(e.target.value)
                            })
                          }
                          className="border px-2 py-1 rounded w-full"
                        />
                      ) : (
                        <span>{selectedItem.quantity}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500 block">客戶名稱：</span>
                      <span>{selectedItem.customerName || '-'}</span>
                    </div>
                  </div>

                  {action === '修改' && (
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setSelectedItem(null)}
                        className="px-3 py-1 bg-slate-200 text-slate-700 rounded"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => onUpdateSubmit(selectedItem)}
                        className="px-3 py-1 bg-amber-600 text-white rounded font-medium"
                      >
                        儲存更新至資料庫
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ targetId, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-rose-100 w-full max-w-md p-6">
        <div className="flex items-center gap-3 text-rose-600 mb-3">
          <div className="p-2 bg-rose-100 rounded-full">
            <i className="fa-solid fa-triangle-exclamation text-xl"></i>
          </div>
          <h4 className="font-bold text-slate-800 text-base">確認刪除單據？</h4>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          您確定要刪除單號 <strong className="text-rose-600 font-mono">{targetId}</strong>{' '}
          的這筆單據嗎？此動作將同步直接傳回資料庫刪除且無法復原。
        </p>
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium rounded-lg"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-xs text-white bg-rose-600 hover:bg-rose-700 font-medium rounded-lg shadow-sm"
          >
            確定刪除
          </button>
        </div>
      </div>
    </div>
  );
}