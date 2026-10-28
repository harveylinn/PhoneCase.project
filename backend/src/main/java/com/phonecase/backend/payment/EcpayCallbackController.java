package com.phonecase.backend.payment;

import com.phonecase.backend.order.entity.OrderEntity;
import com.phonecase.backend.order.repository.OrderRepository;

import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment/ecpay")
public class EcpayCallbackController {

    // ========================================
    // 1. 綠界設定
    // ========================================

    @Value("${ECPAY_MERCHANT_ID:2000132}")
    private String merchantId;

    @Value("${ECPAY_HASH_KEY:}")
    private String hashKey;

    @Value("${ECPAY_HASH_IV:}")
    private String hashIV;

    // ========================================
    // 2. 訂單 Repository
    // ========================================

    private final OrderRepository orderRepository;

    public EcpayCallbackController(
            OrderRepository orderRepository
    ) {
        this.orderRepository = orderRepository;
    }

    // ========================================
    // 3. 接收綠界付款通知
    // POST /api/payment/ecpay/notify
    // ========================================

    @PostMapping(
            value = "/notify",
            consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE
    )
    @Transactional
    public ResponseEntity<String> receivePayment(
            @RequestParam Map<String, String> params
    ) {

        System.out.println("===== 收到綠界付款通知 =====");

        // ========================================
        // 4. 檢查金鑰
        // ========================================

        if (hashKey.isBlank() || hashIV.isBlank()) {

            return ResponseEntity
                    .status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("0|CONFIG_ERROR");
        }

        // ========================================
        // 5. 驗證 CheckMacValue
        // ========================================

        String receivedMac =
                params.getOrDefault("CheckMacValue", "");

        if (receivedMac.isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body("0|INVALID_MAC");
        }

        String calculatedMac =
                EcpayCheckMacUtil.generate(
                        params,
                        hashKey,
                        hashIV
                );

        boolean validMac = MessageDigest.isEqual(
                calculatedMac.getBytes(StandardCharsets.UTF_8),
                receivedMac
                        .toUpperCase(Locale.ROOT)
                        .getBytes(StandardCharsets.UTF_8)
        );

        if (!validMac) {

            System.out.println("付款通知檢查碼錯誤");

            return ResponseEntity
                    .badRequest()
                    .body("0|INVALID_MAC");
        }

        // ========================================
        // 6. 驗證特店編號
        // ========================================

        if (!merchantId.equals(params.get("MerchantID"))) {

            return ResponseEntity
                    .badRequest()
                    .body("0|INVALID_MERCHANT");
        }

        // ========================================
        // 7. 取得付款資訊
        // ========================================

        String tradeNo = params.get("MerchantTradeNo");

        String rtnCode = params.get("RtnCode");

        String tradeAmount = params.get("TradeAmt");

        String simulatePaid = params.get("SimulatePaid");

        System.out.println("交易編號：" + tradeNo);

        System.out.println("交易金額：" + tradeAmount);

        System.out.println("付款狀態碼：" + rtnCode);

        // Stage 的模擬交易只允許在官方測試特店下更新本機測試訂單。
        // 正式特店若收到此旗標，不得因此將訂單標記為已付款。
        if ("1".equals(simulatePaid) && !"2000132".equals(merchantId)) {
            System.out.println("正式特店拒絕模擬付款通知");
            return ResponseEntity
                    .badRequest()
                    .body("0|SIMULATION_NOT_ALLOWED");
        }

        if ("1".equals(simulatePaid)) {
            System.out.println("收到綠界 Stage 模擬付款通知，依測試結果更新本機訂單");
        }

        // ========================================
        // 9. 確認付款成功
        // ========================================

        if (!"1".equals(rtnCode)) {

            System.out.println(
                    "付款尚未成功，不更新訂單狀態"
            );

            return ResponseEntity.ok("1|OK");
        }

        // ========================================
        // 10. 保留原本的獨立付款測試功能
        // ========================================

        if (tradeNo != null && tradeNo.startsWith("T")) {

            System.out.println(
                    "獨立測試交易，不對應 MySQL 訂單"
            );

            return ResponseEntity.ok("1|OK");
        }

        // ========================================
        // 11. 檢查訂單專屬交易編號
        // ========================================

        if (tradeNo == null ||
                !tradeNo.matches("PC[0-9A-Z]+")) {

            System.out.println("交易編號格式不正確");

            return ResponseEntity
                    .badRequest()
                    .body("0|INVALID_TRADE_NO");
        }

        // ========================================
        // 12. 解析 MySQL 訂單 ID
        // ========================================

        Long orderId;

        try {

            String encodedId = tradeNo.substring(2);

            orderId = Long.parseLong(encodedId, 36);

            if (orderId <= 0) {
                throw new NumberFormatException();
            }

            // 確認編碼和目前付款程式一致
            String expectedTradeNo =
                    "PC" + Long.toString(
                            orderId, 36
                    ).toUpperCase(Locale.ROOT);

            if (!tradeNo.equals(expectedTradeNo)) {

                return ResponseEntity
                        .badRequest()
                        .body("0|INVALID_TRADE_NO");
            }

        } catch (NumberFormatException ex) {

            return ResponseEntity
                    .badRequest()
                    .body("0|INVALID_TRADE_NO");
        }

        // ========================================
        // 13. 從 MySQL 查詢訂單
        // ========================================

        Optional<OrderEntity> optionalOrder =
                orderRepository.findById(orderId);

        if (optionalOrder.isEmpty()) {

            System.out.println(
                    "MySQL 找不到交易對應的訂單"
            );

            return ResponseEntity
                    .badRequest()
                    .body("0|ORDER_NOT_FOUND");
        }

        OrderEntity order = optionalOrder.get();

        // ========================================
        // 14. 確認是信用卡訂單
        // ========================================

        if (!"CREDIT_CARD".equals(
                order.getPaymentMethod()
        )) {

            System.out.println(
                    "這筆訂單不是信用卡付款"
            );

            return ResponseEntity
                    .badRequest()
                    .body("0|INVALID_PAYMENT_METHOD");
        }

        // ========================================
        // 15. 核對付款金額
        // ========================================

        BigDecimal paidAmount;

        try {

            paidAmount = new BigDecimal(tradeAmount);

        } catch (Exception ex) {

            return ResponseEntity
                    .badRequest()
                    .body("0|INVALID_AMOUNT");
        }

        BigDecimal orderAmount =
                order.getTotalAmount();

        if (orderAmount == null ||
                orderAmount.compareTo(paidAmount) != 0) {

            System.out.println("付款金額不一致");

            System.out.println(
                    "MySQL 訂單金額：" + orderAmount
            );

            System.out.println(
                    "綠界通知金額：" + paidAmount
            );

            return ResponseEntity
                    .badRequest()
                    .body("0|AMOUNT_MISMATCH");
        }

        // ========================================
        // 16. 防止重複付款通知更新訂單
        // ========================================

        String currentStatus = order.getOrderStatus();

        // 已經是待出貨，代表可能收到重複通知
        if ("PENDING_SHIPMENT".equals(currentStatus)) {

            System.out.println(
                    "訂單已是待出貨，略過重複更新"
            );

            return ResponseEntity.ok("1|OK");
        }

        // 只有待付款才能轉成待出貨
        if (!"PENDING_PAYMENT".equals(currentStatus)) {

            System.out.println(
                    "訂單狀態不允許更新：" + currentStatus
            );

            return ResponseEntity.ok("1|OK");
        }

        // ========================================
        // 17. 更新 MySQL 訂單狀態
        // ========================================

        order.setOrderStatus("PENDING_SHIPMENT");

        orderRepository.saveAndFlush(order);

        System.out.println("===== 訂單付款處理成功 =====");

        System.out.println(
                "訂單編號：" + order.getOrderNumber()
        );

        System.out.println(
                "原本狀態：PENDING_PAYMENT"
        );

        System.out.println(
                "現在狀態：PENDING_SHIPMENT"
        );

        System.out.println(
                "MySQL 訂單狀態更新成功"
        );

        // ========================================
        // 18. 回覆綠界
        // ========================================

        return ResponseEntity.ok("1|OK");
    }
}
