export type CreateOrderRequest = {
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  shippingMethod: string
  paymentMethod: string
}
export async function createOrder(orderData: CreateOrderRequest) {

  const response = await fetch('http://localhost:8080/api/orders', {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify(orderData)
  })

  if (!response.ok) {
    throw new Error('建立訂單失敗')
  }

  return response.json()
}