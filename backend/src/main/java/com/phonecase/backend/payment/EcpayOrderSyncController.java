package com.phonecase.backend.payment;

import com.phonecase.backend.order.entity.OrderEntity;
import com.phonecase.backend.order.repository.OrderRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.HtmlUtils;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.URLDecoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Controller
@Profile("local-demo")
@RequestMapping("/api/payment/ecpay/sync")
public class EcpayOrderSyncController {

    private static final String QUERY_URL =
            "https://payment-stage.ecpay.com.tw/Cashier/QueryTradeInfo/V5";

    @Value("${ECPAY_MERCHANT_ID:2000132}")
    private String merchantId;

    @Value("${ECPAY_HASH_KEY:}")
    private String hashKey;

    @Value("${ECPAY_HASH_IV:}")
    private String hashIV;

    private final OrderRepository orderRepository;

    public EcpayOrderSyncController(
            OrderRepository orderRepository
    ) {
        this.orderRepository = orderRepository;
    }

    // ====================================
    // 1. 確認測試會員登入
    // ====================================

    private HttpSession checkLogin(
            HttpServletRequest request,
            OrderEntity order
    ) {
        HttpSession session = request.getSession(false);

        if (session == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "請先登入測試會員"
            );
        }

        Object value = session.getAttribute("memberId");

        if (!(value instanceof Number)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "請先登入測試會員"
            );
        }

        Long memberId = ((Number) value).longValue();

        if (!memberId.equals(order.getMemberId())) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "找不到訂單"
            );
        }

        return session;
    }

    // ====================================
    // 2. 根據 PC5 等交易編號找訂單
    // ====================================

    private OrderEntity findOrder(
            String tradeNo,
            HttpServletRequest request
    ) {
        if (!tradeNo.matches("PC[0-9A-Z]+")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "交易編號格式錯誤"
            );
        }

        Long orderId;

        try {
            orderId = Long.parseLong(
                    tradeNo.substring(2), 36
            );
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "交易編號錯誤"
            );
        }

        if (orderId <= 0 ||
                !tradeNo.equals(
                        "PC" + Long.toString(
                                orderId, 36
                        ).toUpperCase(Locale.ROOT)
                )) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "交易編號錯誤"
            );
        }

        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "找不到訂單"
                        )
                );

        checkLogin(request, order);

        if (!"CREDIT_CARD".equals(order.getPaymentMethod())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "這筆訂單不是信用卡付款"
            );
        }

        return order;
    }

    // ====================================
    // 3. 向綠界查詢交易
    // ====================================

    private Map<String, String> queryEcpay(
            String tradeNo,
            OrderEntity order
    ) {
        if (hashKey.isBlank() || hashIV.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "尚未設定綠界測試金鑰"
            );
        }

        Map<String, String> params = new LinkedHashMap<>();

        params.put("MerchantID", merchantId);
        params.put("MerchantTradeNo", tradeNo);
        params.put(
                "TimeStamp",
                String.valueOf(Instant.now().getEpochSecond())
        );

        params.put(
                "CheckMacValue",
                EcpayCheckMacUtil.generate(
                        params, hashKey, hashIV
                )
        );

        StringBuilder form = new StringBuilder();

        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (!form.isEmpty()) {
                form.append("&");
            }

            form.append(
                    URLEncoder.encode(
                            entry.getKey(),
                            StandardCharsets.UTF_8
                    )
            );

            form.append("=");

            form.append(
                    URLEncoder.encode(
                            entry.getValue(),
                            StandardCharsets.UTF_8
                    )
            );
        }

        String responseText;

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(QUERY_URL))
                    .timeout(Duration.ofSeconds(20))
                    .header(
                            "Content-Type",
                            "application/x-www-form-urlencoded"
                    )
                    .POST(
                            HttpRequest.BodyPublishers.ofString(
                                    form.toString()
                            )
                    )
                    .build();

            HttpResponse<String> response = client.send(
                    httpRequest,
                    HttpResponse.BodyHandlers.ofString()
            );

            if (response.statusCode() != 200) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "綠界查詢失敗，HTTP：" +
                                response.statusCode()
                );
            }

            responseText = response.body();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "查詢綠界時被中斷"
            );

        } catch (java.io.IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "無法連線綠界"
            );
        }

        // ====================================
        // 4. 解析綠界回傳資料
        // ====================================

        Map<String, String> result = new LinkedHashMap<>();

        for (String pair : responseText.split("&")) {
            String[] parts = pair.split("=", 2);

            if (parts.length == 2) {

                String key = URLDecoder.decode(
                        parts[0],
                        StandardCharsets.UTF_8
                );

                String value = URLDecoder.decode(
                        parts[1],
                        StandardCharsets.UTF_8
                );

                if (result.putIfAbsent(key, value) != null) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_GATEWAY,
                            "綠界回傳重複欄位"
                    );
                }
            }
        }

        // ====================================
        // 5. 驗證綠界回傳檢查碼
        // ====================================

        String receivedMac =
                result.getOrDefault("CheckMacValue", "");

        if (receivedMac.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "綠界回傳缺少檢查碼"
            );
        }

        String calculatedMac = EcpayCheckMacUtil.generate(
                result, hashKey, hashIV
        );

        boolean validMac = MessageDigest.isEqual(
                calculatedMac.getBytes(StandardCharsets.UTF_8),
                receivedMac.toUpperCase(Locale.ROOT)
                        .getBytes(StandardCharsets.UTF_8)
        );

        if (!validMac) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "綠界查詢結果驗證失敗"
            );
        }

        // ====================================
        // 6. 確認特店與交易編號
        // ====================================

        if (!merchantId.equals(result.get("MerchantID")) ||
                !tradeNo.equals(result.get("MerchantTradeNo"))) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "綠界回傳的交易資料不一致"
            );
        }

        // ====================================
        // 7. 核對 MySQL 金額
        // ====================================

        BigDecimal amount;

        try {
            amount = new BigDecimal(
                    result.get("TradeAmt")
            );
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "綠界回傳金額錯誤"
            );
        }

        if (order.getTotalAmount() == null ||
                order.getTotalAmount().compareTo(amount) != 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "綠界付款金額與 MySQL 不一致"
            );
        }

        // 已付款時，進一步確認付款資料
        if ("1".equals(result.get("TradeStatus"))) {

            String paymentDate =
                    result.getOrDefault("PaymentDate", "");

            String paymentType =
                    result.getOrDefault("PaymentType", "");

            if (paymentDate.isBlank() ||
                    !paymentType.startsWith("Credit")) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "綠界付款資料不完整"
                );
            }
        }

        return result;
    }

    // ====================================
    // 8. 顯示網頁
    // ====================================

    private String page(
            String tradeNo,
            String message,
            String token,
            boolean canSync
    ) {
        StringBuilder html = new StringBuilder();

        html.append("""
                <!DOCTYPE html>
                <html lang="zh-Hant">
                <head>
                    <meta charset="UTF-8">
                    <title>綠界訂單同步</title>
                </head>
                <body style="font-family:sans-serif;
                             max-width:700px;
                             margin:70px auto;
                             padding:20px;">

                    <h1>綠界付款狀態查詢</h1>
                """);

        html.append("<h2>交易編號：")
                .append(HtmlUtils.htmlEscape(tradeNo))
                .append("</h2>");

        html.append("<p>")
                .append(HtmlUtils.htmlEscape(message))
                .append("</p>");

        if (canSync) {

            html.append("""
                    <form method="POST">
                    """);

            html.append("<input type=\"hidden\" name=\"token\" value=\"")
                    .append(HtmlUtils.htmlEscape(token))
                    .append("\">");

            html.append("""
                    <button type="submit"
                            style="padding:14px 24px;
                                   font-size:18px;
                                   cursor:pointer;">
                        確認同步到 MySQL
                    </button>
                    </form>
                    """);
        }

        html.append("</body></html>");

        return html.toString();
    }

    // ====================================
    // 9. GET：只查詢，不修改 MySQL
    // ====================================

    @GetMapping(
            value = "/{tradeNo}",
            produces = MediaType.TEXT_HTML_VALUE
    )
    @ResponseBody
    public String preview(
            @PathVariable String tradeNo,
            HttpServletRequest request
    ) {
        OrderEntity order = findOrder(tradeNo, request);

        Map<String, String> result =
                queryEcpay(tradeNo, order);

        String tradeStatus =
                result.getOrDefault("TradeStatus", "");

        String token = "";
        boolean canSync = false;

        if ("1".equals(tradeStatus) &&
                "PENDING_PAYMENT".equals(order.getOrderStatus())) {

            HttpSession session = request.getSession(false);

            token = UUID.randomUUID().toString();

            session.setAttribute("ecpaySyncToken", token);

            canSync = true;
        }

        String message =
                "綠界交易狀態：" + tradeStatus +
                "（1=已付款，0=未付款）；" +
                "MySQL 訂單狀態：" + order.getOrderStatus() +
                "；金額：NT$ " + order.getTotalAmount();

        return page(
                tradeNo,
                message,
                token,
                canSync
        );
    }

    // ====================================
    // 10. POST：確認後才更新 MySQL
    // ====================================

    @PostMapping(
            value = "/{tradeNo}",
            produces = MediaType.TEXT_HTML_VALUE
    )
    @ResponseBody
    @Transactional
    public String sync(
            @PathVariable String tradeNo,
            @RequestParam String token,
            HttpServletRequest request
    ) {
        OrderEntity order = findOrder(tradeNo, request);

        HttpSession session = request.getSession(false);

        String savedToken =
                (String) session.getAttribute("ecpaySyncToken");

        if (savedToken == null ||
                !MessageDigest.isEqual(
                        savedToken.getBytes(StandardCharsets.UTF_8),
                        token.getBytes(StandardCharsets.UTF_8)
                )) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "請先開啟查詢頁面"
            );
        }

        session.removeAttribute("ecpaySyncToken");

        // 再查一次綠界，避免使用舊結果
        Map<String, String> result =
                queryEcpay(tradeNo, order);

        if (!"1".equals(result.get("TradeStatus"))) {

            return page(
                    tradeNo,
                    "綠界尚未確認付款，MySQL 不會修改。",
                    "",
                    false
            );
        }

        // 防止已取消、已出貨等訂單被改動
        if (!"PENDING_PAYMENT".equals(order.getOrderStatus())) {

            return page(
                    tradeNo,
                    "目前訂單狀態：" + order.getOrderStatus() +
                            "，沒有修改 MySQL。",
                    "",
                    false
            );
        }

        order.setOrderStatus("PENDING_SHIPMENT");

        orderRepository.saveAndFlush(order);

        return page(
                tradeNo,
                "同步成功！MySQL 訂單已更新成待出貨（PENDING_SHIPMENT）。",
                "",
                false
        );
    }
}