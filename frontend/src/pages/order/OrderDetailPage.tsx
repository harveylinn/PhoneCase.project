import type { Order } from './OrderListPage'

type Props = {
  order: Order | undefined
}

function OrderDetailPage({ order }: Props) {

  if (!order) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>找不到訂單資料</h2>
      </div>
    )
  }

  // 計算金額
  const subtotal = order.total - order.shippingFee
  const unitPrice = subtotal / order.quantity

  // 訂單進度
  const steps = [
    '訂單成立',
    '待出貨',
    '已出貨',
    '已完成'
  ]

  const currentStep =
    order.status === '待付款' ? 0 :
    order.status === '待出貨' ? 1 :
    order.status === '已出貨' ? 2 :
    order.status === '已完成' ? 3 : -1

  // 配送方式文字
  const shippingText =
    order.shippingMethod === 'HOME'
      ? '宅配到府'
      : order.shippingMethod === 'CVS'
        ? '超商取貨'
        : '尚未記錄（舊測試訂單）'

  // 付款方式文字
  const paymentText =
    order.paymentMethod === 'CREDIT_CARD'
      ? '信用卡付款（模擬，未實際付款）'
      : order.paymentMethod === 'COD'
        ? order.shippingMethod === 'CVS'
          ? '超商取貨付款'
          : '貨到付款'
        : '尚未記錄（舊測試訂單）'

  const boxStyle = {
    padding: '24px',
    background: '#f8f9fa',
    borderRadius: '10px',
    marginBottom: '25px'
  }

  return (

    <div
      style={{
        maxWidth: '900px',
        margin: '40px auto',
        padding: '30px',
        background: 'white',
        color: '#333',
        borderRadius: '12px',
        boxSizing: 'border-box'
      }}
    >

      <h1 style={{ textAlign: 'center' }}>
        訂單明細
      </h1>

      <hr />

      {/* 訂單資訊 */}

      <h2>訂單資訊</h2>

      <div style={boxStyle}>

        <p>
          <strong>訂單編號：</strong>
          {order.id}
        </p>

        <p>
          <strong>訂購日期：</strong>
          {order.date}
        </p>

        <p>
          <strong>訂單狀態：</strong>
          {order.status}
        </p>

      </div>

      <hr />

      {/* 訂單進度 */}

      <h2>訂單進度</h2>

      {order.status === '已取消' ? (

        <div style={boxStyle}>
          <strong style={{ color: '#e53935' }}>
            此訂單已取消
          </strong>
        </div>

      ) : (

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap',
            margin: '30px 0'
          }}
        >

          {steps.map((step, index) => (

            <div
              key={step}
              style={{
                flex: 1,
                minWidth: '100px',
                textAlign: 'center'
              }}
            >

              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background:
                    index <= currentStep
                      ? '#27ae60'
                      : '#ddd',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}
              >
                {index < currentStep ? '✓' : index + 1}
              </div>

              <strong>{step}</strong>

            </div>

          ))}

        </div>

      )}

      <hr />

      {/* 商品資訊 */}

      <h2>商品資訊</h2>

      <div
        style={{
          ...boxStyle,
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >

        <div
          style={{
            fontSize: '50px',
            background: '#eee',
            padding: '20px',
            borderRadius: '10px'
          }}
        >
          📱
        </div>

        <div style={{ flex: 1, minWidth: '150px' }}>

          <h3>{order.productName}</h3>

          <p>適用型號：{order.model}</p>

          <p>數量：{order.quantity}</p>

          <p>
            單價：NT$ {unitPrice.toLocaleString()}
          </p>

        </div>

        <strong>
          NT$ {subtotal.toLocaleString()}
        </strong>

      </div>

      <hr />

      {/* 收件人資訊 */}

      <h2>收件人資訊</h2>

      <div style={boxStyle}>

        <p>
          <strong>收件人：</strong>
          {order.receiverName || '尚未記錄（舊測試訂單）'}
        </p>

        <p>
          <strong>聯絡電話：</strong>
          {order.receiverPhone || '尚未記錄（舊測試訂單）'}
        </p>

        {/* 宅配才顯示地址 */}

        {order.shippingMethod === 'HOME' && (

          <p>
            <strong>收件地址：</strong>
            {order.receiverAddress}
          </p>

        )}

      </div>

      <hr />

      {/* 配送資訊 */}

      <h2>配送資訊</h2>

      <div style={boxStyle}>

        <p>
          <strong>配送方式：</strong>
          {shippingText}
        </p>

        {/* 超商取貨才顯示門市 */}

        {order.shippingMethod === 'CVS' && (

          <>

            <p>
              <strong>取貨門市：</strong>
              {order.storeName || '尚未選擇'}
            </p>

            <p>
              <strong>門市地區：</strong>
              {order.storeLocation || '尚未記錄'}
            </p>

          </>

        )}

        <p>
          <strong>訂單狀態：</strong>
          {order.status}
        </p>

      </div>

      <hr />

      {/* 付款資訊 */}

      <h2>付款資訊</h2>

      <div style={boxStyle}>

        <p>
          <strong>付款方式：</strong>
          {paymentText}
        </p>

      </div>

      <hr />

      {/* 訂單金額 */}

      <h2>訂單金額</h2>

      <div style={boxStyle}>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >

          <span>商品小計</span>

          <span>
            NT$ {subtotal.toLocaleString()}
          </span>

        </div>

        <br />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >

          <span>運費</span>

          <span>
            NT$ {order.shippingFee}
          </span>

        </div>

        <hr />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px'
          }}
        >

          <strong>訂單總金額</strong>

          <strong
            style={{
              color: '#e53935',
              fontSize: '26px'
            }}
          >
            NT$ {order.total.toLocaleString()}
          </strong>

        </div>

      </div>

    </div>

  )
}

export default OrderDetailPage