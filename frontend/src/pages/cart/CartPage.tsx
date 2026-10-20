import { useEffect, useState } from 'react'
import type { CartItem } from './CartItem'
import './CartPage.css'
import CartItemCard from './CartItemCard'
import {getGuestCart,saveGuestCart,} from '../../utils/cartStorage'

function CartPage() {

    // 初始化購物車，從 localStorage 讀取資料
    const [cartItems, setCartItems] = useState<CartItem[]>(getGuestCart)


    // 當購物車資料改變時，透過共用函式保存
    useEffect(() => {
        saveGuestCart(cartItems)
    }, [cartItems])



    // 增加商品數量
    const increaseQuantity = (variantId: number) => {
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.variantId === variantId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
        )
    }

    // 減少商品數量
    const decreaseQuantity = (variantId: number) => {
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.variantId === variantId && item.quantity > 1
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            )
        )
    }

    // 刪除指定商品
    const removeItem = (variantId: number) => {
        setCartItems((prevItems) =>
            prevItems.filter((item) => item.variantId !== variantId)
        )
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
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.variantId === variantId
                    ? { ...item, selected: !item.selected }
                    : item
            )
        )
    }

    // 判斷是否全部勾選
    const isAllSelected =
        cartItems.length > 0 &&
        cartItems.every((item) => item.selected)

    // 全選或取消全選
    const toggleSelectAll = () => {
        const nextSelected = !isAllSelected

        setCartItems((prevItems) =>
            prevItems.map((item) => ({
                ...item,
                selected: nextSelected,
            }))
        )
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
            </div>


        </div>
    )
}

export default CartPage