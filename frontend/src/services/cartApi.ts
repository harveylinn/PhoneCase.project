
export interface MemberCartItem {
    id: number
    memberId: number
    variantId: number
    quantity: number
}

export async function getMemberCart(
    token: string
): Promise<MemberCartItem[]> {
    const response = await fetch('/api/cart/items', {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    if (!response.ok) {
        throw new Error(
            `取得會員購物車失敗：HTTP ${response.status}`
        )
    }

    const data: unknown = await response.json()

    if (!Array.isArray(data) || !data.every(
        (item): item is MemberCartItem =>
            typeof item === 'object' &&
            item !== null &&
            typeof item.id === 'number' &&
            typeof item.memberId === 'number' &&
            typeof item.variantId === 'number' &&
            typeof item.quantity === 'number'
    )) {
        throw new Error('購物車 API 回傳格式不正確')
    }

    return data
}


export async function addMemberCartItem(
    token: string,
    variantId: number,
    quantity: number
): Promise<MemberCartItem> {
    const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            variantId,
            quantity,
        }),
    })

    if (!response.ok) {
        throw new Error(
            `新增會員購物車商品失敗：HTTP ${response.status}`
        )
    }

    const data: MemberCartItem = await response.json()
    return data
}



export async function updateMemberCartItem(
    token: string,
    cartItemId: number,
    quantity: number
): Promise<MemberCartItem> {
    const response = await fetch(
        `/api/cart/items/${cartItemId}`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ quantity }),
        }
    )

    if (!response.ok) {
        throw new Error(
            `更新會員購物車數量失敗：HTTP ${response.status}`
        )
    }

    const data: MemberCartItem = await response.json()
    return data
}



export async function deleteMemberCartItem(
  token: string,
  cartItemId: number
): Promise<void> {
  const response = await fetch(
    `/api/cart/items/${cartItemId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(
      `刪除會員購物車商品失敗：HTTP ${response.status}`
    )
  }
}
