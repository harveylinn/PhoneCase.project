import { useState } from 'react'
import { createOrder } from '../../api/orderApi'

function CheckoutPage() {
    const [receiverName, setReceiverName] = useState('')
    const [receiverPhone, setReceiverPhone] = useState('')
    const [receiverAddress, setReceiverAddress] = useState('')
    const [shippingMethod, setShippingMethod] = useState('HOME')
    const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD')

    async function handleConfirmOrder() {

        // 1. 檢查姓名
        if (receiverName.trim() === '') {
            alert('請輸入收件人姓名')
            return
        }

        // 2. 檢查電話
        if (receiverPhone.trim() === '') {
            alert('請輸入聯絡電話')
            return
        }

        // 3. 如果選宅配，必須填地址
        if (shippingMethod === 'HOME' && receiverAddress.trim() === '') {
            alert('請輸入收件地址')
            return
        }

        // 4. 超商門市功能尚未完成
        if (shippingMethod === 'CVS') {
            alert('超商門市選擇功能尚未完成，請先使用宅配測試')
            return
        }

        // 5. 整理訂單資料
        const orderData = {
            receiverName,
            receiverPhone,
            receiverAddress,
            shippingMethod,
            paymentMethod
        }

        try {
  const result = await createOrder(orderData)

  console.log('建立訂單成功：', result)
  alert('訂單建立成功！')

} catch (error) {
  console.error('建立訂單失敗：', error)
  alert('建立訂單失敗，請稍後再試')
}
    } return (
        <div>
            <h1>確認訂單</h1>

            <hr />

            <h2>商品資訊</h2>
            <p>透明手機殼 × 2</p>
            <p>單價：$590</p>

            <hr />

            <h2>收件資訊</h2>

            <p>收件人姓名</p>
            <input
                type="text"
                placeholder="請輸入姓名"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
            />

            <p>你輸入的姓名：{receiverName}</p>

            <p>聯絡電話</p>
            <input
                type="tel"
                placeholder="請輸入電話"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
            />



            <hr />

            <h2>配送方式</h2>

            <h2>配送方式</h2>

            <label>
                <input
                    type="radio"
                    name="shipping"
                    checked={shippingMethod === 'HOME'}
                    onChange={() => setShippingMethod('HOME')}
                />
                宅配
            </label>

            <label>
                <input
                    type="radio"
                    name="shipping"
                    checked={shippingMethod === 'CVS'}
                    onChange={() => setShippingMethod('CVS')}
                />
                超商取貨
            </label>

            {shippingMethod === 'HOME' && (
                <div>
                    <p>收件地址</p>
                    <input
                        type="text"
                        placeholder="請輸入地址"
                        value={receiverAddress}
                        onChange={(e) => setReceiverAddress(e.target.value)}
                    />
                </div>
            )}

            {shippingMethod === 'CVS' && (
                <div>
                    <p>取貨門市</p>
                    <button type="button">
                        選擇門市
                    </button>
                </div>
            )}

            <hr />

            <h2>付款方式</h2>

            <label>
                <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'CREDIT_CARD'}
                    onChange={() => setPaymentMethod('CREDIT_CARD')}
                />
                信用卡
            </label>

            <label>
                <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                />
                貨到付款
            </label>

            <hr />

            <h2>訂單總金額：$1,180</h2>

            <button type="button" onClick={handleConfirmOrder}>
                確認下單
            </button>
        </div>
    )
}

export default CheckoutPage