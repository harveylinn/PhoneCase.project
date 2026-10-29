import React, { useEffect, useMemo, useState } from 'react';
import AdminProducts from '../products/AdminProducts.jsx';
import {
  AdminPageTitle,
  CrmSection,
  formatNumber,
  orderStatusClass,
  orderStatusLabels
} from './admin.jsx';

// 讀取後端回傳的錯誤訊息
async function errorMessageOf(response) {
  if (!response) {
    return '無法連線至後端';
  }
  const body = await response.json().catch(() => ({}));
  return body.message || `HTTP ${response.status}`;
}

const formatDateTime = (value) => (value ? value.replace('T', ' ').slice(0, 16) : '-');

/* ---------------- 商品管理：所有商品 ---------------- */
export function AdminProductsPage() {
  return <AdminProducts embedded />;
}

/* ---------------- 商品管理：未上架 ----------------
 * 庫存中狀態為「未上架」的品項（尚未在商城販售，或規格尚未填售價）
 * 填入售價後上架：已有商城規格就更新售價並上架；沒有規格就在選擇的商品系列下新增規格（SKU = 品號） */
export function UnlistedProductsPage() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [keyword, setKeyword] = useState('');
  // 每列的售價、商品系列輸入，key 為品號
  const [drafts, setDrafts] = useState({});
  const [publishing, setPublishing] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [inventoryResponse, productResponse] = await Promise.all([
        fetch('/api/admin/inventory'),
        fetch('/api/products')
      ]);
      if (!inventoryResponse.ok) {
        throw new Error(await errorMessageOf(inventoryResponse));
      }
      const inventory = await inventoryResponse.json();
      setItems(inventory.filter((item) => item.status === '未上架'));
      setProducts(productResponse.ok ? await productResponse.json() : []);
      setError('');
    } catch (err) {
      setError(err.message || '無法取得庫存資料');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const word = keyword.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          !word ||
          [item.orderNo, item.productName, item.brand, item.model, item.color].some((value) =>
            (value || '').toLowerCase().includes(word)
          )
      ),
    [items, word]
  );

  const draftOf = (item) => drafts[item.orderNo] || { price: item.salePrice || '', productId: '' };
  const updateDraft = (item, field, value) =>
    setDrafts((current) => ({ ...current, [item.orderNo]: { ...draftOf(item), [field]: value } }));

  const publish = async (item) => {
    const draft = draftOf(item);
    const price = Number(draft.price);
    if (!price || price <= 0) {
      alert('請先填入大於 0 的售價');
      return;
    }
    setPublishing(item.orderNo);
    const response = await fetch(`/api/admin/inventory/${encodeURIComponent(item.orderNo)}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price, productId: draft.productId ? Number(draft.productId) : null })
    }).catch(() => null);
    setPublishing('');
    if (response?.ok) {
      setNotice(`「${item.productName} ${item.model || ''} ${item.color || ''}」已上架`);
      window.setTimeout(() => setNotice(''), 3500);
      setItems((current) => current.filter((row) => row.orderNo !== item.orderNo));
    } else {
      alert(`上架失敗：${await errorMessageOf(response)}`);
    }
  };

  return (
    <>
      <AdminPageTitle title="未上架商品" desc="已進入庫存、尚未在商城販售的品項。填入售價後即可上架到商城。">
        <span className="adm-status">共 {formatNumber(items.length)} 項</span>
      </AdminPageTitle>
      <main className="adm-main">
        {notice && <div className="adm-notice">{notice}</div>}
        {error && <div className="adm-error">{error}</div>}
        <section className="adm-card adm-section">
          <div className="adm-list-tools">
            <input
              type="text"
              className="adm-input"
              placeholder="搜尋品號、品名、品牌、型號或顏色"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button className="adm-btn adm-btn-white" onClick={load}>
              重新整理
            </button>
          </div>
          <div className="adm-table-wrap">
            <table className="adm-table adm-table-nowrap">
              <thead>
                <tr>
                  <th>品號</th>
                  <th>品名</th>
                  <th>品牌 / 型號</th>
                  <th>顏色</th>
                  <th className="r">庫存</th>
                  <th className="r">成本</th>
                  <th>商品系列</th>
                  <th>售價</th>
                  <th className="c">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((item) => {
                    const draft = draftOf(item);
                    return (
                      <tr key={item.orderNo}>
                        <td className="mono">{item.orderNo}</td>
                        <td>
                          <strong>{item.productName}</strong>
                        </td>
                        <td>
                          {item.brand || '-'}
                          <span className="adm-sub">{item.model || '-'}</span>
                        </td>
                        <td>{item.color || '-'}</td>
                        <td className="r">{formatNumber(item.quantity)}</td>
                        <td className="r">${formatNumber(item.unitPrice)}</td>
                        <td>
                          {item.productVariantId ? (
                            <span className="adm-sub">已有商城規格</span>
                          ) : (
                            <select
                              className="adm-inline-select"
                              value={draft.productId}
                              onChange={(e) => updateDraft(item, 'productId', e.target.value)}
                            >
                              <option value="">依品名自動對應</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            className="adm-inline-input"
                            placeholder="NT$"
                            value={draft.price}
                            onChange={(e) => updateDraft(item, 'price', e.target.value)}
                          />
                        </td>
                        <td className="c">
                          <button
                            className="adm-btn adm-btn-dark"
                            disabled={publishing === item.orderNo}
                            onClick={() => publish(item)}
                          >
                            {publishing === item.orderNo ? '上架中…' : '上架'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="adm-empty">
                      {loading ? '正在載入…' : '沒有未上架的商品'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}

/* ---------------- 訂單管理 ---------------- */
const orderPages = {
  all: ['所有訂單', '商城所有訂單'],
  unpaid: ['未結帳', '已下單、尚未完成信用卡付款的訂單'],
  unshipped: ['未出貨', '已付款或貨到付款、等待出貨的訂單'],
  unpicked: ['未取貨', '已出貨、顧客尚未取貨 / 簽收的訂單']
};

const shippingLabels = { HOME: '宅配到府', CVS: '超商取貨' };
const paymentLabels = { CREDIT_CARD: '信用卡', COD: '貨到付款' };

// 每個狀態可以執行的操作：[目標狀態, 按鈕文字, 樣式]
const orderActions = {
  PENDING_PAYMENT: [['CANCELLED', '取消', 'adm-btn-danger-soft']],
  PENDING_SHIPMENT: [
    ['SHIPPED', '出貨', 'adm-btn-dark'],
    ['CANCELLED', '取消', 'adm-btn-danger-soft']
  ],
  PAID: [
    ['SHIPPED', '出貨', 'adm-btn-dark'],
    ['CANCELLED', '取消', 'adm-btn-danger-soft']
  ],
  SHIPPED: [['COMPLETED', '已取貨', 'adm-btn-dark']]
};

export function AdminOrdersPage({ filter = 'all' }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/orders?filter=${filter}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await errorMessageOf(response));
        }
        return response.json();
      })
      .then((data) => {
        setOrders(data);
        setError('');
      })
      .catch((err) => {
        setOrders([]);
        setError(err.message || '無法取得訂單資料');
      })
      .finally(() => setLoading(false));
  }, [filter, reloadKey]);

  const word = keyword.trim().toLowerCase();
  const filtered = orders.filter(
    (order) =>
      !word ||
      [order.orderNumber, order.memberName, order.receiverName, order.receiverPhone, order.items].some((value) =>
        (value || '').toLowerCase().includes(word)
      )
  );

  const changeStatus = async (order, status, label) => {
    if (!window.confirm(`確定要將訂單 ${order.orderNumber} 設為「${label}」嗎？`)) {
      return;
    }
    const response = await fetch(`/api/admin/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(() => null);
    if (response?.ok) {
      setReloadKey((key) => key + 1);
    } else {
      alert(`更新失敗：${await errorMessageOf(response)}`);
    }
  };

  const [title, desc] = orderPages[filter] || orderPages.all;

  return (
    <>
      <AdminPageTitle title={title} desc={desc}>
        <span className="adm-status">共 {formatNumber(orders.length)} 筆</span>
      </AdminPageTitle>
      <main className="adm-main">
        {error && <div className="adm-error">{error}</div>}
        <section className="adm-card adm-section">
          <div className="adm-list-tools">
            <input
              type="text"
              className="adm-input"
              placeholder="搜尋訂單編號、會員、收件人、電話或商品"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="adm-table-wrap">
            <table className="adm-table adm-table-nowrap">
              <thead>
                <tr>
                  <th>訂單編號</th>
                  <th>下單時間</th>
                  <th>會員</th>
                  <th>收件人</th>
                  <th>配送</th>
                  <th>付款</th>
                  <th>商品</th>
                  <th className="r">金額</th>
                  <th className="c">狀態</th>
                  <th className="c">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((order) => (
                    <tr key={order.id}>
                      <td className="mono">#{order.orderNumber}</td>
                      <td>{formatDateTime(order.createdAt)}</td>
                      <td>{order.memberName || '-'}</td>
                      <td>
                        {order.receiverName || '-'}
                        <span className="adm-sub">{order.receiverPhone}</span>
                      </td>
                      <td>
                        {shippingLabels[order.shippingMethod] || order.shippingMethod || '-'}
                        <span className="adm-sub">{order.storeName || order.receiverAddress}</span>
                      </td>
                      <td>{paymentLabels[order.paymentMethod] || order.paymentMethod || '-'}</td>
                      <td className="wrap">
                        {order.itemCount} 件
                        <span className="adm-sub">{order.items}</span>
                      </td>
                      <td className="r">NT${formatNumber(order.totalAmount)}</td>
                      <td className="c">
                        <span className={`adm-tag ${orderStatusClass[order.orderStatus] || ''}`}>
                          {orderStatusLabels[order.orderStatus] || order.orderStatus}
                        </span>
                      </td>
                      <td className="c">
                        <div className="adm-row-actions">
                          {(orderActions[order.orderStatus] || []).map(([status, label, style]) => (
                            <button
                              key={status}
                              className={`adm-btn ${style}`}
                              onClick={() => changeStatus(order, status, label)}
                            >
                              {label}
                            </button>
                          ))}
                          {!orderActions[order.orderStatus] && <span className="adm-sub">-</span>}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="adm-empty">
                      {loading ? '正在載入…' : '沒有符合條件的訂單'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}

/* ---------------- 會員管理 ---------------- */
export function AdminMembersPage() {
  return (
    <>
      <AdminPageTitle title="會員管理" desc="查看所有會員的消費紀錄與分群，並可停權或恢復會員。" />
      <main className="adm-main">
        <CrmSection refreshKey={0} manage />
      </main>
    </>
  );
}
