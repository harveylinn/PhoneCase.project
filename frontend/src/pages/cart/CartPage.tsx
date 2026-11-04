
import { useEffect, useRef, useState } from 'react'
import { useLocation,useNavigate } from 'react-router-dom'

import type { CartItem } from './CartItem'
import CartItemCard from './CartItemCard'
import './CartPage.css'

// 1. 訪客登入導向
import { getLoginUrl } from '../../utils/authRedirect'

// 2. Cart → Order 共用資料型別
import type {
    CheckoutSelection
} from '../../types/CheckoutSelection'


// 訪客購物車：使用 localStorage
import {
    getGuestCart,
    saveGuestCart
} from '../../utils/cartStorage'

// 會員登入狀態
import { useAuth } from '../../auth/useAuth'

// 會員購物車：Spring Boot API
import {
    getMemberCart,
    updateMemberCartItem,
    deleteMemberCartItem
} from '../../services/cartApi'

// 將後端購物車與商品資料整合成 React CartItem
import {
    mapMemberCartItems,
    type ProductData
} from './cartMapper'

// 訪客登入後自動合併會員購物車
import {
    mergeGuestCartAfterLogin
} from '../../utils/cartMerge'


// ==========================================
// TypeScript 型別定義
// ==========================================

// 每份購物車資料都標記所屬身分
// 避免會員 A、會員 B、訪客之間的商品混用
type CartData = {
    owner: string
    items: CartItem[]
}

// 會員購物車 API 載入狀態
type MemberLoad = {
    owner: string
    state: 'loading' | 'success' | 'error'
    error: string | null
}

// 記錄目前有幾筆會員購物車操作尚未完成
type PendingOperations = {
    owner: string
    count: number
}

// 會員購物車支援的修改動作
type CartOperation = 'increase' | 'decrease' | 'remove'


function CartPage() {

    // ==========================================
    // 一、取得路由與會員登入狀態
    // ==========================================

    // 1. 頁面跳轉
    const navigate = useNavigate()

    // 2. 取得目前路由，提供登入後導回使用
    const location = useLocation()

    // 透過 AuthProvider 取得會員狀態
    const { status, currentMember } = useAuth()

    // 取得目前會員 ID
    const memberId = currentMember?.id

    // 判斷購物車屬於哪一種身分
    // 例如：
    // guest       -> 訪客
    // member:1    -> 會員 1
    // member:2    -> 會員 2
    const owner =
        status === 'authenticated' && memberId != null
            ? `member:${memberId}`
            : status


    // ==========================================
    // 二、React State：購物車資料
    // ==========================================

    // 初始化購物車：
    // 1. 訪客 -> 讀取 localStorage
    // 2. 會員 -> 等待 Spring Boot API
    //
    // owner 用來記錄這份資料屬於誰
    const [cartData, setCartData] = useState<CartData>(() => ({
        owner: status === 'guest' ? 'guest' : '',
        items: status === 'guest'
            ? getGuestCart() ?? []
            : []
    }))

    // 會員購物車載入狀態
    const [memberLoad, setMemberLoad] =
        useState<MemberLoad | null>(null)

    // 會員購物車是否有 API 修改操作進行中
    const [pendingOperations, setPendingOperations] =
        useState<PendingOperations>({
            owner: '',
            count: 0
        })

    // 會員增加、減少、刪除失敗時的錯誤訊息
    const [operationError, setOperationError] =
        useState<string | null>(null)


    // ==========================================
    // 三、useRef：會員工作階段與操作鎖
    // ==========================================

    // 記錄目前登入工作階段的版本
    // 避免登出後重新登入時，舊 API 回應覆蓋新資料
    const sessionVersionRef = useRef(0)

    // 記錄目前畫面上的登入身分
    const currentIdentityRef = useRef(owner)

    // 每次 React 渲染時更新目前身分
    currentIdentityRef.current = owner

    // 操作鎖：
    // 1. version -> 所屬工作階段
    // 2. ids     -> 正在修改的 cartItemId
    //
    // 同一工作階段內，同一筆商品不能同時修改
    const operationLocksRef = useRef<{
        version: number
        ids: Set<number>
    }>({
        version: -1,
        ids: new Set<number>()
    })


    // ==========================================
    // 四、依登入身分取得購物車顯示資料
    // ==========================================

    // 只有資料屬於目前身分時，才允許顯示
    // 避免會員切換時短暫顯示其他人的商品
    const cartItems =
        cartData.owner === owner
            ? cartData.items
            : []

    // 判斷會員購物車是否已經成功載入
    const isMemberReady =
        status === 'authenticated' &&
        memberId != null &&
        memberLoad?.owner === owner &&
        memberLoad.state === 'success' &&
        cartData.owner === owner

    // 判斷會員購物車是否正在載入
    const isMemberCartLoading =
        status === 'authenticated' &&
        (
            memberLoad?.owner !== owner ||
            memberLoad.state === 'loading'
        )

    // 取得目前會員的 API 載入錯誤
    const memberCartError =
        memberLoad?.owner === owner &&
            memberLoad.state === 'error'
            ? memberLoad.error
            : null

    // 判斷目前會員是否正在修改購物車
    const isMemberCartUpdating =
        pendingOperations.owner === owner &&
        pendingOperations.count > 0


    // ==========================================
    // 五、訪客購物車：localStorage 同步
    // ==========================================

    useEffect(() => {

        // 只有訪客需要監聽 localStorage
        if (status !== 'guest') return

        // 1. 重新取得最新的訪客購物車
        const refreshCart = () => {
            const latestCart = getGuestCart()

            // 讀取失敗時，不覆蓋原本資料
            if (latestCart !== null) {
                setCartData({
                    owner: 'guest',
                    items: latestCart
                })
            }
        }

        // 2. 進入訪客模式時主動載入
        refreshCart()

        // 3. 同一分頁監聽自訂事件
        window.addEventListener(
            'cartUpdated',
            refreshCart
        )

        // 4. 不同分頁監聽 storage 事件
        const handleStorageChange = (event: StorageEvent) => {
            if (
                event.key === 'guestCart' ||
                event.key === null
            ) {
                refreshCart()
            }
        }

        window.addEventListener(
            'storage',
            handleStorageChange
        )

        // 5. 元件卸載或離開訪客模式時清理監聽
        return () => {
            window.removeEventListener(
                'cartUpdated',
                refreshCart
            )

            window.removeEventListener(
                'storage',
                handleStorageChange
            )
        }

    }, [status])


    // ==========================================
    // 六、會員購物車：GET API 讀取
    // ==========================================

    useEffect(() => {

        // 1. 每次登入狀態或會員 ID 改變
        //    都建立新的工作階段版本
        sessionVersionRef.current += 1

        const requestVersion = sessionVersionRef.current

        // 2. 不是已登入會員就不呼叫 Cart API
        if (
            status !== 'authenticated' ||
            memberId == null
        ) {
            return () => {
                sessionVersionRef.current += 1
            }
        }

        const requestOwner = `member:${memberId}`

        // 3. 建立取消請求的控制器
        const controller = new AbortController()

        let cancelled = false

        // 4. 記錄載入中狀態
        setMemberLoad({
            owner: requestOwner,
            state: 'loading',
            error: null
        })

        setOperationError(null)

        const loadMemberCart = async () => {
            try {

                // 5. 取得 JWT Token
                const token = localStorage.getItem('token')

                if (!token) {
                    throw new Error('找不到會員登入 Token')
                }

                // 6-A. 確認目前的登入工作階段是否仍有效
                const isActiveSession = () =>
                    !cancelled &&
                    sessionVersionRef.current === requestVersion &&
                    currentIdentityRef.current === requestOwner

                // 6-B. 登入會員後，先將訪客商品合併到 MySQL
                //      訪客購物車為空時，此函式會直接返回
                await mergeGuestCartAfterLogin(
                    token,
                    memberId,
                    isActiveSession
                )

                // 6-C. 如果使用者已登出或切換會員，停止舊請求
                if (!isActiveSession()) return

                // 6-D. 合併完成後，再取得最新會員購物車
                const memberItems = await getMemberCart(token)

                // 7. 確認請求仍屬於目前工作階段
                if (
                    cancelled ||
                    sessionVersionRef.current !== requestVersion
                ) {
                    return
                }

                let mappedItems: CartItem[] = []

                // 8. 有商品時才讀取商品資料
                if (memberItems.length > 0) {

                    const response = await fetch(
                        '/api/products/available',
                        {
                            signal: controller.signal
                        }
                    )

                    if (!response.ok) {
                        throw new Error(
                            `商品資料讀取失敗：HTTP ${response.status}`
                        )
                    }

                    const products: ProductData[] =
                        await response.json()

                    // 9. 將會員購物車與商品資料合併
                    mappedItems = mapMemberCartItems(
                        memberItems,
                        products
                    )

                    // 10. 檢查是否有商品規格遺漏
                    if (
                        mappedItems.length !== memberItems.length
                    ) {
                        throw new Error(
                            '部分購物車商品無法取得完整資訊'
                        )
                    }
                }

                // 11. 避免舊 API 回應覆蓋新會員畫面
                if (
                    cancelled ||
                    sessionVersionRef.current !== requestVersion ||
                    currentIdentityRef.current !== requestOwner
                ) {
                    return
                }

                // 12. 成功後更新 React 購物車
                setCartData({
                    owner: requestOwner,
                    items: mappedItems
                })

                // 13. 記錄載入成功
                setMemberLoad({
                    owner: requestOwner,
                    state: 'success',
                    error: null
                })

                // 通知 Navbar 重新取得會員購物車數量
                window.dispatchEvent(new Event('memberCartUpdated'))

            } catch (error) {

                // 已取消的請求不更新畫面
                if (cancelled) return

                if (
                    sessionVersionRef.current !== requestVersion ||
                    currentIdentityRef.current !== requestOwner
                ) {
                    return
                }

                console.error(
                    '會員購物車載入失敗：',
                    error
                )

                // 14. 載入失敗時記錄錯誤
                setCartData({
                    owner: requestOwner,
                    items: []
                })

                setMemberLoad({
                    owner: requestOwner,
                    state: 'error',
                    error: error instanceof Error
                        ? error.message
                        : '會員購物車載入失敗'
                })
            }
        }

        void loadMemberCart()

        // 15. 清理舊請求
        return () => {
            cancelled = true
            controller.abort()
            sessionVersionRef.current += 1
        }

    }, [status, memberId])


    // ==========================================
    // 七、訪客購物車：共用修改函式
    // ==========================================

    // updater 是一個函式
    // 用來描述如何修改購物車資料
    const updateGuestCart = (
        updater: (items: CartItem[]) => CartItem[]
    ) => {

        // 1. 只有訪客可以使用這段邏輯
        if (status !== 'guest') return

        // 2. 每次操作前讀取最新 localStorage
        const latestCart = getGuestCart()

        if (latestCart === null) {
            console.error('無法讀取訪客購物車')
            return
        }

        // 3. 執行傳入的修改函式
        const updatedCart = updater(latestCart)

        // 4. 儲存成功後更新 React State
        if (saveGuestCart(updatedCart)) {
            setCartData({
                owner: 'guest',
                items: updatedCart
            })
        }
    }


    // ==========================================
    // 八、會員購物車：共用 CRUD API 操作
    // ==========================================

    // operation 有三種：
    // increase -> 增加數量
    // decrease -> 減少數量
    // remove   -> 刪除商品
    const runMemberOperation = async (
        variantId: number,
        operation: CartOperation
    ) => {

        // 1. 確認會員資料已載入完成
        if (!isMemberReady || isMemberCartUpdating) return

        // 2. 根據 variantId 找出商品
        const item = cartItems.find(
            cartItem => cartItem.variantId === variantId
        )

        // 3. 必須有資料庫的 cartItemId
        if (item?.cartItemId == null) return

        // 4. 商品數量最低為 1
        if (
            operation === 'decrease' &&
            item.quantity <= 1
        ) {
            return
        }

        // 5. 避免增加數量造成不安全的整數
        if (
            operation === 'increase' &&
            !Number.isSafeInteger(item.quantity + 1)
        ) {
            return
        }

        // 6. 取得 JWT Token
        const token = localStorage.getItem('token')

        if (!token) {
            setOperationError('找不到會員登入 Token')
            return
        }

        // 7. 記錄送出 API 時的會員身分與版本
        const requestOwner = owner
        const requestVersion = sessionVersionRef.current
        const cartItemId = item.cartItemId

        // 8. 如果工作階段不同，就建立新操作鎖
        if (
            operationLocksRef.current.version !== requestVersion
        ) {
            operationLocksRef.current = {
                version: requestVersion,
                ids: new Set<number>()
            }
        }

        const lock = operationLocksRef.current

        // 9. 同一筆商品正在修改時不重複送出請求
        if (lock.ids.has(cartItemId)) return

        // 10. 將商品加入操作鎖
        lock.ids.add(cartItemId)

        setOperationError(null)

        setPendingOperations({
            owner: requestOwner,
            count: lock.ids.size
        })

        // 11. 檢查 API 回傳時是否仍屬於同一工作階段
        const isSameSession = () =>
            currentIdentityRef.current === requestOwner &&
            sessionVersionRef.current === requestVersion

        try {

            // 12-A. 刪除商品：DELETE
            if (operation === 'remove') {

                await deleteMemberCartItem(
                    token,
                    cartItemId
                )

                if (!isSameSession()) return

                // 會員刪除商品成功，通知 Navbar
                window.dispatchEvent(new Event('memberCartUpdated'))

                // 後端刪除成功才從畫面移除
                setCartData(previous => {
                    if (previous.owner !== requestOwner) {
                        return previous
                    }

                    return {
                        ...previous,
                        items: previous.items.filter(
                            cartItem =>
                                cartItem.cartItemId !== cartItemId
                        )
                    }
                })

            } else {

                // 12-B. 增加或減少商品：PATCH
                const newQuantity =
                    operation === 'increase'
                        ? item.quantity + 1
                        : item.quantity - 1

                // 13. 將修改後的總數量送給後端
                const updatedItem =
                    await updateMemberCartItem(
                        token,
                        cartItemId,
                        newQuantity
                    )

                if (!isSameSession()) return

                // 會員商品數量更新成功，通知 Navbar
                window.dispatchEvent(new Event('memberCartUpdated'))

                // 14. 後端成功後才更新畫面數量
                setCartData(previous => {
                    if (previous.owner !== requestOwner) {
                        return previous
                    }

                    return {
                        ...previous,
                        items: previous.items.map(
                            cartItem =>
                                cartItem.cartItemId === updatedItem.id
                                    ? {
                                        ...cartItem,
                                        quantity: updatedItem.quantity
                                    }
                                    : cartItem
                        )
                    }
                })
            }

        } catch (error) {

            // 15. API 失敗時顯示錯誤，不假裝成功
            console.error(
                '會員購物車操作失敗：',
                error
            )

            if (isSameSession()) {
                setOperationError(
                    error instanceof Error
                        ? error.message
                        : '會員購物車操作失敗'
                )
            }

        } finally {

            // 16. API 結束後解除這筆商品的操作鎖
            lock.ids.delete(cartItemId)

            // 17. 只更新目前工作階段的操作狀態
            if (
                isSameSession() &&
                operationLocksRef.current === lock
            ) {
                setPendingOperations({
                    owner: requestOwner,
                    count: lock.ids.size
                })
            }
        }
    }


    // ==========================================
    // 九、增加商品數量
    // ==========================================

    const increaseQuantity = (variantId: number) => {

        // 會員：使用 Spring Boot PATCH
        if (status === 'authenticated') {
            void runMemberOperation(
                variantId,
                'increase'
            )
            return
        }

        // 訪客：使用 localStorage
        updateGuestCart(items =>
            items.map(item =>
                item.variantId === variantId &&
                    Number.isSafeInteger(item.quantity + 1)
                    ? {
                        ...item,
                        quantity: item.quantity + 1
                    }
                    : item
            )
        )
    }


    // ==========================================
    // 十、減少商品數量
    // ==========================================

    const decreaseQuantity = (variantId: number) => {

        // 會員：使用 Spring Boot PATCH
        if (status === 'authenticated') {
            void runMemberOperation(
                variantId,
                'decrease'
            )
            return
        }

        // 訪客：使用 localStorage
        updateGuestCart(items =>
            items.map(item =>
                item.variantId === variantId &&
                    item.quantity > 1
                    ? {
                        ...item,
                        quantity: item.quantity - 1
                    }
                    : item
            )
        )
    }


    // ==========================================
    // 十一、刪除指定商品
    // ==========================================

    const removeItem = (variantId: number) => {

        // 會員：使用 Spring Boot DELETE
        if (status === 'authenticated') {
            void runMemberOperation(
                variantId,
                'remove'
            )
            return
        }

        // 訪客：使用 localStorage
        updateGuestCart(items =>
            items.filter(
                item => item.variantId !== variantId
            )
        )
    }


    // ==========================================
    // 十二、切換單一商品勾選狀態
    // ==========================================

    const toggleSelect = (variantId: number) => {

        // 會員：只更新 React State
        // 目前後端沒有 selected 欄位
        if (status === 'authenticated') {

            if (!isMemberReady || isMemberCartUpdating) {
                return
            }

            setCartData(previous => {
                if (previous.owner !== owner) return previous

                return {
                    ...previous,
                    items: previous.items.map(item =>
                        item.variantId === variantId
                            ? {
                                ...item,
                                selected: !item.selected
                            }
                            : item
                    )
                }
            })

            return
        }

        // 訪客：更新 localStorage
        updateGuestCart(items =>
            items.map(item =>
                item.variantId === variantId
                    ? {
                        ...item,
                        selected: !item.selected
                    }
                    : item
            )
        )
    }


    // ==========================================
    // 十三、全選／取消全選
    // ==========================================

    const toggleSelectAll = () => {

        // 會員：更新 React State
        if (status === 'authenticated') {

            if (!isMemberReady || isMemberCartUpdating) {
                return
            }

            setCartData(previous => {
                if (
                    previous.owner !== owner ||
                    previous.items.length === 0
                ) {
                    return previous
                }

                // 1. 判斷是否全部勾選
                const allSelected = previous.items.every(
                    item => item.selected
                )

                // 2. 全選或取消全選
                return {
                    ...previous,
                    items: previous.items.map(item => ({
                        ...item,
                        selected: !allSelected
                    }))
                }
            })

            return
        }

        // 訪客：使用 localStorage
        updateGuestCart(items => {

            if (items.length === 0) return items

            // 1. 取得目前全選狀態
            const allSelected = items.every(
                item => item.selected
            )

            // 2. 更新每筆商品的 selected
            return items.map(item => ({
                ...item,
                selected: !allSelected
            }))
        })
    }


    // ==========================================
    // 十四、計算購物車總金額
    // ==========================================

    // 只計算 selected === true 的商品
    const totalPrice = cartItems
        .filter(item => item.selected)
        .reduce(
            (sum, item) =>
                sum + item.price * item.quantity,
            0
        )

    // 判斷目前是否全部勾選
    const isAllSelected =
        cartItems.length > 0 &&
        cartItems.every(item => item.selected)

    // 判斷目前購物車是否允許操作
    const canInteract =
        status === 'guest' ||
        (isMemberReady && !isMemberCartUpdating)

    
    // ==========================================
    // 十五、會員結帳入口
    // Step 26：Cart → Order 資料交接
    // ==========================================

    const handleCheckout = () => {

        // 1. 登入狀態尚未確認或發生錯誤
        if (status === 'checking' || status === 'error') {
            return
        }

        // 2. 訪客必須先登入會員
        // 登入後回到購物車，完成合併並重新勾選商品
        if (status === 'guest') {
            navigate(getLoginUrl(location))
            return
        }

        // 3. 必須是有效會員
        if (
            status !== 'authenticated' ||
            memberId == null
        ) {
            return
        }

        // 4. 確認會員購物車已載入完成
        // 避免 API 修改進行中就跳轉結帳
        if (!isMemberReady || isMemberCartUpdating) {
            return
        }

        // 5. 取得會員已勾選的商品
        const selectedItems = cartItems.filter(
            item => item.selected
        )

        // 6. 沒有勾選商品，不允許結帳
        if (selectedItems.length === 0) {
            return
        }

        // 7. 組成 Cart → Order 交接資料
        const checkoutSelection: CheckoutSelection = {
            source: 'member-cart',
            memberId,
            items: selectedItems.map(item => ({
                variantId: item.variantId,
                quantity: item.quantity
            }))
        }

        // 8. 前往 Checkout
        // 不傳送商品價格，價格由 Order 後端重新確認
        navigate('/checkout', {
            state: checkoutSelection
        })
    }




    // ==========================================
    // 十六、購物車 JSX 畫面
    // ==========================================

    return (
        <div className="cart-page">

            <h1>我的購物車</h1>

            {/* 全選商品 */}
            <label className="cart-select-all">
                <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    disabled={
                        !canInteract ||
                        cartItems.length === 0
                    }
                />
                全選商品
            </label>

            {/* 正在確認會員登入狀態 */}
            {status === 'checking' && (
                <p>正在確認登入狀態...</p>
            )}

            {/* 登入驗證發生錯誤 */}
            {status === 'error' && (
                <p role="alert">
                    會員登入狀態確認失敗，請重新整理或重新登入。
                </p>
            )}

            {/* 會員購物車載入中 */}
            {isMemberCartLoading && (
                <p>正在載入會員購物車...</p>
            )}

            {/* 會員購物車載入錯誤 */}
            {memberCartError && (
                <p role="alert">
                    會員購物車載入失敗：{memberCartError}
                </p>
            )}

            {/* 會員 CRUD 操作失敗 */}
            {operationError && status === 'authenticated' && (
                <p role="alert">
                    會員購物車操作失敗：{operationError}
                </p>
            )}

            {/* 會員商品修改中 */}
            {isMemberCartUpdating && (
                <p>正在更新會員購物車...</p>
            )}

            {/* 訪客空購物車 */}
            {status === 'guest' && cartItems.length === 0 && (
                <p>購物車目前沒有商品</p>
            )}

            {/* 會員資料成功載入，但沒有商品 */}
            {isMemberReady && cartItems.length === 0 && (
                <p>購物車目前沒有商品</p>
            )}

            {/* 商品清單 */}
            <div className="cart-list">
                {cartItems.map(item => (

                    // 無法操作時暫時停用商品卡片的滑鼠互動
                    <div
                        key={item.variantId}
                        style={{
                            opacity: canInteract ? 1 : 0.6,
                            pointerEvents: canInteract
                                ? 'auto'
                                : 'none'
                        }}
                    >
                        <CartItemCard
                            item={item}
                            onIncrease={increaseQuantity}
                            onDecrease={decreaseQuantity}
                            onRemove={removeItem}
                            onToggleSelect={toggleSelect}
                        />
                    </div>

                ))}
            </div>

            {/* 購物車總金額 */}
            <div className="cart-summary">

                <h2>購物車總金額</h2>

                <h2>
                    NT$ {totalPrice.toLocaleString('en-US')}
                </h2>

                {/* 前往結帳：訪客先登入，會員傳遞已勾選商品 */}
                <button
                    type="button"
                    className="cart-checkout-button"
                    onClick={handleCheckout}

                    disabled={
                        !canInteract ||
                        !cartItems.some(item => item.selected)
                    }

                >
                    前往結帳
                </button>

            </div>
        </div>
    )
}

export default CartPage
