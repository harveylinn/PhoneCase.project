package com.phonecase.backend.payment;

import com.phonecase.backend.order.entity.OrderEntity;
import com.phonecase.backend.order.repository.OrderRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.HtmlUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payment/ecpay")
public class EcpayPaymentController {

    // =====================================
    // 1. 綠界測試付款網址
    // =====================================

    private static final String ECPAY_URL =
            "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5";

    @Value("${ECPAY_MERCHANT_ID:2000132}")
    private String merchantId;

    @Value("${ECPAY_HASH_KEY:}")
    private String hashKey;

    @Value("${ECPAY_HASH_IV:}")
    private String hashIV;

    @Value("${ECPAY_RETURN_URL:}")
    private String returnUrl;

    private final OrderRepository orderRepository;

    public EcpayPaymentController(
            OrderRepository orderRepository
    ) {
        this.orderRepository = orderRepository;
    }

    // =====================================
    // 2. 保留原本的測試付款 API
    // GET /api/payment/ecpay/test
    // =====================================

    @GetMapping(
            value = "/test",
            produces = MediaType.TEXT_HTML_VALUE
    )
    public String testPayment() {

        // 原本的固定金額測試
        String tradeNo =
                "T" + System.currentTimeMillis()
                        + UUID.randomUUID()
                              .toString()
                              .substring(0, 5);

        return generatePaymentForm(
                tradeNo,
                "1260",
                "PhoneCase Test"
        );
    }

    // =====================================
    // 3. 新增：根據 MySQL 訂單建立付款
    // GET /api/payment/ecpay/order/{orderNumber}
    // =====================================

    @GetMapping(
            value = "/order/{orderNumber}",
            produces = MediaType.TEXT_HTML_VALUE
    )
    public String payOrder(
            @PathVariable String orderNumber,
            HttpServletRequest request
    ) {

        // =================================
        // 3-1. 確認會員登入
        // =================================

        HttpSession session = request.getSession(false);

        if (session == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "請先登入會員"
            );
        }

        Object memberIdValue =
                session.getAttribute("memberId");

        if (!(memberIdValue instanceof Number)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "找不到會員登入資訊"
            );
        }

        Long memberId =
                ((Number) memberIdValue).longValue();

        // =================================
        // 3-2. 從 MySQL 查詢訂單
        // =================================

        OrderEntity order =
                orderRepository.findByOrderNumber(orderNumber)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "找不到訂單"
                                )
                        );

        // =================================
        // 3-3. 確認這筆訂單屬於本人
        // =================================

        if (!memberId.equals(order.getMemberId())) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "找不到訂單"
            );
        }

        // =================================
        // 3-4. 只有信用卡訂單能使用
        // =================================

        if (!"CREDIT_CARD".equals(order.getPaymentMethod())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "這筆訂單不是信用卡付款"
            );
        }

        // =================================
        // 3-5. 確認尚未付款
        // =================================

        if (!"PENDING_PAYMENT".equals(order.getOrderStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "目前訂單狀態不能進行付款"
            );
        }

        // =================================
        // 3-6. 從 MySQL 取得真正金額
        // =================================

        BigDecimal totalAmount = order.getTotalAmount();

        if (totalAmount == null ||
                totalAmount.compareTo(BigDecimal.ZERO) <= 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "訂單金額不正確"
            );
        }

        String amount;

        try {
            amount = totalAmount
                    .setScale(0, RoundingMode.UNNECESSARY)
                    .toPlainString();

        } catch (ArithmeticException ex) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "目前測試付款只支援整數金額"
            );
        }

        // =================================
        // 3-7. 根據資料庫 ID 產生交易編號
        // =================================

        // Long 轉成 36 進位，縮短交易編號
        String tradeNo =
                "PC" + Long.toString(
                        order.getId(), 36
                ).toUpperCase(Locale.ROOT);

        // 綠界限制 MerchantTradeNo 最多 20 碼
        if (tradeNo.length() > 20) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "交易編號過長"
            );
        }

        System.out.println("===== 建立訂單專屬付款 =====");
        System.out.println(
                "MySQL 訂單編號：" + order.getOrderNumber()
        );
        System.out.println(
                "綠界交易編號：" + tradeNo
        );
        System.out.println(
                "付款金額：" + amount
        );

        // =================================
        // 3-8. 產生綠界付款頁面
        // =================================

        return generatePaymentForm(
                tradeNo,
                amount,
                "PhoneCase Order"
        );
    }

    // =====================================
    // 4. 共用：產生綠界付款 HTML
    // =====================================

    private String generatePaymentForm(
            String tradeNo,
            String amount,
            String description
    ) {

        // 檢查金鑰
        if (hashKey.isBlank() || hashIV.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "尚未設定綠界測試金鑰"
            );
        }

        // 檢查付款通知網址
        if (!returnUrl.startsWith("https://")) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "尚未設定 HTTPS 付款通知網址"
            );
        }

        // 取得台灣時間
        String tradeDate = LocalDateTime
                .now(ZoneId.of("Asia/Taipei"))
                .format(
                        DateTimeFormatter.ofPattern(
                                "yyyy/MM/dd HH:mm:ss"
                        )
                );

        // =================================
        // 5. 組合綠界付款參數
        // =================================

        Map<String, String> params =
                new LinkedHashMap<>();

        params.put("MerchantID", merchantId);

        params.put("MerchantTradeNo", tradeNo);

        params.put("MerchantTradeDate", tradeDate);

        params.put("PaymentType", "aio");

        // 從呼叫端取得金額
        // 訂單付款的金額來自 MySQL
        params.put("TotalAmount", amount);

        params.put("TradeDesc", description);

        params.put("ItemName", "PhoneCase");

        params.put("ReturnURL", returnUrl);

        params.put("ChoosePayment", "Credit");

        params.put("EncryptType", "1");

        // =================================
        // 6. 計算 CheckMacValue
        // =================================

        String checkMacValue =
                EcpayCheckMacUtil.generate(
                        params,
                        hashKey,
                        hashIV
                );

        params.put("CheckMacValue", checkMacValue);

        // =================================
        // 7. 建立 HTML 自動提交表單
        // =================================

        StringBuilder html = new StringBuilder();

        html.append("""
                <!DOCTYPE html>
                <html lang="zh-Hant">
                <head>
                    <meta charset="UTF-8">
                    <title>綠界測試付款</title>
                </head>
                <body>

                    <h2>正在前往綠界測試付款頁面...</h2>

                    <form id="ecpayForm"
                          action="
                """);

        html.append(ECPAY_URL);

        html.append("""
                " method="POST">
                """);

        for (Map.Entry<String, String> entry : params.entrySet()) {

            html.append("<input type=\"hidden\" name=\"")
                    .append(HtmlUtils.htmlEscape(entry.getKey()))
                    .append("\" value=\"")
                    .append(HtmlUtils.htmlEscape(entry.getValue()))
                    .append("\">");
        }

        html.append("""
                    </form>

                    <script>
                        document.getElementById("ecpayForm").submit();
                    </script>

                </body>
                </html>
                """);

        return html.toString();
    }
}