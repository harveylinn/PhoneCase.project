import type { CartItem } from './CartItem'
import { Minus, Plus, Trash2 } from 'lucide-react'

interface CartItemCardProps {
    item: CartItem
    onIncrease: (variantId: number) => void
    onDecrease: (variantId: number) => void
    onRemove: (variantId: number) => void
    onToggleSelect: (variantId: number) => void
}

function CartItemCard({
    item,
    onIncrease,
    onDecrease,
    onRemove,
    onToggleSelect,
}: CartItemCardProps) {

    return (
        <div className="cart-item-card">

            {/* 商品資訊 */}
            <div className="cart-item-content">
                <input
                    type="checkbox"
                    className="cart-item-checkbox"
                    checked={item.selected}
                    onChange={() => onToggleSelect(item.variantId)}
                    aria-label={`選取${item.name}`}
                />

                <img
                    className="cart-item-image"
                    src={item.imageUrl}
                    alt={item.name}
                />

                <div className="cart-item-info">
                    <h2>{item.name}</h2>

                    {/* 顯示手機品牌、型號及顏色 */}
                    <p>
                        規格：{item.brand} / {item.model} / {item.color}
                    </p>

                    <p>
                        單價：NT$ {item.price.toLocaleString('en-US')}
                    </p>

                    <p>
                        小計：NT$ {(item.price * item.quantity).toLocaleString('en-US')}
                    </p>
                </div>
            </div>

            {/* 商品操作 */}
            <div className="cart-item-actions">
                <div className="cart-quantity-control">
                    <button
                        type="button"
                        className="cart-icon-button"
                        onClick={() => onDecrease(item.variantId)}
                        disabled={item.quantity <= 1}
                        aria-label="減少數量"
                    >
                        <Minus size={18} />
                    </button>

                    <span className="cart-quantity">
                        {item.quantity}
                    </span>

                    <button
                        type="button"
                        className="cart-icon-button"
                        onClick={() => onIncrease(item.variantId)}
                        aria-label="增加數量"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <button
                    type="button"
                    className="cart-remove-button"
                    onClick={() => onRemove(item.variantId)}
                    aria-label={`刪除${item.name}`}
                >
                    <Trash2 size={18} />
                </button>
            </div>

        </div>
    )
}

export default CartItemCard