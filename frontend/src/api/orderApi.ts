import type { Order } from '../pages/order/OrderListPage'

// ========================================
// 1. 商品資料
// ========================================

export type OrderItemRequest = {
  variantId: number
  quantity: number
}

// ========================================
// 2. 建立訂單的資料格式
// ========================================

export type CreateOrderRequest = {
  receiverName: string
  receiverPhone: string
  receiverAddress: string

  shippingMethod: 'HOME' | 'CVS'
  paymentMethod: 'CREDIT_CARD' | 'COD'

  storeChain?: 'UNIMART' | 'FAMI'
  storeCode?: string
  storeName?: string
  storeLocation?: string

  items: OrderItemRequest[]
}

// ========================================
// 3. 建立訂單的回傳格式
// ========================================

export type CreateOrderResponse = {
  success: boolean
  message: string
  orderNumber: string
  orderId: number
  totalAmount: number
  status: string
}

// ========================================
// 4. API 網址
// ========================================

const API_URL = 'http://localhost:8080/api/orders'

// ========================================
// 5. 建立訂單
// ========================================

export async function createOrder(
  orderData: CreateOrderRequest
): Promise<CreateOrderResponse> {

  const response = await fetch(API_URL, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json'
    },

    credentials: 'include',

    body: JSON.stringify(orderData)
  })

  if (!response.ok) {

    if (response.status === 401) {
      throw new Error('請先登入會員')
    }

    throw new Error(
      `建立訂單失敗：HTTP ${response.status}`
    )
  }

  return response.json()
}

// ========================================
// 6. 查詢我的訂單（新增）
// ========================================

export async function getOrders(): Promise<Order[]> {

  const response = await fetch(API_URL, {
    method: 'GET',

    credentials: 'include'
  })

  if (!response.ok) {

    if (response.status === 401) {
      throw new Error('請先使用測試會員登入')
    }

    throw new Error(
      `查詢訂單失敗：HTTP ${response.status}`
    )
  }

  return response.json()
}

// ========================================
// 7. 取消訂單（新增）
// ========================================

export async function cancelOrder(
  orderNumber: string
): Promise<void> {

  const response = await fetch(
    `${API_URL}/${encodeURIComponent(orderNumber)}/cancel`,
    {
      method: 'POST',

      credentials: 'include'
    }
  )

  if (!response.ok) {

    if (response.status === 401) {
      throw new Error('請先登入會員')
    }

    if (response.status === 400) {
      throw new Error('這筆訂單目前無法取消')
    }

    throw new Error(
      `取消訂單失敗：HTTP ${response.status}`
    )
  }
}