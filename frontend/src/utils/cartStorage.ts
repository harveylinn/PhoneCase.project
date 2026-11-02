import type { CartItem } from '../pages/cart/CartItem'

// 統一購物車在 localStorage 使用的 Key
const CART_STORAGE_KEY = 'guestCart'

// 讀取訪客購物車
export function getGuestCart(): CartItem[] | null {
    try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY)

        if (savedCart === null) {
            return []
        }

        const parsedCart: unknown = JSON.parse(savedCart)

        if (!Array.isArray(parsedCart)) {
            console.warn('購物車資料不是陣列')
            return null
        }

        const isValidCart = parsedCart.every((item) =>
            item !== null &&
            typeof item === 'object' &&
            typeof item.variantId === 'number' &&
            Number.isSafeInteger(item.variantId) &&
            item.variantId > 0 &&
            typeof item.name === 'string' &&
            typeof item.brand === 'string' &&
            typeof item.model === 'string' &&
            typeof item.color === 'string' &&
            typeof item.price === 'number' &&
            Number.isFinite(item.price) &&
            item.price >= 0 &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0 &&
            typeof item.imageUrl === 'string' &&
            typeof item.selected === 'boolean'
        )

        if (!isValidCart) {
            console.warn('購物車資料格式不符合目前版本')
            return null
        }

        return parsedCart as CartItem[]
    } catch (error) {
        console.error('讀取購物車失敗：', error)
        return null
    }
}

// 保存訪客購物車
export function saveGuestCart(items: CartItem[]): boolean {
    try {
        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(items)
        )

        window.dispatchEvent(new Event('cartUpdated'))
        return true
    } catch (error) {
        console.error('儲存購物車失敗：', error)
        return false
    }
}

// 新增商品到訪客購物車
export function addToGuestCart(
    product: Omit<CartItem, 'quantity' | 'selected'>,
    quantity: number = 1
): void {
    // 不接受不合法的商品數量
    if (!Number.isInteger(quantity) || quantity <= 0) {
        return
    }

    const cart = getGuestCart()

    if (cart === null) {
    console.error('無法讀取購物車，已取消新增商品')
    return
}

    // 檢查購物車是否已有相同商品
    const existingItem = cart.find(
        (item) => item.variantId === product.variantId
    )

    let updatedCart: CartItem[]

    if (existingItem) {
        // 已有商品：增加數量
        updatedCart = cart.map((item) =>
            item.variantId === product.variantId
                ? { ...item, quantity: item.quantity + quantity }
                : item
        )
    } else {
        // 新商品：加入購物車
        updatedCart = [
            ...cart,
            {
                ...product,
                quantity,
                selected: true,
            },
        ]
    }

    saveGuestCart(updatedCart)
}

// 計算購物車內所有商品的總數量

export function getGuestCartCount(): number {
    const cart = getGuestCart()

    if (cart === null) {
        return 0
    }

    return cart.reduce(
        (total, item) => total + item.quantity,
        0
    )
}
