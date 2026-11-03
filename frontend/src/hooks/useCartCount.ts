
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { getGuestCartCount } from '../utils/cartStorage'
import { getMemberCart } from '../services/cartApi'

// Navbar 購物車數量狀態
type CartCountState = {
    owner: string
    count: number
}

export function useCartCount(): number | null {

    // 1. 取得登入狀態與目前路由
    const { status, currentMember } = useAuth()
    const location = useLocation()

    const memberId = currentMember?.id

    // 2. 使用 owner 區分訪客與不同會員
    const owner =
        status === 'authenticated' && memberId != null
            ? `member:${memberId}`
            : status

    // 3. 避免一開始顯示其他會員的舊數量
    const [cartCount, setCartCount] = useState<CartCountState>({
        owner: '',
        count: 0
    })

    useEffect(() => {

        let cancelled = false

        // 4. 用請求序號防止較舊的 GET 覆蓋最新結果
        let requestId = 0

        const updateCartCount = async () => {
            const currentRequest = ++requestId

            // 5. 訪客：從 localStorage 取得商品數量
            if (status === 'guest') {
                const count = getGuestCartCount()

                if (!cancelled && currentRequest === requestId) {
                    setCartCount({
                        owner: 'guest',
                        count
                    })
                }

                return
            }

            // 6. 會員狀態尚未確認完成時，不發送 API
            if (status !== 'authenticated' || memberId == null) {
                return
            }

            const token = localStorage.getItem('token')

            if (!token) return

            try {
                // 7. 會員：從 Spring Boot 取得購物車
                const items = await getMemberCart(token)

                // 8. 排除過期請求
                if (cancelled || currentRequest !== requestId) {
                    return
                }

                // 9. 計算所有商品的總數量
                const count = items.reduce(
                    (total, item) => total + item.quantity,
                    0
                )

                setCartCount({
                    owner: `member:${memberId}`,
                    count
                })

            } catch (error) {

                if (cancelled || currentRequest !== requestId) {
                    return
                }

                // API 失敗時不可把「讀取失敗」誤認為 0
                console.error(
                    'Navbar 會員購物車數量讀取失敗：',
                    error
                )

                setCartCount({
                    owner: '',
                    count: 0
                })
            }
        }

        // 10. 監聽購物車變動
        const handleCartUpdated = () => {
            void updateCartCount()
        }

        // 11. 第一次進入或切換路由時更新
        void updateCartCount()

        // 同一分頁：訪客購物車變動
        window.addEventListener(
            'cartUpdated',
            handleCartUpdated
        )

        // 同一分頁：會員購物車變動
        window.addEventListener(
            'memberCartUpdated',
            handleCartUpdated
        )

        // 其他分頁：localStorage 改變
        window.addEventListener(
            'storage',
            handleCartUpdated
        )

        // 回到網頁時重新查詢
        window.addEventListener(
            'focus',
            handleCartUpdated
        )

        // 12. 清理事件，讓舊請求失效
        return () => {
            cancelled = true
            requestId += 1

            window.removeEventListener(
                'cartUpdated',
                handleCartUpdated
            )

            window.removeEventListener(
                'memberCartUpdated',
                handleCartUpdated
            )

            window.removeEventListener(
                'storage',
                handleCartUpdated
            )

            window.removeEventListener(
                'focus',
                handleCartUpdated
            )
        }

    }, [status, memberId, location.pathname])

    // 13. 只允許顯示目前身分的購物車數量
    // null 代表資料尚未取得，避免錯誤顯示 0
    return cartCount.owner === owner
        ? cartCount.count
        : null
}
