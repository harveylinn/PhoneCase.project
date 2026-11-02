import { useEffect, useState } from 'react'
import type { CartItem } from './CartItem'
import './CartPage.css'
import CartItemCard from './CartItemCard'
import { getGuestCart, saveGuestCart, } from '../../utils/cartStorage'
import { useNavigate } from 'react-router-dom'

function CartPage() {
    const navigate = useNavigate()

    // 初始化購物車，從 localStorage 讀取資料
    const [cartItems, setCartItems] = useState<CartItem[]>(() => {
        return getGuestCart() ?? []
    })

    // 當其他元件或分頁更新購物車時，重新讀取資料
    useEffect(() => {
        const refreshCart = () => {
            const latestCart = getGuestCart()

            if (latestCart !== null) {
                setCartItems(latestCart)
            }
        }

        // 同一分頁：監聽自訂購物車更新事件
        window.addEventListener('cartUpdated', refreshCart)

        // 不同分頁：監聽瀏覽器 storage 事件
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'guestCart' || event.key === null) {
                refreshCart()
            }
        }

        window.addEventListener('storage', handleStorageChange)

        return () => {
            window.removeEventListener('cartUpdated', refreshCart)
            window.removeEventListener('storage', handleStorageChange)
        }
    }, [])

    // 增加商品數量
    const increaseQuantity = (variantId: number) => {
        // 1. 先取得 localStorage 最新資料
        const latestCart = getGuestCart()

        // 2. 讀取失敗就停止，避免覆蓋資料
        if (latestCart === null) {
            console.error('無法讀取購物車，取消增加數量')
            return
        }

        // 3. 根據最新資料增加商品數量
        const updatedCart = latestCart.map((item) =>
            item.variantId === variantId &&
                Number.isSafeInteger(item.quantity + 1)
                ? { ...item, quantity: item.quantity + 1 }
                : item
        )

        // 4. 儲存成功後才更新畫面
        if (saveGuestCart(updatedCart)) {
            setCartItems(updatedCart)
        }
    }

    // 減少商品數量
    const decreaseQuantity = (variantId: number) => {
        // 1. 取得最新購物車
        const latestCart = getGuestCart()

        // 2. 讀取失敗就停止
        if (latestCart === null) {
            console.error('無法讀取購物車，取消減少數量')
            return
        }

        // 3. 修改指定商品數量
        const updatedCart = latestCart.map((item) =>
            item.variantId === variantId && item.quantity > 1
                ? { ...item, quantity: item.quantity - 1 }
                : item
        )

        // 4. 儲存成功後更新 React State
        if (saveGuestCart(updatedCart)) {
            setCartItems(updatedCart)
        }
    }

    // 刪除指定商品
    const removeItem = (variantId: number) => {
        const latestCart = getGuestCart()

        if (latestCart === null) {
            console.error('無法讀取購物車，取消刪除商品')
            return
        }

        const updatedCart = latestCart.filter(
            (item) => item.variantId !== variantId
        )

        if (saveGuestCart(updatedCart)) {
            setCartItems(updatedCart)
        }
    }

    // 計算購物車總金額
    const totalPrice = cartItems
        .filter((item) => item.selected)
        .reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        )

    // 切換單一商品勾選狀態
    const toggleSelect = (variantId: number) => {
        const latestCart = getGuestCart()

        if (latestCart === null) {
            console.error('無法讀取購物車，取消切換勾選狀態')
            return
        }

        const updatedCart = latestCart.map((item) =>
            item.variantId === variantId
                ? { ...item, selected: !item.selected }
                : item
        )

        if (saveGuestCart(updatedCart)) {
            setCartItems(updatedCart)
        }
    }

    // 根據 React State 判斷畫面上的商品是否全部勾選
    const isAllSelected =
        cartItems.length > 0 &&
        cartItems.every((item) => item.selected)

    // 全選或取消全選
    const toggleSelectAll = () => {
        // 1. 取得最新購物車
        const latestCart = getGuestCart()

        // 2. 讀取失敗就停止
        if (latestCart === null) {
            console.error('無法讀取購物車，取消全選操作')
            return
        }

        // 3. 空購物車不需要操作
        if (latestCart.length === 0) {
            return
        }

        // 4. 根據最新資料判斷下一個勾選狀態
        const allSelected = latestCart.every(
            (item) => item.selected
        )

        const nextSelected = !allSelected

        // 5. 更新每個商品的勾選狀態
        const updatedCart = latestCart.map((item) => ({
            ...item,
            selected: nextSelected,
        }))

        // 6. 儲存成功後更新畫面
        if (saveGuestCart(updatedCart)) {
            setCartItems(updatedCart)
        }
    }

    // 暫時開放訪客前往結帳頁，供訂單組員測試
    const handleCheckout = () => {
        const selectedItems = cartItems.filter(
            item => item.selected
        )

        if (selectedItems.length === 0) {
            return
        }

        navigate('/checkout')
    }


    return (
        <div className="cart-page">
            <h1>我的購物車</h1>


            <label className="cart-select-all">
                <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    disabled={cartItems.length === 0}
                />
                全選商品
            </label>

            {cartItems.length === 0 && (
                <p>購物車目前沒有商品</p>
            )}

            <div className="cart-list">
                {cartItems.map((item) => (
                    <CartItemCard
                        key={item.variantId}
                        item={item}
                        onIncrease={increaseQuantity}
                        onDecrease={decreaseQuantity}
                        onRemove={removeItem}
                        onToggleSelect={toggleSelect}
                    />
                ))}
            </div>

            <div className="cart-summary">
                <h2>購物車總金額</h2>
                <h2>NT$ {totalPrice.toLocaleString('en-US')}</h2>
                <button
                    type="button"
                    className="cart-checkout-button"
                    onClick={handleCheckout}
                    disabled={!cartItems.some(item => item.selected)}
                >
                    前往結帳
                </button>
            </div>

        </div>
    )
}

export default CartPage