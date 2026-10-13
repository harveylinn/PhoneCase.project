import { useState, useEffect } from 'react'

import CheckoutPage from './pages/order/CheckoutPage'

import OrderListPage, {
  demoOrders
} from './pages/order/OrderListPage'

import type { Order } from './pages/order/OrderListPage'

import OrderDetailPage from './pages/order/OrderDetailPage'

const STORAGE_KEY = 'phonecase-demo-orders'

// 讀取之前儲存的訂單
function loadOrders(): Order[] {
  const savedOrders = localStorage.getItem(STORAGE_KEY)

  if (!savedOrders) {
    return demoOrders
  }

  try {
    const parsed = JSON.parse(savedOrders)

    if (Array.isArray(parsed)) {
      return parsed as Order[]
    }
  } catch (error) {
    console.error('讀取訂單失敗', error)
  }

  return demoOrders
}

function App() {

  // 目前顯示的頁面
  const [currentPage, setCurrentPage] = useState('checkout')

  // 所有訂單
  const [orders, setOrders] = useState<Order[]>(loadOrders)

  // 目前選擇的訂單編號
  const [selectedOrderId, setSelectedOrderId] = useState('ORD003')

  // 找出選擇的訂單
  const selectedOrder = orders.find(
    (order) => order.id === selectedOrderId
  )

  // 訂單有變化時，儲存到瀏覽器
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(orders)
    )
  }, [orders])

  // =========================
  // 新增訂單
  // =========================

  function handleCreateOrder(newOrder: Order) {

    // 把新訂單加到列表最前面
    setOrders((previousOrders) => [
      newOrder,
      ...previousOrders
    ])

    // 記住新訂單編號
    setSelectedOrderId(newOrder.id)

    // 自動跳轉到我的訂單
    setCurrentPage('list')
  }

  // =========================
  // 查看訂單明細
  // =========================

  function handleViewDetail(orderId: string) {
    setSelectedOrderId(orderId)
    setCurrentPage('detail')
  }

  // =========================
  // 取消訂單
  // =========================

  function handleCancelOrder(orderId: string) {

    const targetOrder = orders.find(
      (order) => order.id === orderId
    )

    if (!targetOrder) {
      alert('找不到這筆訂單')
      return
    }

    if (
      targetOrder.status !== '待付款' &&
      targetOrder.status !== '待出貨'
    ) {
      alert('此訂單無法取消')
      return
    }

    const confirmed = window.confirm(
      `確定要取消訂單 ${orderId} 嗎？`
    )

    if (!confirmed) {
      return
    }

    setOrders((previousOrders) =>
      previousOrders.map((order) =>
        order.id === orderId
          ? { ...order, status: '已取消' as const }
          : order
      )
    )

    alert('測試訂單已取消')
  }

  // =========================
  // 畫面
  // =========================

  return (
    <div>

      {/* 頁面切換按鈕 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '15px',
          padding: '20px',
          background: '#f5f5f5',
          flexWrap: 'wrap'
        }}
      >

        <button
          onClick={() => setCurrentPage('checkout')}
        >
          確認訂單
        </button>

        <button
          onClick={() => setCurrentPage('list')}
        >
          我的訂單
        </button>

        <button
          onClick={() => setCurrentPage('detail')}
        >
          訂單明細
        </button>

      </div>

      {/* 確認訂單頁面 */}
      {currentPage === 'checkout' && (
        <CheckoutPage
          onCreateOrder={handleCreateOrder}
        />
      )}

      {/* 我的訂單頁面 */}
      {currentPage === 'list' && (
        <OrderListPage
          orders={orders}
          onViewDetail={handleViewDetail}
          onCancelOrder={handleCancelOrder}
        />
      )}

      {/* 訂單明細頁面 */}
      {currentPage === 'detail' && (
        <OrderDetailPage
          order={selectedOrder}
        />
      )}

    </div>
  )
}

export default App