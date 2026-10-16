// ========================================
// 1. 訂單商品資料
// ========================================

export type OrderItemRequest = {
  productName: string
  modelName: string
  color: string
  quantity: number
}

// ========================================
// 2. 建立訂單需要的資料
// ========================================

export type CreateOrderRequest = {

  // 收件人資料
  receiverName: string
  receiverPhone: string
  receiverAddress: string

  // 配送方式
  shippingMethod: 'HOME' | 'CVS'

  // 付款方式
  paymentMethod: 'CREDIT_CARD' | 'COD'

  // 綠界超商門市
  storeChain?: 'UNIMART' | 'FAMI'
  storeCode?: string
  storeName?: string
  storeLocation?: string

  // 訂單商品
  items: OrderItemRequest[]
}

// ========================================
// 3. 後端建立訂單成功的回傳資料
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
// 4. 呼叫 Spring Boot 建立訂單
// ========================================

export async function createOrder(
  orderData: CreateOrderRequest
): Promise<CreateOrderResponse> {

  const response = await fetch(
    'http://localhost:8080/api/orders',
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      // 傳送會員登入的 Session Cookie
      credentials: 'include',

      // 將訂單轉成 JSON
      body: JSON.stringify(orderData)
    }
  )

  // ========================================
  // 5. 處理錯誤
  // ========================================

  if (!response.ok) {

    if (response.status === 401) {
      throw new Error('請先登入會員，才能建立訂單')
    }

    if (response.status === 400) {
      throw new Error('訂單資料有誤，請檢查填寫內容')
    }

    throw new Error(
      `建立訂單失敗，HTTP 狀態碼：${response.status}`
    )
  }

  // ========================================
  // 6. 回傳後端建立成功的訂單
  // ========================================

  const result: CreateOrderResponse =
    await response.json()

  return result
}