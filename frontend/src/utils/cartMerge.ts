
import { getGuestCart, saveGuestCart } from './cartStorage'
import {
    mergeMemberCart,
    type MergeCartItem
} from '../services/cartApi'

// 儲存尚未確認完成的合併請求
const PENDING_MERGE_KEY = 'pendingCartMergeV1'

type PendingMerge = {
    mergeId: string
    memberId: number
    items: MergeCartItem[]
}

// 檢查本機是否存在未完成的合併請求
function readPendingMerge(): PendingMerge | null {
    const saved = localStorage.getItem(PENDING_MERGE_KEY)

    if (saved === null) return null

    let value: unknown

    try {
        value = JSON.parse(saved)
    } catch {
        throw new Error('購物車合併紀錄無法解析，已停止合併')
    }

    if (
        typeof value !== 'object' ||
        value === null ||
        !('mergeId' in value) ||
        !('memberId' in value) ||
        !('items' in value) ||
        typeof value.mergeId !== 'string' ||
        !Number.isSafeInteger(value.memberId) ||
        !Array.isArray(value.items) ||
        !value.items.every(
            (item: unknown) =>
                typeof item === 'object' &&
                item !== null &&
                'variantId' in item &&
                'quantity' in item &&
                Number.isSafeInteger(item.variantId) &&
                Number(item.variantId) > 0 &&
                Number.isSafeInteger(item.quantity) &&
                Number(item.quantity) > 0
        )
    ) {
        throw new Error('購物車合併紀錄格式不正確，已停止合併')
    }

    return value as PendingMerge
}

// 登入後執行訪客購物車合併
export async function mergeGuestCartAfterLogin(
    token: string,
    memberId: number,
    isActive: () => boolean
): Promise<void> {

    // 1. 先檢查是否有前一次尚未確認完成的合併
    let pending = readPendingMerge()

    // 2. 原有合併只能由當初指定的會員繼續處理
    if (pending && pending.memberId !== memberId) {
        throw new Error(
            '存在其他會員尚未完成的購物車合併，已停止自動合併'
        )
    }

    // 3. 沒有待處理紀錄時，才建立新的合併工作
    if (!pending) {
        const guestItems = getGuestCart()

        // 資料損壞時不可當成空購物車
        if (guestItems === null) {
            throw new Error('無法讀取訪客購物車，已停止合併')
        }

        // 訪客沒有商品，直接沿用會員 GET 流程
        if (guestItems.length === 0) return

        // 同一規格的商品先整理成一筆
        const quantities = new Map<number, number>()

        for (const item of guestItems) {
            const quantity =
                (quantities.get(item.variantId) ?? 0) + item.quantity

            if (!Number.isSafeInteger(quantity)) {
                throw new Error('訪客商品數量超出可處理範圍')
            }

            quantities.set(item.variantId, quantity)
        }

        pending = {
            mergeId: crypto.randomUUID(),
            memberId,
            items: [...quantities].map(([variantId, quantity]) => ({
                variantId,
                quantity
            }))
        }

        // 重要：發送 API 前先持久化 mergeId
        // 若儲存失敗，不能發送合併請求
        localStorage.setItem(
            PENDING_MERGE_KEY,
            JSON.stringify(pending)
        )
    }

    // 4. 如果登入身分已改變，不繼續送出請求
    if (!isActive()) return

    // 5. 使用固定 mergeId 呼叫後端
    // API 失敗時保留待處理紀錄，之後可以安全重試
    await mergeMemberCart(
        token,
        pending.mergeId,
        pending.items
    )

    // 6. 會員身分切換時，保留待處理紀錄
    if (!isActive()) return

    // 7. 後端已確認成功，才處理訪客商品
    const currentGuestItems = getGuestCart()

    if (currentGuestItems === null) {
        throw new Error(
            '會員合併成功，但無法更新訪客購物車；請勿重複加入商品'
        )
    }

    // 8. 依原本合併的數量扣除訪客商品
    // 避免直接清空整個 localStorage 購物車
    const remaining = new Map(
        pending.items.map(item => [item.variantId, item.quantity])
    )

    const updatedGuestItems = currentGuestItems.flatMap(item => {
        const mergedQuantity = remaining.get(item.variantId) ?? 0

        if (mergedQuantity === 0) return [item]

        const deducted = Math.min(item.quantity, mergedQuantity)

        remaining.set(item.variantId, mergedQuantity - deducted)

        const quantity = item.quantity - deducted

        return quantity > 0
            ? [{ ...item, quantity }]
            : []
    })

    // 9. 訪客資料儲存成功後，才移除待處理紀錄
    if (!saveGuestCart(updatedGuestItems)) {
        throw new Error(
            '會員合併成功，但訪客購物車更新失敗'
        )
    }

    // 10. 清除已完成的合併工作
    localStorage.removeItem(PENDING_MERGE_KEY)
}
