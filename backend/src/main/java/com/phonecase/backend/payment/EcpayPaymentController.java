package com.phonecase.backend.payment;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.HtmlUtils;

@RestController
public class EcpayPaymentController {

    // 綠界測試付款網址
    private static final String ECPAY_URL =
            "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5";

    // 官方測試特店編號
    @Value("${ECPAY_MERCHANT_ID:2000132}")
    private String merchantId;

    // 金鑰只從後端環境變數讀取
    @Value("${ECPAY_HASH_KEY:}")
    private String hashKey;

    @Value("${ECPAY_HASH_IV:}")
    private String hashIV;

    // 綠界付款完成後通知後端的公開網址
    @Value("${ECPAY_RETURN_URL:}")
    private String returnUrl;

    @GetMapping(
        value = "/api/payment/ecpay/test",
        produces = MediaType.TEXT_HTML_VALUE
    )
    public String testPayment() {

        // 檢查設定
        if (hashKey.isBlank() || hashIV.isBlank()) {
            return "<h2>尚未設定綠界測試金鑰</h2>";
        }

        if (!returnUrl.startsWith("https://")) {
            return "<h2>尚未設定公開的 HTTPS 付款通知網址</h2>";
        }

        // 產生唯一測試交易編號（最多 20 碼）
        String tradeNo =
                "T" + System.currentTimeMillis()
                + UUID.randomUUID().toString().substring(0, 5);

        // 取得台灣時間
        String tradeDate = LocalDateTime
                .now(ZoneId.of("Asia/Taipei"))
                .format(
                    DateTimeFormatter.ofPattern(
                        "yyyy/MM/dd HH:mm:ss"
                    )
                );

        // 準備綠界付款參數
        Map<String, String> params = new LinkedHashMap<>();

        params.put("MerchantID", merchantId);
        params.put("MerchantTradeNo", tradeNo);
        params.put("MerchantTradeDate", tradeDate);

        params.put("PaymentType", "aio");

        // 固定測試金額，不能從前端任意指定
        params.put("TotalAmount", "1260");

        params.put("TradeDesc", "PhoneCase Test");
        params.put("ItemName", "PhoneCase x2");

        params.put("ReturnURL", returnUrl);

        // 指定信用卡付款
        params.put("ChoosePayment", "Credit");

        // SHA-256
        params.put("EncryptType", "1");

        // 產生綠界交易檢查碼
        String checkMacValue = EcpayCheckMacUtil.generate(
                params,
                hashKey,
                hashIV
        );

        params.put("CheckMacValue", checkMacValue);

        // 建立 HTML 表單
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

        // 把參數放入隱藏欄位
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