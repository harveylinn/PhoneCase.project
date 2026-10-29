package com.phonecase.backend.order.entity;

import com.phonecase.backend.service.ShopOrderSyncListener;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "`order`")
// 訂單異動後立即同步到後台訂單 sales_order
@EntityListeners(ShopOrderSyncListener.class)
public class OrderEntity {

    // ==========================
    // 1. 訂單 ID
    // ==========================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==========================
    // 2. 訂單基本資料
    // ==========================

    @Column(name = "order_number", nullable = false, unique = true)
    private String orderNumber;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "order_status", nullable = false)
    private String orderStatus = "PENDING_PAYMENT";

    // ==========================
    // 3. 收件人資料
    // ==========================

    @Column(name = "receiver_name", nullable = false)
    private String receiverName;

    @Column(name = "receiver_phone", nullable = false)
    private String receiverPhone;

    // ==========================
    // 4. 配送資訊
    // ==========================

    @Column(name = "shipping_method", nullable = false)
    private String shippingMethod;

    @Column(name = "receiver_address")
    private String receiverAddress;

    // ==========================
    // 5. 超商門市資訊
    // ==========================

    @Column(name = "store_chain")
    private String storeChain;

    @Column(name = "store_code")
    private String storeCode;

    @Column(name = "store_name")
    private String storeName;

    @Column(name = "store_location")
    private String storeLocation;

    // ==========================
    // 6. 付款方式
    // ==========================

    @Column(name = "payment_method", nullable = false)
    private String paymentMethod;

    // ==========================
    // 7. 訂單金額
    // ==========================

    @Column(name = "item_subtotal")
    private BigDecimal itemSubtotal = BigDecimal.ZERO;

    @Column(name = "shipping_fee")
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Column(name = "total_amount")
    private BigDecimal totalAmount = BigDecimal.ZERO;

    // ==========================
    // 8. 建立與更新時間
    // ==========================

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    // ==========================
    // 9. 無參數建構子
    // ==========================

    public OrderEntity() {
    }

    // ==========================
    // 10. Getter / Setter
    // ==========================

    public Long getId() {
        return id;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public String getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(String orderStatus) {
        this.orderStatus = orderStatus;
    }

    public String getReceiverName() {
        return receiverName;
    }

    public void setReceiverName(String receiverName) {
        this.receiverName = receiverName;
    }

    public String getReceiverPhone() {
        return receiverPhone;
    }

    public void setReceiverPhone(String receiverPhone) {
        this.receiverPhone = receiverPhone;
    }

    public String getShippingMethod() {
        return shippingMethod;
    }

    public void setShippingMethod(String shippingMethod) {
        this.shippingMethod = shippingMethod;
    }

    public String getReceiverAddress() {
        return receiverAddress;
    }

    public void setReceiverAddress(String receiverAddress) {
        this.receiverAddress = receiverAddress;
    }

    public String getStoreChain() {
        return storeChain;
    }

    public void setStoreChain(String storeChain) {
        this.storeChain = storeChain;
    }

    public String getStoreCode() {
        return storeCode;
    }

    public void setStoreCode(String storeCode) {
        this.storeCode = storeCode;
    }

    public String getStoreName() {
        return storeName;
    }

    public void setStoreName(String storeName) {
        this.storeName = storeName;
    }

    public String getStoreLocation() {
        return storeLocation;
    }

    public void setStoreLocation(String storeLocation) {
        this.storeLocation = storeLocation;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public BigDecimal getItemSubtotal() {
        return itemSubtotal;
    }

    public void setItemSubtotal(BigDecimal itemSubtotal) {
        this.itemSubtotal = itemSubtotal;
    }

    public BigDecimal getShippingFee() {
        return shippingFee;
    }

    public void setShippingFee(BigDecimal shippingFee) {
        this.shippingFee = shippingFee;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}