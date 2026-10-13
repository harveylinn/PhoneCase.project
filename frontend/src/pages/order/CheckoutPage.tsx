import { useState } from 'react'
import type { Order } from './OrderListPage'
import './CheckoutPage.css'

// 模擬超商門市
const demoStores = [
  {
    id: '711-001',
    chain: 'SEVEN',
    city: '臺中市',
    district: '南屯區',
    name: '7-ELEVEN 示範南屯門市'
  },
  {
    id: '711-002',
    chain: 'SEVEN',
    city: '臺中市',
    district: '西屯區',
    name: '7-ELEVEN 示範西屯門市'
  },
  {
    id: '711-003',
    chain: 'SEVEN',
    city: '桃園市',
    district: '中壢區',
    name: '7-ELEVEN 示範中壢門市'
  },
  {
    id: 'FM-001',
    chain: 'FAMILY',
    city: '臺中市',
    district: '南屯區',
    name: '全家 示範南屯店'
  },
  {
    id: 'FM-002',
    chain: 'FAMILY',
    city: '臺中市',
    district: '西屯區',
    name: '全家 示範西屯店'
  },
  {
    id: 'FM-003',
    chain: 'FAMILY',
    city: '桃園市',
    district: '中壢區',
    name: '全家 示範中壢店'
  }
]

type Props = {
  onCreateOrder: (order: Order) => void
}

function CheckoutPage({ onCreateOrder }: Props) {

  // 收件人資料
  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [receiverAddress, setReceiverAddress] = useState('')

  // 配送方式與付款方式
  const [shippingMethod, setShippingMethod] =
    useState<'HOME' | 'CVS'>('HOME')

  const [paymentMethod, setPaymentMethod] =
    useState<'CREDIT_CARD' | 'COD'>('CREDIT_CARD')

  // 商品資料
  const [quantity, setQuantity] = useState(2)

  const productName = '透明防摔手機殼'
  const productModel = 'iPhone 17 Pro'
  const productPrice = 590

  const productSubtotal = productPrice * quantity
  const shippingFee = shippingMethod === 'HOME' ? 80 : 60
  const grandTotal = productSubtotal + shippingFee

  // 超商選店視窗
  const [showStoreModal, setShowStoreModal] = useState(false)

  const [selectedStoreId, setSelectedStoreId] = useState('')

  const [draftChain, setDraftChain] = useState('SEVEN')
  const [draftCity, setDraftCity] = useState('')
  const [draftDistrict, setDraftDistrict] = useState('')
  const [draftStoreId, setDraftStoreId] = useState('')

  // 取得符合條件的門市
  const chainStores = demoStores.filter(
    (store) => store.chain === draftChain
  )

  const cities = [
    ...new Set(chainStores.map((store) => store.city))
  ]

  const districts = [
    ...new Set(
      chainStores
        .filter((store) => store.city === draftCity)
        .map((store) => store.district)
    )
  ]

  const availableStores = chainStores.filter(
    (store) =>
      store.city === draftCity &&
      store.district === draftDistrict
  )

  const selectedStore = demoStores.find(
    (store) => store.id === selectedStoreId
  )

  // 開啟選店視窗
  function openStoreModal() {

    const previousStore = demoStores.find(
      (store) => store.id === selectedStoreId
    )

    if (previousStore) {
      setDraftChain(previousStore.chain)
      setDraftCity(previousStore.city)
      setDraftDistrict(previousStore.district)
      setDraftStoreId(previousStore.id)
    } else {
      setDraftChain('SEVEN')
      setDraftCity('')
      setDraftDistrict('')
      setDraftStoreId('')
    }

    setShowStoreModal(true)
  }

  // 確認門市
  function confirmStore() {

    if (!draftStoreId) {
      alert('請先選擇取貨門市')
      return
    }

    setSelectedStoreId(draftStoreId)
    setShowStoreModal(false)
  }

  // =========================
  // 建立測試訂單
  // =========================

  function handleConfirmOrder() {

    if (!receiverName.trim()) {
      alert('請輸入收件人姓名')
      return
    }

    if (!receiverPhone.trim()) {
      alert('請輸入聯絡電話')
      return
    }

    if (
      shippingMethod === 'HOME' &&
      !receiverAddress.trim()
    ) {
      alert('請輸入收件地址')
      return
    }

    if (
      shippingMethod === 'CVS' &&
      !selectedStore
    ) {
      alert('請先選擇超商取貨門市')
      return
    }

    // 建立新訂單
    const newOrder: Order = {

      id: `ORD-${Date.now()}`,

      date: new Date().toLocaleDateString('sv-SE'),

      productName,
      model: productModel,
      quantity,

      total: grandTotal,
      shippingFee,

      status:
        paymentMethod === 'CREDIT_CARD'
          ? '待付款'
          : '待出貨',

      // 新增：儲存收件人資料
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),

      // 新增：宅配地址
      receiverAddress:
        shippingMethod === 'HOME'
          ? receiverAddress.trim()
          : undefined,

      // 新增：配送與付款方式
      shippingMethod,
      paymentMethod,

      // 新增：超商取貨門市
      storeName:
        shippingMethod === 'CVS'
          ? selectedStore?.name
          : undefined,

      storeLocation:
        shippingMethod === 'CVS' && selectedStore
          ? selectedStore.city + selectedStore.district
          : undefined

    }

    // 把新訂單交給 App.tsx
    onCreateOrder(newOrder)

    alert('測試訂單建立成功！')
  }

  return (

    <>

      <div className="checkout-page">

        <h1>確認訂單</h1>

        <hr />

        {/* 商品資訊 */}

        <h2>商品資訊</h2>

        <div className="checkout-product">

          <div className="product-image">
            📱
          </div>

          <div className="product-info">

            <h3>{productName}</h3>

            <p>適用型號：{productModel}</p>
            <p>顏色：透明</p>
            <p>單價：NT$ {productPrice}</p>

            <div style={{ marginTop: '15px' }}>

              <span>數量：</span>

              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => setQuantity(quantity - 1)}
              >
                －
              </button>

              <span style={{ margin: '0 15px' }}>
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
              >
                ＋
              </button>

            </div>

          </div>

          <div className="product-subtotal">
            NT$ {productSubtotal.toLocaleString()}
          </div>

        </div>

        <hr />

        {/* 收件人資訊 */}

        <h2>收件人資料</h2>

        <p>收件人姓名</p>

        <input
          type="text"
          placeholder="請輸入姓名"
          value={receiverName}
          onChange={(e) => setReceiverName(e.target.value)}
        />

        <p>聯絡電話</p>

        <input
          type="tel"
          placeholder="請輸入手機號碼"
          value={receiverPhone}
          onChange={(e) => setReceiverPhone(e.target.value)}
        />

        <hr />

        {/* 配送方式 */}

        <h2>配送方式</h2>

        <label>
          <input
            type="radio"
            name="shipping"
            checked={shippingMethod === 'HOME'}
            onChange={() => setShippingMethod('HOME')}
          />
          宅配到府（NT$ 80）
        </label>

        <br />
        <br />

        <label>
          <input
            type="radio"
            name="shipping"
            checked={shippingMethod === 'CVS'}
            onChange={() => setShippingMethod('CVS')}
          />
          超商取貨（NT$ 60）
        </label>

        <br />
        <br />

        {/* 宅配地址 */}

        {shippingMethod === 'HOME' && (

          <div>

            <p>收件地址</p>

            <input
              type="text"
              placeholder="請輸入完整收件地址"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
            />

          </div>

        )}

        {/* 超商取貨 */}

        {shippingMethod === 'CVS' && (

          <div
            style={{
              padding: '24px',
              background: '#f8f9fa',
              borderRadius: '12px'
            }}
          >

            <h3>取貨門市</h3>

            <p style={{ color: '#888', fontSize: '13px' }}>
              目前使用模擬門市資料
            </p>

            {selectedStore ? (

              <div>

                <strong>已選擇取貨門市</strong>

                <p>{selectedStore.name}</p>

                <p>
                  {selectedStore.city}
                  {selectedStore.district}
                </p>

              </div>

            ) : (

              <p>尚未選擇取貨門市</p>

            )}

            <button
              type="button"
              onClick={openStoreModal}
            >
              {selectedStore
                ? '更換取貨門市'
                : '選擇取貨門市'}
            </button>

          </div>

        )}

        <hr />

        {/* 付款方式 */}

        <h2>付款方式</h2>

        <label>
          <input
            type="radio"
            name="payment"
            checked={paymentMethod === 'CREDIT_CARD'}
            onChange={() => setPaymentMethod('CREDIT_CARD')}
          />
          信用卡付款
        </label>

        <br />
        <br />

        <label>
          <input
            type="radio"
            name="payment"
            checked={paymentMethod === 'COD'}
            onChange={() => setPaymentMethod('COD')}
          />
          {shippingMethod === 'CVS'
            ? '超商取貨付款'
            : '貨到付款'}
        </label>

        <hr />

        {/* 訂單金額 */}

        <h2>訂單金額</h2>

        <div className="checkout-summary">

          <div className="summary-row">
            <span>商品小計</span>
            <span>
              NT$ {productSubtotal.toLocaleString()}
            </span>
          </div>

          <div className="summary-row">
            <span>運費</span>
            <span>NT$ {shippingFee}</span>
          </div>

          <hr />

          <div className="summary-row summary-total">

            <span>訂單總金額</span>

            <strong>
              NT$ {grandTotal.toLocaleString()}
            </strong>

          </div>

        </div>

        <button
          type="button"
          onClick={handleConfirmOrder}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '18px'
          }}
        >
          建立測試訂單
        </button>

      </div>

      {/* 超商選店彈出視窗 */}

      {showStoreModal && (

        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
            boxSizing: 'border-box'
          }}
        >

          <div
            role="dialog"
            aria-modal="true"
            aria-label="選擇取貨門市"
            style={{
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'white',
              color: '#333',
              padding: '30px',
              boxSizing: 'border-box',
              borderRadius: '16px'
            }}
          >

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >

              <h2>選擇取貨門市</h2>

              <button
                type="button"
                onClick={() => setShowStoreModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>

            </div>

            <p style={{ color: '#888', fontSize: '13px' }}>
              以下為示範門市，非真實取貨門市
            </p>

            <hr />

            {/* 選擇超商品牌 */}

            <h3>超商品牌</h3>

            <label>

              <input
                type="radio"
                name="storeChain"
                checked={draftChain === 'SEVEN'}
                onChange={() => {
                  setDraftChain('SEVEN')
                  setDraftCity('')
                  setDraftDistrict('')
                  setDraftStoreId('')
                }}
              />

              7-ELEVEN

            </label>

            <label style={{ marginLeft: '20px' }}>

              <input
                type="radio"
                name="storeChain"
                checked={draftChain === 'FAMILY'}
                onChange={() => {
                  setDraftChain('FAMILY')
                  setDraftCity('')
                  setDraftDistrict('')
                  setDraftStoreId('')
                }}
              />

              全家

            </label>

            <br />
            <br />

            {/* 縣市 */}

            <p>縣市</p>

            <select
              value={draftCity}
              onChange={(e) => {
                setDraftCity(e.target.value)
                setDraftDistrict('')
                setDraftStoreId('')
              }}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px'
              }}
            >

              <option value="">請選擇縣市</option>

              {cities.map((city) => (

                <option key={city} value={city}>
                  {city}
                </option>

              ))}

            </select>

            {/* 行政區 */}

            <p>行政區</p>

            <select
              value={draftDistrict}
              disabled={!draftCity}
              onChange={(e) => {
                setDraftDistrict(e.target.value)
                setDraftStoreId('')
              }}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px'
              }}
            >

              <option value="">請選擇行政區</option>

              {districts.map((district) => (

                <option key={district} value={district}>
                  {district}
                </option>

              ))}

            </select>

            {/* 門市 */}

            <p>取貨門市</p>

            <select
              value={draftStoreId}
              disabled={!draftDistrict}
              onChange={(e) => setDraftStoreId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '20px'
              }}
            >

              <option value="">請選擇門市</option>

              {availableStores.map((store) => (

                <option key={store.id} value={store.id}>
                  {store.name}
                </option>

              ))}

            </select>

            {/* 按鈕 */}

            <div
              style={{
                display: 'flex',
                gap: '12px'
              }}
            >

              <button
                type="button"
                onClick={() => setShowStoreModal(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>

              <button
                type="button"
                onClick={confirmStore}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                確認選擇
              </button>

            </div>

          </div>

        </div>

      )}

    </>

  )
}

export default CheckoutPage