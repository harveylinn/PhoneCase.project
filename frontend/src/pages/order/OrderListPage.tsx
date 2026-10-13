import { useState } from 'react'

// 訂單狀態
export type OrderStatus =
  | '待付款'
  | '待出貨'
  | '已出貨'
  | '已完成'
  | '已取消'

// 訂單資料格式
export type Order = {
  id: string
  date: string
  productName: string
  model: string
  quantity: number
  total: number
  shippingFee: number
  status: OrderStatus

  // 新增：收件人資料
  receiverName?: string
  receiverPhone?: string
  receiverAddress?: string

  // 新增：配送與付款方式
  shippingMethod?: 'HOME' | 'CVS'
  paymentMethod?: 'CREDIT_CARD' | 'COD'

  // 新增：超商門市
  storeName?: string
  storeLocation?: string
}

// 原本的測試訂單
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

// App.tsx 傳進來的功能
type Props = {
  orders: Order[]
  onViewDetail: (orderId: string) => void
  onCancelOrder: (orderId: string) => void
}

function OrderListPage({
  orders,
  onViewDetail,
  onCancelOrder
}: Props) {

  const [filter, setFilter] = useState('全部')

  const [expandedOrderId, setExpandedOrderId] =
    useState<string | null>(null)

  const statusOptions = [
    '全部',
    '待付款',
    '待出貨',
    '已出貨',
    '已完成',
    '已取消'
  ]

  const filteredOrders = orders.filter(
    (order) =>
      filter === '全部' || order.status === filter
  )

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

      <p style={{ textAlign: 'center', color: '#888' }}>
        查看訂單紀錄與配送狀態
      </p>

      <hr />

      {/* 訂單狀態篩選 */}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          margin: '25px 0'
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
              background: filter === status ? '#333' : '#eee',
              color: filter === status ? 'white' : '#333',
              cursor: 'pointer'
            }}
          >
            {status}
          </button>

        ))}

      </div>

      {/* 沒有訂單 */}

      {filteredOrders.length === 0 && (

        <p style={{ textAlign: 'center', padding: '40px' }}>
          目前沒有符合條件的訂單
        </p>

      )}

      {/* 訂單列表 */}

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

          {/* 訂單基本資料 */}

          <div
            style={{
              padding: '20px',
              background: '#f8f9fa',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >

            <div>
              <strong>訂單編號：{order.id}</strong>
              <p>訂購日期：{order.date}</p>
            </div>

            <strong
              style={{
                color: order.status === '已取消'
                  ? '#999'
                  : '#2980b9'
              }}
            >
              {order.status}
            </strong>

          </div>

          {/* 商品資訊 */}

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

            <div style={{ flex: 1, minWidth: '140px' }}>
              <h3>{order.productName}</h3>
              <p>適用型號：{order.model}</p>
              <p>數量：{order.quantity}</p>
            </div>

            <div>
              <p>訂單總金額</p>
              <strong
                style={{
                  color: '#e53935',
                  fontSize: '22px'
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

            <button
              type="button"
              onClick={() => onViewDetail(order.id)}
              style={{
                padding: '10px 20px',
                background: '#333',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              查看訂單明細
            </button>

            {(order.status === '待付款' ||
              order.status === '待出貨') && (

              <button
                type="button"
                onClick={() => onCancelOrder(order.id)}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  color: '#e53935',
                  border: '1px solid #e53935',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                取消訂單
              </button>

            )}

          </div>

          {/* 展開資訊 */}

          {expandedOrderId === order.id && (

            <div
              style={{
                padding: '20px',
                background: '#fafafa'
              }}
            >

              <p>訂單編號：{order.id}</p>
              <p>訂購日期：{order.date}</p>
              <p>訂單狀態：{order.status}</p>
              <p>商品名稱：{order.productName}</p>
              <p>商品數量：{order.quantity}</p>

              <p>
                總金額：NT$ {order.total.toLocaleString()}
              </p>

            </div>

          )}

        </div>

      ))}

    </div>

  )
}

export default OrderListPage