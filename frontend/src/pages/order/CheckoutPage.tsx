import { useState } from 'react'
import type { Order, OrderStatus } from './OrderListPage'
import { createOrder } from '../../api/orderApi'
import type { CartItem } from '../cart/CartItem'
import { getGuestCart, saveGuestCart } from '../../utils/cartStorage'
import { NANTUN_STORES } from './nantunStores'
import type { NantunStore, StoreChain } from './nantunStores'
import './CheckoutPage.css'

const TAIWAN_COUNTIES = [
  '臺北市', '新北市', '基隆市', '桃園市', '新竹市', '新竹縣',
  '苗栗縣', '臺中市', '彰化縣', '南投縣', '雲林縣', '嘉義市',
  '嘉義縣', '臺南市', '高雄市', '屏東縣', '宜蘭縣', '花蓮縣',
  '臺東縣', '澎湖縣', '金門縣', '連江縣'
]

const TAICHUNG_DISTRICTS = [
  '中區', '東區', '南區', '西區', '北區', '北屯區', '西屯區', '南屯區',
  '太平區', '大里區', '霧峰區', '烏日區', '豐原區', '后里區', '石岡區',
  '東勢區', '和平區', '新社區', '潭子區', '大雅區', '神岡區', '大肚區',
  '沙鹿區', '龍井區', '梧棲區', '清水區', '大甲區', '外埔區', '大安區'
]

type Props = {
  onCreateOrder: (order: Order) => void
}

// ========================================
// 將後端訂單狀態轉成中文
// ========================================

function convertOrderStatus(status: string): OrderStatus {
  switch (status) {
    case 'PENDING_PAYMENT':
      return '待付款'

    case 'PENDING_SHIPMENT':
      return '待出貨'

    case 'SHIPPED':
      return '已出貨'

    case 'COMPLETED':
      return '已完成'

    case 'CANCELLED':
      return '已取消'

    default:
      return '待付款'
  }
}

function CheckoutPage({ onCreateOrder }: Props) {

  // ========================================
  // 收件人資料
  // ========================================

  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [receiverAddress, setReceiverAddress] = useState('')

  // ========================================
  // 配送與付款
  // ========================================

  const [shippingMethod, setShippingMethod] =
    useState<'HOME' | 'CVS'>('HOME')

  const [paymentMethod, setPaymentMethod] =
    useState<'CREDIT_CARD' | 'COD'>('CREDIT_CARD')

  // ========================================
  // 從訪客購物車讀取已勾選商品
  // ========================================

  const [selectedItems] = useState<CartItem[]>(
    () => getGuestCart().filter((item) => item.selected)
  )

  const productSubtotal = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const shippingFee = shippingMethod === 'HOME' ? 80 : 60
  const grandTotal = productSubtotal + shippingFee

  // ========================================
  // 超商門市選店
  // ========================================

  const [storeChain, setStoreChain] =
    useState<StoreChain>('UNIMART')

  const [selectedStore, setSelectedStore] =
    useState<NantunStore | null>(null)

  const [selectedCounty, setSelectedCounty] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedRoad, setSelectedRoad] = useState('')

  // ========================================
  // 新增：是否正在建立訂單
  // ========================================

  const [isSubmitting, setIsSubmitting] = useState(false)

  const availableDistricts = selectedCounty === '臺中市'
    ? TAICHUNG_DISTRICTS
    : []
  const availableRoads = Array.from(new Set(
    NANTUN_STORES
      .filter((store) =>
        store.county === selectedCounty &&
        store.district === selectedDistrict &&
        store.chain === storeChain
      )
      .flatMap((store) => store.roads)
  )).sort((a, b) => a.localeCompare(b, 'zh-Hant'))
  const storesOnSelectedRoad = NANTUN_STORES.filter((store) =>
    store.county === selectedCounty &&
    store.district === selectedDistrict &&
    store.roads.includes(selectedRoad) &&
    store.chain === storeChain
  )

  function isSelectedStore(store: NantunStore) {
    return selectedStore?.chain === store.chain && selectedStore.id === store.id
  }

  // ========================================
  // 建立訂單：真正呼叫 Spring Boot
  // ========================================

  async function handleConfirmOrder() {

    // 防止重複點擊
    if (isSubmitting) {
      return
    }

    // 1. 檢查收件人姓名
    if (!receiverName.trim()) {
      alert('請輸入收件人姓名')
      return
    }

    // 2. 檢查電話
    if (!receiverPhone.trim()) {
      alert('請輸入聯絡電話')
      return
    }

    // 3. 宅配檢查地址
    if (
      shippingMethod === 'HOME' &&
      !receiverAddress.trim()
    ) {
      alert('請輸入收件地址')
      return
    }

    // 4. 超商取貨檢查門市
    if (
      shippingMethod === 'CVS' &&
      !selectedStore
    ) {
      alert('請先選擇超商取貨門市')
      return
    }

    // ========================================
    // 5. 準備送給 Java 後端的資料
    // ========================================

    const orderItems = getGuestCart().filter((item) => item.selected)
    if (orderItems.length === 0) {
      alert('購物車沒有已勾選的商品，請先回購物車選擇商品')
      return
    }

    const orderData = {

      receiverName: receiverName.trim(),

      receiverPhone: receiverPhone.trim(),

      receiverAddress:
        shippingMethod === 'HOME'
          ? receiverAddress.trim()
          : '',

      shippingMethod,

      paymentMethod,

      // 超商門市資料
      storeChain:
        shippingMethod === 'CVS'
          ? selectedStore?.chain
          : undefined,

      storeCode:
        shippingMethod === 'CVS'
          ? selectedStore?.id
          : undefined,

      storeName:
        shippingMethod === 'CVS'
          ? selectedStore?.name
          : undefined,

      storeLocation:
        shippingMethod === 'CVS'
          ? selectedStore?.address
          : undefined,

      // 只傳商品規格 ID 和數量，金額與商品資料由後端查詢
      items: orderItems.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity
      }))

    }

    // ========================================
    // 6. 呼叫 Spring Boot API
    // ========================================

    setIsSubmitting(true)

    try {

      const result = await createOrder(orderData)

      // 後端必須真的回傳建立成功
      if (!result.success) {
        throw new Error(result.message || '訂單建立失敗')
      }

      // ========================================
      // 7. 使用後端回傳的訂單資料
      // ========================================

      const orderProductName = orderItems
        .map((item) => item.name)
        .join('、')
      const orderModel = orderItems
        .map((item) => (item.brand + ' ' + item.model).trim())
        .join('、')
      const orderQuantity = orderItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      )

      const newOrder: Order = {

        // 使用 MySQL 訂單編號，不再使用前端時間戳
        id: result.orderNumber,

        date: new Date().toLocaleDateString('sv-SE'),

        productName: orderProductName,

        model: orderModel,

        quantity: orderQuantity,

        // 使用後端計算的真正金額
        total: result.totalAmount,

        shippingFee,

        // 使用後端回傳的狀態
        status: convertOrderStatus(result.status),

        receiverName: receiverName.trim(),

        receiverPhone: receiverPhone.trim(),

        receiverAddress:
          shippingMethod === 'HOME'
            ? receiverAddress.trim()
            : undefined,

        shippingMethod,

        paymentMethod,

        storeChain:
          shippingMethod === 'CVS'
            ? selectedStore?.chain
            : undefined,

        storeId:
          shippingMethod === 'CVS'
            ? selectedStore?.id
            : undefined,

        storeName:
          shippingMethod === 'CVS'
            ? selectedStore?.name
            : undefined,

        storeLocation:
          shippingMethod === 'CVS'
            ? selectedStore?.address
            : undefined

      }

      // 訂單成功後只移除本次已購買的規格，保留未勾選商品。
      const purchasedVariantIds = new Set(
        orderItems.map((item) => item.variantId)
      )
      try {
        saveGuestCart(
          getGuestCart().filter(
            (item) => !purchasedVariantIds.has(item.variantId)
          )
        )
      } catch (cartError) {
        console.error('訂單已建立，但更新購物車失敗：', cartError)
      }

      // ========================================
      // 8. 更新 React 畫面
      // ========================================

      onCreateOrder(newOrder)

      alert(
        `訂單建立成功！\n` +
        `訂單編號：${result.orderNumber}\n` +
        `訂單金額：NT$ ${result.totalAmount}`
      )

    } catch (error) {

      console.error('建立訂單失敗：', error)

      if (error instanceof Error) {
        alert(error.message)
      } else {
        alert('建立訂單失敗，請稍後再試')
      }

    } finally {

      setIsSubmitting(false)

    }
  }

  // ========================================
  // React 結帳頁面
  // ========================================

  return (

    <div className="checkout-page">

      <h1>確認訂單</h1>

      <hr />

      {/* 商品資訊 */}

      <h2>商品資訊</h2>

      {selectedItems.length === 0 ? (
        <p role="status">購物車目前沒有已勾選商品。</p>
      ) : (
        selectedItems.map((item) => (
          <div className="checkout-product" key={item.variantId}>
            <div className="product-image">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              ) : (
                '📱'
              )}
            </div>

            <div className="product-info">
              <h3>{item.name}</h3>
              <p>適用型號：{item.brand} {item.model}</p>
              <p>顏色：{item.color}</p>
              <p>單價：NT$ {item.price.toLocaleString()}</p>
              <p>數量：{item.quantity}</p>
            </div>

            <div className="product-subtotal">
              NT$ {(item.price * item.quantity).toLocaleString()}
            </div>
          </div>
        ))
      )}

      <hr />

      {/* 收件人資料 */}

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
          onChange={() => {
            setShippingMethod('CVS')
            setSelectedCounty('')
            setSelectedDistrict('')
            setSelectedRoad('')
            setSelectedStore(null)
          }}
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

      {/* 超商取貨門市 */}

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
            請依序選擇配送縣市、區域與道路，再選擇取貨門市。
          </p>

          <h4>選擇超商品牌</h4>

          <label>

            <input
              type="radio"
              name="storeChain"
              checked={storeChain === 'UNIMART'}
              onChange={() => {
                setStoreChain('UNIMART')
                setSelectedRoad('')
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
                setSelectedRoad('')
                setSelectedStore(null)
              }}
            />

            全家便利商店

          </label>

          <br />
          <br />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginBottom: '16px'
            }}
          >
            <label>
              縣市
              <select
                value={selectedCounty}
                onChange={(event) => {
                  const county = event.target.value
                  setSelectedCounty(county)
                  setSelectedDistrict('')
                  setSelectedRoad('')
                  setSelectedStore(null)
                }}
                style={{ display: 'block', width: '100%', marginTop: '6px' }}
              >
                <option value="">請選擇縣市</option>
                {TAIWAN_COUNTIES.map((county) => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </label>

            <label>
              區
              <select
                value={selectedDistrict}
                disabled={availableDistricts.length === 0}
                onChange={(event) => {
                  setSelectedDistrict(event.target.value)
                  setSelectedRoad('')
                  setSelectedStore(null)
                }}
                style={{ display: 'block', width: '100%', marginTop: '6px' }}
              >
                <option value="">
                  {selectedCounty ? '請選擇區域' : '請先選擇縣市'}
                </option>
                {availableDistricts.map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </label>

            <label>
              道路
              <select
                value={selectedRoad}
                disabled={availableRoads.length === 0}
                onChange={(event) => {
                  setSelectedRoad(event.target.value)
                  setSelectedStore(null)
                }}
                style={{ display: 'block', width: '100%', marginTop: '6px' }}
              >
                <option value="">請選擇道路</option>
                {availableRoads.map((road) => (
                  <option key={road} value={road}>{road}</option>
                ))}
              </select>
            </label>
          </div>

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

          {storesOnSelectedRoad.length > 0 ? (
            <div
              role="list"
              aria-label={`${selectedCounty}${selectedDistrict}${selectedRoad}門市清單`}
              style={{ display: 'grid', gap: '10px', marginTop: '16px' }}
            >
              {storesOnSelectedRoad.map((store) => (
                <div
                  key={`${store.chain}-${store.id}`}
                  role="listitem"
                  style={{
                    padding: '12px',
                    border: isSelectedStore(store)
                      ? '2px solid #198754'
                      : '1px solid #e3e3e3',
                    borderRadius: '8px',
                    background: 'white'
                  }}
                >
                  <strong>{store.name}</strong>
                  <p>門市代碼：{store.id}</p>
                  <p>{store.address}</p>
                  <button
                    type="button"
                    onClick={() => setSelectedStore(store)}
                    disabled={isSubmitting}
                  >
                    {isSelectedStore(store) ? '已選擇這間門市' : '選擇這間門市'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p role="status" style={{ color: '#777' }}>
              {!selectedCounty
                ? '請先選擇縣市、區域與道路。'
                : !selectedDistrict
                  ? '請選擇區域。'
                  : !selectedRoad
                    ? '請選擇道路。'
                    : '目前沒有符合條件的門市。'}
            </p>
          )}

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

      {/* 建立訂單 */}

      <button
        type="button"
        onClick={handleConfirmOrder}
        disabled={isSubmitting || selectedItems.length === 0}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '18px',
          cursor: isSubmitting ? 'not-allowed' : 'pointer'
        }}
      >

        {isSubmitting
          ? '訂單建立中，請稍候...'
          : '建立訂單'}

      </button>

    </div>

  )
}

export default CheckoutPage
