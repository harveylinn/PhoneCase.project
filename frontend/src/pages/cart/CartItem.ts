export interface CartItem {
  variantId: number       // 商品規格 ID，對應 product_variants.id
  name: string            // 商品名稱
  brand: string           // 手機品牌
  model: string           // 手機型號
  color: string           // 商品顏色
  price: number           // 顯示用價格
  quantity: number        // 購買數量
  imageUrl: string        // 商品圖片
  selected: boolean       // 是否勾選結帳
}