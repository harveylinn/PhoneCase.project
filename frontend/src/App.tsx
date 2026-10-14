import { useState, useEffect } from 'react'

import CheckoutPage from './pages/order/CheckoutPage'

import OrderListPage, {
  demoOrders
} from './pages/order/OrderListPage'

import type { Order } from './pages/order/OrderListPage'

import OrderDetailPage from './pages/order/OrderDetailPage'

// =============================
// 1. 訂單資料格式
// =============================

// 在原本 Order 的基礎上，增加取消原因
type OrderWithCancel = Order & {
  cancelReason?: string
  cancelledAt?: string
}

// localStorage 儲存名稱
const STORAGE_KEY = 'phonecase-demo-orders'

// =============================
// 2. 取消原因選項
// =============================

const cancelReasons = [
  '不想買了',
  '訂錯商品或數量',
  '想修改收件資訊',
  '重複下單',
  '其他原因'
]

// =============================
// 3. 讀取之前儲存的訂單
// =============================

function loadOrders(): OrderWithCancel[] {

  const savedOrders = localStorage.getItem(STORAGE_KEY)

  if (!savedOrders) {
    return demoOrders
  }

  try {

    const parsed = JSON.parse(savedOrders)

    if (Array.isArray(parsed)) {
      return parsed as OrderWithCancel[]
    }

  } catch (error) {

    console.error('讀取訂單失敗：', error)

  }

  return demoOrders
}

// =============================
// 4. App 主元件
// =============================

function App() {

  // 目前顯示的頁面
  const [currentPage, setCurrentPage] = useState('checkout')

  // 所有訂單
  const [orders, setOrders] =
    useState<OrderWithCancel[]>(loadOrders)

  // 目前查看的訂單
  const [selectedOrderId, setSelectedOrderId] =
    useState('ORD003')

  // =============================
  // 取消訂單視窗的狀態
  // =============================

  // 記錄目前準備取消哪一筆訂單
  const [cancelTargetId, setCancelTargetId] =
    useState<string | null>(null)

  // 使用者選擇的取消原因
  const [cancelReason, setCancelReason] =
    useState('')

  // 使用者自行輸入的取消原因
  const [otherReason, setOtherReason] =
    useState('')

  // =============================
  // 取得目前選擇的訂單
  // =============================

  const selectedOrder = orders.find(
    (order) => order.id === selectedOrderId
  )

  // =============================
  // 5. 訂單變更時，自動儲存
  // =============================

  useEffect(() => {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(orders)
    )

  }, [orders])

  // =============================
  // 6. 建立測試訂單
  // =============================

  function handleCreateOrder(newOrder: Order) {

    // 新訂單放在最上方
    setOrders((previousOrders) => [
      newOrder,
      ...previousOrders
    ])

    // 記錄新訂單 ID
    setSelectedOrderId(newOrder.id)

    // 自動切換到我的訂單
    setCurrentPage('list')
  }

  // =============================
  // 7. 查看訂單明細
  // =============================

  function handleViewDetail(orderId: string) {

    setSelectedOrderId(orderId)

    setCurrentPage('detail')
  }

  // =============================
  // 8. 開啟取消訂單視窗
  // =============================

  function handleCancelOrder(orderId: string) {

    // 找出要取消的訂單
    const targetOrder = orders.find(
      (order) => order.id === orderId
    )

    if (!targetOrder) {
      alert('找不到這筆訂單')
      return
    }

    // 只有待付款、待出貨可以取消
    if (
      targetOrder.status !== '待付款' &&
      targetOrder.status !== '待出貨'
    ) {
      alert('這筆訂單目前無法取消')
      return
    }

    // 記錄要取消的訂單
    setCancelTargetId(orderId)

    // 清空上一次選擇的原因
    setCancelReason('')
    setOtherReason('')
  }

  // =============================
  // 9. 關閉取消訂單視窗
  // =============================

  function closeCancelModal() {

    setCancelTargetId(null)

    setCancelReason('')
    setOtherReason('')
  }

  // =============================
  // 10. 確認取消訂單
  // =============================

  function confirmCancelOrder() {

    // 沒有選擇訂單
    if (!cancelTargetId) {
      return
    }

    // 沒有選原因
    if (!cancelReason) {
      alert('請先選擇取消原因')
      return
    }

    // 如果選其他原因，使用自己輸入的內容
    const finalReason =
      cancelReason === '其他原因'
        ? otherReason.trim()
        : cancelReason

    // 檢查原因不能空白
    if (!finalReason) {
      alert('請輸入取消原因')
      return
    }

    // 再次確認訂單狀態
    const targetOrder = orders.find(
      (order) => order.id === cancelTargetId
    )

    if (
      !targetOrder ||
      (
        targetOrder.status !== '待付款' &&
        targetOrder.status !== '待出貨'
      )
    ) {
      alert('此訂單目前無法取消')
      closeCancelModal()
      return
    }

    // =============================
    // 修改訂單資料
    // =============================

    setOrders((previousOrders) =>

      previousOrders.map((order) => {

        if (order.id === cancelTargetId) {

          return {
            ...order,

            // 修改訂單狀態
            status: '已取消' as const,

            // 儲存取消原因
            cancelReason: finalReason,

            // 儲存取消時間
            cancelledAt: new Date().toLocaleString('zh-TW')
          }

        }

        return order

      })

    )

    // 關閉視窗
    closeCancelModal()

    alert('測試訂單已取消')
  }

  // =============================
  // 11. React 畫面
  // =============================

  return (

    <div>

      {/* =============================
          頁面切換按鈕
      ============================= */}

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
          type="button"
          onClick={() => setCurrentPage('checkout')}
        >
          確認訂單
        </button>

        <button
          type="button"
          onClick={() => setCurrentPage('list')}
        >
          我的訂單
        </button>

        <button
          type="button"
          onClick={() => setCurrentPage('detail')}
        >
          訂單明細
        </button>

      </div>

      {/* =============================
          確認訂單頁面
      ============================= */}

      {currentPage === 'checkout' && (

        <CheckoutPage
          onCreateOrder={handleCreateOrder}
        />

      )}

      {/* =============================
          我的訂單頁面
      ============================= */}

      {currentPage === 'list' && (

        <OrderListPage
          orders={orders}
          onViewDetail={handleViewDetail}
          onCancelOrder={handleCancelOrder}
        />

      )}

      {/* =============================
          訂單明細頁面
      ============================= */}

      {currentPage === 'detail' && (

        <>

          <OrderDetailPage
            order={selectedOrder}
          />

          {/* 顯示取消原因 */}

          {selectedOrder?.status === '已取消' &&
            selectedOrder.cancelReason && (

            <div
              style={{
                maxWidth: '900px',
                margin: '20px auto 40px',
                padding: '24px',
                background: '#fff5f5',
                color: '#333',
                border: '1px solid #f3c5c5',
                borderRadius: '12px',
                boxSizing: 'border-box'
              }}
            >

              <h2 style={{ color: '#c0392b' }}>
                訂單取消資訊
              </h2>

              <p>
                <strong>取消原因：</strong>
                {selectedOrder.cancelReason}
              </p>

              <p>
                <strong>取消時間：</strong>
                {selectedOrder.cancelledAt || '未記錄'}
              </p>

            </div>

          )}

        </>

      )}

      {/* =============================
          取消訂單彈出視窗
      ============================= */}

      {cancelTargetId && (

        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px',
            boxSizing: 'border-box',
            zIndex: 9999
          }}
        >

          {/* 白色視窗 */}

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
            style={{
              width: '100%',
              maxWidth: '480px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '30px',
              background: 'white',
              color: '#333',
              borderRadius: '16px',
              boxSizing: 'border-box',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
            }}
          >

            {/* 標題 */}

            <h2
              id="cancel-modal-title"
              style={{ marginTop: 0 }}
            >
              取消訂單
            </h2>

            <p>
              訂單編號：<strong>{cancelTargetId}</strong>
            </p>

            <p style={{ color: '#666' }}>
              請選擇取消訂單的原因：
            </p>

            <hr />

            {/* =============================
                取消原因選項
            ============================= */}

            {cancelReasons.map((reason) => (

              <label
                key={reason}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 0',
                  cursor: 'pointer'
                }}
              >

                <input
                  type="radio"
                  name="cancelReason"
                  value={reason}
                  checked={cancelReason === reason}
                  onChange={(e) => {
                    setCancelReason(e.target.value)
                  }}
                />

                <span>{reason}</span>

              </label>

            ))}

            {/* =============================
                其他原因輸入框
            ============================= */}

            {cancelReason === '其他原因' && (

              <div style={{ marginTop: '15px' }}>

                <textarea
                  placeholder="請輸入取消原因"
                  value={otherReason}
                  maxLength={200}
                  onChange={(e) => {
                    setOtherReason(e.target.value)
                  }}
                  style={{
                    width: '100%',
                    height: '100px',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontSize: '15px'
                  }}
                />

              </div>

            )}

            <hr />

            {/* =============================
                視窗底部按鈕
            ============================= */}

            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginTop: '20px'
              }}
            >

              {/* 返回 */}

              <button
                type="button"
                onClick={closeCancelModal}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#eee',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                返回
              </button>

              {/* 確認取消 */}

              <button
                type="button"
                onClick={confirmCancelOrder}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#e53935',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                確認取消訂單
              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  )
}

export default App