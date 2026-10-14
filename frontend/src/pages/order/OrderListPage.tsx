import { useState } from 'react'

// =============================
// 1. 訂單狀態
// =============================

export type OrderStatus =
  | '待付款'
  | '待出貨'
  | '已出貨'
  | '已完成'
  | '已取消'

// =============================
// 2. 訂單資料格式
// =============================

export type Order = {
  id: string
  date: string
  productName: string
  model: string
  quantity: number
  total: number
  shippingFee: number
  status: OrderStatus

  receiverName?: string
  receiverPhone?: string
  receiverAddress?: string

  shippingMethod?: 'HOME' | 'CVS'
  paymentMethod?: 'CREDIT_CARD' | 'COD'

  storeName?: string
  storeLocation?: string

  cancelReason?: string
  cancelledAt?: string
}

// =============================
// 3. 模擬訂單資料
// =============================

export const demoOrders: Order[] = [
  {
    id: 'ORD001',
    date: '2026-10-12',
    productName: '透明防摔手機殼',
    model: 'iPhone 17 Pro',
    quantity: 2,
    total: 1260,
    shippingFee: 80,
    status: '待付款'
  },
  {
    id: 'ORD002',
    date: '2026-10-10',
    productName: '霧面黑色手機殼',
    model: 'iPhone 16',
    quantity: 1,
    total: 680,
    shippingFee: 80,
    status: '待出貨'
  },
  {
    id: 'ORD003',
    date: '2026-10-08',
    productName: '磁吸防摔手機殼',
    model: 'iPhone 16 Pro',
    quantity: 1,
    total: 890,
    shippingFee: 80,
    status: '已出貨'
  },
  {
    id: 'ORD004',
    date: '2026-10-05',
    productName: '透明手機殼',
    model: 'iPhone 15',
    quantity: 2,
    total: 1180,
    shippingFee: 80,
    status: '已完成'
  },
  {
    id: 'ORD005',
    date: '2026-10-01',
    productName: '矽膠手機殼',
    model: 'iPhone 14',
    quantity: 1,
    total: 450,
    shippingFee: 60,
    status: '已取消'
  }
]

// =============================
// 4. App.tsx 傳進來的功能
// =============================

type Props = {
  orders: Order[]
  onViewDetail: (orderId: string) => void
  onCancelOrder: (orderId: string) => void
}

// =============================
// 5. 我的訂單頁面
// =============================

function OrderListPage({
  orders,
  onViewDetail,
  onCancelOrder
}: Props) {

  // 目前選擇的訂單狀態
  const [filter, setFilter] = useState('全部')

  // 搜尋關鍵字
  const [searchKeyword, setSearchKeyword] = useState('')

  // 目前展開的訂單
  const [expandedOrderId, setExpandedOrderId] =
    useState<string | null>(null)

  // 訂單狀態選項
  const statusOptions = [
    '全部',
    '待付款',
    '待出貨',
    '已出貨',
    '已完成',
    '已取消'
  ]

  // =============================
  // 6. 搜尋 + 訂單狀態篩選
  // =============================

  const filteredOrders = orders.filter((order) => {

    // 檢查訂單狀態
    const matchStatus =
      filter === '全部' || order.status === filter

    // 移除搜尋文字前後的空白
    const keyword = searchKeyword.trim().toLowerCase()

    // 搜尋訂單編號、商品名稱、手機型號
    const matchKeyword =
      order.id.toLowerCase().includes(keyword) ||
      order.productName.toLowerCase().includes(keyword) ||
      order.model.toLowerCase().includes(keyword)

    // 兩個條件都符合才顯示
    return matchStatus && matchKeyword

  })

  // =============================
  // 7. 畫面
  // =============================

  return (

    <div
      style={{
        maxWidth: '950px',
        margin: '40px auto',
        padding: '30px',
        background: 'white',
        color: '#333',
        borderRadius: '12px',
        boxSizing: 'border-box'
      }}
    >

      <h1 style={{ textAlign: 'center' }}>
        我的訂單
      </h1>

      <p
        style={{
          textAlign: 'center',
          color: '#888'
        }}
      >
        查看訂單紀錄與配送狀態
      </p>

      <hr />

      {/* =============================
          搜尋訂單
      ============================= */}

      <h2>搜尋訂單</h2>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '25px'
        }}
      >

        <input
          type="text"
          placeholder="搜尋訂單編號、商品名稱或手機型號"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '14px',
            fontSize: '15px',
            border: '1px solid #ddd',
            borderRadius: '8px'
          }}
        />

        <button
          type="button"
          onClick={() => setSearchKeyword('')}
          style={{
            padding: '12px 20px',
            border: 'none',
            borderRadius: '8px',
            background: '#eee',
            color: '#333',
            cursor: 'pointer'
          }}
        >
          清除
        </button>

      </div>

      {/* =============================
          訂單狀態篩選
      ============================= */}

      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '25px'
        }}
      >

        {statusOptions.map((status) => (

          <button
            key={status}
            type="button"
            onClick={() => {
              setFilter(status)
              setExpandedOrderId(null)
            }}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              background:
                filter === status ? '#333' : '#eee',
              color:
                filter === status ? 'white' : '#333',
              cursor: 'pointer'
            }}
          >
            {status}
          </button>

        ))}

      </div>

      {/* 顯示搜尋結果數量 */}

      <p style={{ color: '#777' }}>
        共找到 {filteredOrders.length} 筆訂單
      </p>

      {/* =============================
          沒有符合條件的訂單
      ============================= */}

      {filteredOrders.length === 0 && (

        <div
          style={{
            padding: '50px',
            textAlign: 'center',
            background: '#f8f9fa',
            borderRadius: '12px'
          }}
        >

          <h3>找不到符合條件的訂單</h3>

          <p style={{ color: '#888' }}>
            請嘗試其他搜尋關鍵字或訂單狀態
          </p>

        </div>

      )}

      {/* =============================
          訂單列表
      ============================= */}

      {filteredOrders.map((order) => (

        <div
          key={order.id}
          style={{
            border: '1px solid #ddd',
            borderRadius: '12px',
            marginBottom: '20px',
            overflow: 'hidden'
          }}
        >

          {/* 訂單編號與狀態 */}

          <div
            style={{
              padding: '20px',
              background: '#f8f9fa',
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >

            <div>

              <strong>
                訂單編號：{order.id}
              </strong>

              <p style={{ color: '#777' }}>
                訂購日期：{order.date}
              </p>

            </div>

            <strong
              style={{
                color:
                  order.status === '已取消'
                    ? '#999'
                    : '#2980b9'
              }}
            >
              {order.status}
            </strong>

          </div>

          {/* 商品資料 */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px',
              padding: '20px'
            }}
          >

            <div
              style={{
                width: '85px',
                height: '85px',
                background: '#f5f5f5',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px'
              }}
            >
              📱
            </div>

            <div
              style={{
                flex: 1,
                minWidth: '140px'
              }}
            >

              <h3>{order.productName}</h3>

              <p>適用型號：{order.model}</p>

              <p>數量：{order.quantity}</p>

            </div>

            <div>

              <p>訂單總金額</p>

              <strong
                style={{
                  fontSize: '22px',
                  color: '#e53935'
                }}
              >
                NT$ {order.total.toLocaleString()}
              </strong>

            </div>

          </div>

          {/* 操作按鈕 */}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
              gap: '10px',
              padding: '20px',
              borderTop: '1px solid #eee'
            }}
          >

            {/* 展開資訊 */}

            <button
              type="button"
              onClick={() => {
                setExpandedOrderId(
                  expandedOrderId === order.id
                    ? null
                    : order.id
                )
              }}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {expandedOrderId === order.id
                ? '收起資訊'
                : '展開資訊'}
            </button>

            {/* 查看明細 */}

            <button
              type="button"
              onClick={() => onViewDetail(order.id)}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                background: '#333',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              查看訂單明細
            </button>

            {/* 取消訂單 */}

            {(order.status === '待付款' ||
              order.status === '待出貨') && (

              <button
                type="button"
                onClick={() => onCancelOrder(order.id)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #e53935',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#e53935',
                  cursor: 'pointer'
                }}
              >
                取消訂單
              </button>

            )}

          </div>

          {/* 展開詳細資訊 */}

          {expandedOrderId === order.id && (

            <div
              style={{
                padding: '20px',
                background: '#fafafa',
                borderTop: '1px solid #eee'
              }}
            >

              <p>訂單編號：{order.id}</p>

              <p>訂購日期：{order.date}</p>

              <p>訂單狀態：{order.status}</p>

              <p>商品名稱：{order.productName}</p>

              <p>手機型號：{order.model}</p>

              <p>商品數量：{order.quantity}</p>

              <p>
                訂單總金額：
                NT$ {order.total.toLocaleString()}
              </p>

              {order.cancelReason && (

                <p>
                  取消原因：{order.cancelReason}
                </p>

              )}

            </div>

          )}

        </div>

      ))}

    </div>

  )
}

export default OrderListPage