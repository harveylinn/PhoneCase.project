function OrderDetailPage() {
  return (
    <div>
      <h1>訂單詳細</h1>

      <p>訂單編號：ORD001</p>
      <p>訂單狀態：待出貨</p>

      <hr />

      <h3>商品明細</h3>
      <p>透明手機殼</p>
      <p>數量：2</p>
      <p>單價：$590</p>

      <hr />

      <h3>收件資訊</h3>
      <p>收件人：York</p>
      <p>電話：0912345678</p>
      <p>地址：台中市南屯區...</p>

      <hr />

      <p>總金額：$1,180</p>

      <button>取消訂單</button>
    </div>
  )
}

export default OrderDetailPage