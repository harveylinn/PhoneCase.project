import { useState, useEffect, useCallback } from 'react'

import CheckoutPage from './CheckoutPage'

import OrderListPage from './OrderListPage'

import type { Order } from './OrderListPage'

import OrderDetailPage from './OrderDetailPage'

import {
  getOrders,
  cancelOrder
} from '../../api/orderApi'

// ========================================
// 1. 取消原因
// ========================================

const cancelReasons = [
  '不想買了',
  '訂錯商品或數量',
  '想修改收件資訊',
  '重複下單',
  '其他原因'
]

// 取消原因目前僅保留於本次畫面
type CancelInfo = {
  reason: string
  cancelledAt: string
}

// ========================================
// 2. App
// ========================================

function OrderModule() {

  // 目前頁面
  const [currentPage, setCurrentPage] =
    useState('checkout')

  // MySQL 訂單資料
  const [orders, setOrders] =
    useState<Order[]>([])

  // 是否正在查詢
  const [loading, setLoading] =
    useState(true)

  // API 錯誤
  const [errorMessage, setErrorMessage] =
    useState('')

  // 目前查看的訂單
  const [selectedOrderId, setSelectedOrderId] =
    useState('')

  // 取消訂單視窗
  const [cancelTargetId, setCancelTargetId] =
    useState<string | null>(null)

  // 取消原因
  const [cancelReason, setCancelReason] =
    useState('')

  // 其他原因
  const [otherReason, setOtherReason] =
    useState('')

  // 是否正在取消訂單
  const [isCancelling, setIsCancelling] =
    useState(false)

  // 取消原因暫存
  const [cancelInfo, setCancelInfo] =
    useState<Record<string, CancelInfo>>({})

  // ========================================
  // 3. 從 MySQL 讀取訂單
  // ========================================

  const refreshOrders = useCallback(async () => {

    setLoading(true)
    setErrorMessage('')

    try {

      const data = await getOrders()

      setOrders(data)

    } catch (error) {

      console.error('讀取訂單失敗：', error)

      setErrorMessage(
        error instanceof Error
          ? error.message
          : '無法取得訂單資料'
      )

    } finally {

      setLoading(false)

    }

  }, [])

  // ========================================
  // 4. 網站開啟時讀取訂單
  // ========================================

  useEffect(() => {

    void refreshOrders()

  }, [refreshOrders])

  // ========================================
  // 5. 取得目前查看的訂單
  // ========================================

  const selectedOrder = orders.find(
    (order) => order.id === selectedOrderId
  )

  // ========================================
  // 6. 開啟我的訂單
  // ========================================

  function handleOpenOrderList() {

    setCurrentPage('list')

    // 每次進入都重新查詢資料庫
    void refreshOrders()
  }

  // ========================================
  // 7. 建立訂單成功
  // ========================================

  function handleCreateOrder(newOrder: Order) {

    // 後端已經建立成功才會執行這裡
    // 先立即更新畫面
    setOrders((previousOrders) => [

      newOrder,

      ...previousOrders.filter(
        (order) => order.id !== newOrder.id
      )

    ])

    setSelectedOrderId(newOrder.id)

    setCurrentPage('list')

    // 再從 MySQL 重新取得真正的資料
    void refreshOrders()
  }

  // ========================================
  // 8. 查看訂單明細
  // ========================================

  function handleViewDetail(orderId: string) {

    setSelectedOrderId(orderId)

    setCurrentPage('detail')
  }

  // ========================================
  // 9. 開啟取消訂單視窗
  // ========================================

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
      alert('這筆訂單目前無法取消')
      return
    }

    setCancelTargetId(orderId)

    setCancelReason('')

    setOtherReason('')
  }

  // ========================================
  // 10. 關閉取消視窗
  // ========================================

  function closeCancelModal() {

    if (isCancelling) {
      return
    }

    setCancelTargetId(null)

    setCancelReason('')

    setOtherReason('')
  }

  // ========================================
  // 11. 真正取消 MySQL 訂單
  // ========================================

  async function confirmCancelOrder() {

    if (!cancelTargetId || isCancelling) {
      return
    }

    if (!cancelReason) {
      alert('請先選擇取消原因')
      return
    }

    const finalReason =
      cancelReason === '其他原因'
        ? otherReason.trim()
        : cancelReason

    if (!finalReason) {
      alert('請輸入取消原因')
      return
    }

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

    setIsCancelling(true)

    try {

      // 呼叫 Spring Boot 更新 MySQL
      await cancelOrder(cancelTargetId)

      // 記住本次取消原因
      setCancelInfo((previous) => ({
        ...previous,
        [cancelTargetId]: {
          reason: finalReason,
          cancelledAt:
            new Date().toLocaleString('zh-TW')
        }
      }))

      // 立即更新 React 狀態
      setOrders((previousOrders) =>

        previousOrders.map((order) =>

          order.id === cancelTargetId

            ? {
                ...order,
                status: '已取消' as const
              }

            : order

        )

      )

      setCancelTargetId(null)
      setCancelReason('')
      setOtherReason('')

      // 重新從 MySQL 查詢
      await refreshOrders()

      alert('訂單已成功取消！')

    } catch (error) {

      console.error('取消訂單失敗：', error)

      alert(
        error instanceof Error
          ? error.message
          : '取消訂單失敗'
      )

    } finally {

      setIsCancelling(false)

    }
  }

  // ========================================
  // 12. React 畫面
  // ========================================

  return (

    <div>

      {/* ================================= */}
      {/* 頁面切換 */}
      {/* ================================= */}

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
          onClick={handleOpenOrderList}
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

      {/* ================================= */}
      {/* API 狀態 */}
      {/* ================================= */}

      {loading && (

        <p
          style={{
            textAlign: 'center',
            color: '#666'
          }}
        >
          正在從 MySQL 讀取訂單...
        </p>

      )}

      {errorMessage && (

        <div
          style={{
            maxWidth: '850px',
            margin: '20px auto',
            padding: '20px',
            background: '#fff3f3',
            color: '#c0392b',
            borderRadius: '10px'
          }}
        >

          <p>{errorMessage}</p>

          <button
            type="button"
            onClick={() => void refreshOrders()}
          >
            重新查詢
          </button>

        </div>

      )}

      {/* ================================= */}
      {/* 結帳頁面 */}
      {/* ================================= */}

      {currentPage === 'checkout' && (

        <CheckoutPage
          onCreateOrder={handleCreateOrder}
        />

      )}

      {/* ================================= */}
      {/* 我的訂單 */}
      {/* ================================= */}

      {currentPage === 'list' &&
        !loading &&
        !errorMessage && (

        <OrderListPage
          orders={orders}
          onViewDetail={handleViewDetail}
          onCancelOrder={handleCancelOrder}
        />

      )}

      {/* ================================= */}
      {/* 訂單明細 */}
      {/* ================================= */}

      {currentPage === 'detail' && (

        <>

          <OrderDetailPage
            order={selectedOrder}
          />

          {/* 本次操作的取消原因 */}

          {selectedOrder?.status === '已取消' &&
            cancelInfo[selectedOrder.id] && (

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
                {cancelInfo[selectedOrder.id].reason}
              </p>

              <p>
                <strong>取消時間：</strong>
                {cancelInfo[selectedOrder.id].cancelledAt}
              </p>

              <p style={{ color: '#888', fontSize: '13px' }}>
                目前取消原因僅在本次畫面暫存，
                訂單取消狀態已寫入 MySQL。
              </p>

            </div>

          )}

        </>

      )}

      {/* ================================= */}
      {/* 取消訂單視窗 */}
      {/* ================================= */}

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

            <h2
              id="cancel-modal-title"
              style={{ marginTop: 0 }}
            >
              取消訂單
            </h2>

            <p>
              訂單編號：
              <strong>{cancelTargetId}</strong>
            </p>

            <p style={{ color: '#666' }}>
              請選擇取消訂單的原因：
            </p>

            <hr />

            {/* 取消原因選項 */}

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
                  disabled={isCancelling}
                  onChange={(e) => {
                    setCancelReason(e.target.value)
                  }}
                />

                <span>{reason}</span>

              </label>

            ))}

            {/* 其他原因 */}

            {cancelReason === '其他原因' && (

              <div style={{ marginTop: '15px' }}>

                <textarea
                  placeholder="請輸入取消原因"
                  value={otherReason}
                  maxLength={200}
                  disabled={isCancelling}
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

            {/* 底部按鈕 */}

            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginTop: '20px'
              }}
            >

              <button
                type="button"
                onClick={closeCancelModal}
                disabled={isCancelling}
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

              <button
                type="button"
                onClick={() => void confirmCancelOrder()}
                disabled={isCancelling}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#e53935',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isCancelling
                    ? 'not-allowed'
                    : 'pointer'
                }}
              >

                {isCancelling
                  ? '取消訂單中...'
                  : '確認取消訂單'}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  )
}

export default OrderModule