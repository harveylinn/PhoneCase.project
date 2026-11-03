
import type { CartItem } from './CartItem'
import type { MemberCartItem } from '../../services/cartApi'

// 商品圖片資料
interface ProductImage {
    imageUrl: string
    isPrimary: boolean
    sortOrder: number
}

// 商品規格資料
interface ProductVariant {
    id: number
    brand: string
    model: string
    color: string
    price: number
    images?: ProductImage[]
}

// 商品資料
export interface ProductData {
    id: number
    name: string
    variants?: ProductVariant[]
}

// 將會員購物車和商品資料整合成 React CartItem
export function mapMemberCartItems(
    memberItems: MemberCartItem[],
    products: ProductData[]
): CartItem[] {
    const variantMap = new Map<
        number,
        { product: ProductData; variant: ProductVariant }
    >()

    // 建立 variantId 與商品資料的對應關係
    for (const product of products) {
        for (const variant of product.variants ?? []) {
            variantMap.set(variant.id, { product, variant })
        }
    }

    return memberItems.flatMap((memberItem) => {
        const matched = variantMap.get(memberItem.variantId)

        // 找不到商品時，不建立不完整的畫面資料
        if (!matched) {
            return []
        }

        const { product, variant } = matched

        // 優先使用主要圖片
        const primaryImage = variant.images?.find(
            (image) => image.isPrimary
        )

        const imageUrl =
            primaryImage?.imageUrl ??
            variant.images?.[0]?.imageUrl ??
            ''

        return [{
            cartItemId: memberItem.id,
            variantId: memberItem.variantId,
            name: product.name,
            brand: variant.brand,
            model: variant.model,
            color: variant.color,
            price: variant.price,
            quantity: memberItem.quantity,
            imageUrl,
            selected: true,
        }]
    })
}
