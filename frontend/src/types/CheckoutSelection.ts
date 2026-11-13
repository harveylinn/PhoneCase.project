/**
 * Cart → Order 資料交接型別
 */

// 1. 單筆結帳商品
export type CheckoutItem = {
    variantId: number
    quantity: number
}

// 2. 會員結帳資料
export type CheckoutSelection = {
    source: 'member-cart'
    memberId: number
    items: CheckoutItem[]
}