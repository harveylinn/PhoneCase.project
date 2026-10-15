import { useEffect, useRef, useState } from 'react'
import type { Order } from './OrderListPage'
import './CheckoutPage.css'

// ========================================
// 1. 綠界物流設定
// ========================================

// Spring Boot 選店 API
const ECPAY_MAP_URL =
  'http://localhost:8080/api/logistics/ecpay/map'

// Cloudflare HTTPS 網址
const ECPAY_CALLBACK_ORIGIN =
  'https://warner-greene-smooth-correct.trycloudflare.com'

// 超商品牌
type StoreChain = 'UNIMART' | 'FAMI'

// 綠界回傳的門市資料
type SelectedStore = {
  id: string
  name: string
  address: string
  chain: StoreChain
}

// App.tsx 傳入的功能
type Props = {
  onCreateOrder: (order: Order) => void
}

function CheckoutPage({ onCreateOrder }: Props) {

  // ========================================
  // 2. 收件人資料
  // ========================================

  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [receiverAddress, setReceiverAddress] = useState('')

  // ========================================
  // 3. 配送與付款方式
  // ========================================

  const [shippingMethod, setShippingMethod] =
    useState<'HOME' | 'CVS'>('HOME')

  const [paymentMethod, setPaymentMethod] =
    useState<'CREDIT_CARD' | 'COD'>('CREDIT_CARD')

  // ========================================
  // 4. 商品資料
  // ========================================

  const [quantity, setQuantity] = useState(2)

  const productName = '透明防摔手機殼'
  const productModel = 'iPhone 17 Pro'
  const productPrice = 590

  // 商品小計
  const productSubtotal = productPrice * quantity

  // 運費
  const shippingFee = shippingMethod === 'HOME' ? 80 : 60

  // 訂單總金額
  const grandTotal = productSubtotal + shippingFee

  // ========================================
  // 5. 綠界超商選店
  // ========================================

  // 目前選擇的超商品牌
  const [storeChain, setStoreChain] =
    useState<StoreChain>('UNIMART')

  // 已選擇的超商門市
  const [selectedStore, setSelectedStore] =
    useState<SelectedStore | null>(null)

  // 記錄選店視窗
  const storePopupRef = useRef<Window | null>(null)

  // ========================================
  // 6. 開啟綠界選店頁面
  // ========================================

  function openEcpayStoreMap() {

    const url = `${ECPAY_MAP_URL}?store=${storeChain}`

    const popup = window.open(
      url,
      'ecpayStoreMap',
      'width=1000,height=750,scrollbars=yes'
    )

    if (!popup) {
      alert('無法開啟選店視窗，請允許瀏覽器彈出式視窗')
      return
    }

    storePopupRef.current = popup

    popup.focus()
  }

  // ========================================
  // 7. 接收綠界回傳的門市資料
  // ========================================

  useEffect(() => {

    function handleStoreMessage(event: MessageEvent) {

      // 檢查訊息來源
      if (event.origin !== ECPAY_CALLBACK_ORIGIN) {
        return
      }

      // 檢查是否為選店視窗
      if (event.source !== storePopupRef.current) {
        return
      }

      const data = event.data

      if (
        !data ||
        data.type !== 'ECPAY_STORE_SELECTED'
      ) {
        return
      }

      const store = data.store

      // 檢查門市資料
      if (
        !store ||
        typeof store.id !== 'string' ||
        typeof store.name !== 'string' ||
        typeof store.address !== 'string' ||
        !store.id.trim() ||
        !store.name.trim()
      ) {
        return
      }

      // 判斷超商品牌
      const chain: StoreChain =
        store.chain === 'FAMI'
          ? 'FAMI'
          : store.chain === 'UNIMART'
            ? 'UNIMART'
            : storeChain

      // 儲存門市資料
      setSelectedStore({
        id: store.id,
        name: store.name,
        address: store.address,
        chain
      })

      setStoreChain(chain)

      storePopupRef.current = null

      alert('超商門市選擇成功！')
    }

    window.addEventListener('message', handleStoreMessage)

    return () => {
      window.removeEventListener('message', handleStoreMessage)
    }

  }, [storeChain])

  // ========================================
  // 8. 建立測試訂單
  // ========================================

  function handleConfirmOrder() {

    // 檢查收件人姓名
    if (!receiverName.trim()) {
      alert('請輸入收件人姓名')
      return
    }

    // 檢查手機號碼
    if (!receiverPhone.trim()) {
      alert('請輸入聯絡電話')
      return
    }

    // 宅配需要填寫地址
    if (
      shippingMethod === 'HOME' &&
      !receiverAddress.trim()
    ) {
      alert('請輸入收件地址')
      return
    }

    // 超商取貨需要選擇門市
    if (
      shippingMethod === 'CVS' &&
      !selectedStore
    ) {
      alert('請先選擇超商取貨門市')
      return
    }

    // ========================================
    // 9. 組合訂單資料
    // ========================================

    const newOrder: Order = {

      // 訂單基本資料
      id: `ORD-${Date.now()}`,

      date: new Date().toLocaleDateString('sv-SE'),

      // 商品資料
      productName,

      model: productModel,

      quantity,

      total: grandTotal,

      shippingFee,

      // 訂單狀態
      status:
        paymentMethod === 'CREDIT_CARD'
          ? '待付款'
          : '待出貨',

      // 收件人資料
      receiverName: receiverName.trim(),

      receiverPhone: receiverPhone.trim(),

      // 宅配地址
      receiverAddress:
        shippingMethod === 'HOME'
          ? receiverAddress.trim()
          : undefined,

      // 配送方式
      shippingMethod,

      // 付款方式
      paymentMethod,

      // ========================================
      // 新增：綠界超商門市資料
      // ========================================

      // 超商品牌：UNIMART / FAMI
      storeChain:
        shippingMethod === 'CVS'
          ? selectedStore?.chain
          : undefined,

      // 門市代碼
      storeId:
        shippingMethod === 'CVS'
          ? selectedStore?.id
          : undefined,

      // 門市名稱
      storeName:
        shippingMethod === 'CVS'
          ? selectedStore?.name
          : undefined,

      // 門市地址
      storeLocation:
        shippingMethod === 'CVS'
          ? selectedStore?.address
          : undefined

    }

    // ========================================
    // 10. 將訂單傳給 App.tsx
    // ========================================

    onCreateOrder(newOrder)

    alert('測試訂單建立成功！')
  }

  // ========================================
  // 11. React 畫面
  // ========================================

  return (

    <div className="checkout-page">

      <h1>確認訂單</h1>

      <hr />

      {/* ================================= */}
      {/* 商品資訊 */}
      {/* ================================= */}

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

      {/* ================================= */}
      {/* 收件人資料 */}
      {/* ================================= */}

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

      {/* ================================= */}
      {/* 配送方式 */}
      {/* ================================= */}

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

      {/* ================================= */}
      {/* 宅配地址 */}
      {/* ================================= */}

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

      {/* ================================= */}
      {/* 綠界超商取貨 */}
      {/* ================================= */}

      {shippingMethod === 'CVS' && (

        <div
          style={{
            padding: '24px',
            background: '#f8f9fa',
            borderRadius: '12px'
          }}
        >

          <h3>超商取貨門市</h3>

          <p style={{ color: '#888', fontSize: '13px' }}>
            綠界物流測試環境
          </p>

          {/* 選擇超商品牌 */}

          <h4>選擇超商品牌</h4>

          <label>

            <input
              type="radio"
              name="storeChain"
              checked={storeChain === 'UNIMART'}
              onChange={() => {
                setStoreChain('UNIMART')
                setSelectedStore(null)
              }}
            />

            7-ELEVEN

          </label>

          <label style={{ marginLeft: '20px' }}>

            <input
              type="radio"
              name="storeChain"
              checked={storeChain === 'FAMI'}
              onChange={() => {
                setStoreChain('FAMI')
                setSelectedStore(null)
              }}
            />

            全家便利商店

          </label>

          <br />
          <br />

          {/* 顯示已選門市 */}

          {selectedStore ? (

            <div
              style={{
                padding: '16px',
                marginBottom: '16px',
                background: '#eaf7ea',
                borderRadius: '8px'
              }}
            >

              <strong>✅ 已選擇取貨門市</strong>

              <p>
                超商：
                {selectedStore.chain === 'UNIMART'
                  ? '7-ELEVEN'
                  : '全家便利商店'}
              </p>

              <p>
                門市名稱：{selectedStore.name}
              </p>

              <p>
                門市代碼：{selectedStore.id}
              </p>

              <p>
                門市地址：{selectedStore.address || '未提供'}
              </p>

            </div>

          ) : (

            <p>尚未選擇取貨門市</p>

          )}

          {/* 開啟綠界選店 */}

          <button
            type="button"
            onClick={openEcpayStoreMap}
            style={{
              padding: '12px 24px',
              background: '#198754',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >

            {selectedStore
              ? '更換取貨門市'
              : '開啟綠界選店'}

          </button>

        </div>

      )}

      <hr />

      {/* ================================= */}
      {/* 付款方式 */}
      {/* ================================= */}

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

      {/* ================================= */}
      {/* 訂單金額 */}
      {/* ================================= */}

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

      {/* ================================= */}
      {/* 建立訂單按鈕 */}
      {/* ================================= */}

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

  )
}

export default CheckoutPage