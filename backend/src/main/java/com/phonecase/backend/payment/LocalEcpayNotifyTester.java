package com.phonecase.backend.payment;

import java.io.Console;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

public class LocalEcpayNotifyTester {

    public static void main(String[] args) throws Exception {

        // 必須提供：訂單資料庫 ID、金額、模擬模式
        if (args.length != 3) {
            System.out.println(
                "用法：java LocalEcpayNotifyTester <訂單ID> <金額> <1或0>"
            );
            return;
        }

        long orderId = Long.parseLong(args[0]);

        BigDecimal amount = new BigDecimal(args[1]);

        String simulatePaid = args[2];

        if (orderId <= 0 ||
                amount.compareTo(BigDecimal.ZERO) <= 0 ||
                (!"0".equals(simulatePaid) &&
                 !"1".equals(simulatePaid))) {

            throw new IllegalArgumentException(
                "訂單ID、金額或模擬模式不正確"
            );
        }

        // 讀取綠界測試金鑰
        String hashKey = readSecret(
            "ECPAY_HASH_KEY",
            "請輸入綠界測試 HashKey："
        );

        String hashIV = readSecret(
            "ECPAY_HASH_IV",
            "請輸入綠界測試 HashIV："
        );

        String merchantId =
            System.getenv("ECPAY_MERCHANT_ID");

        if (merchantId == null || merchantId.isBlank()) {
            merchantId = "2000132";
        }

        // 與 EcpayPaymentController 使用相同的編號規則
        String tradeNo =
            "PC" + Long.toString(orderId, 36)
                       .toUpperCase(Locale.ROOT);

        // 建立測試通知資料
        Map<String, String> params =
            new LinkedHashMap<>();

        params.put("MerchantID", merchantId);

        params.put("MerchantTradeNo", tradeNo);

        params.put(
            "TradeAmt",
            amount.toBigIntegerExact().toString()
        );

        // 1 = 回報成功
        params.put("RtnCode", "1");

        // 1 = 模擬通知，後端不可更新
        // 0 = 測試正常成功通知處理流程
        params.put("SimulatePaid", simulatePaid);

        // 產生與後端相同規則的檢查碼
        String checkMacValue =
            EcpayCheckMacUtil.generate(
                params,
                hashKey,
                hashIV
            );

        params.put("CheckMacValue", checkMacValue);

        // 將參數轉成表單資料
        String formBody = params.entrySet()
            .stream()
            .map(entry ->
                URLEncoder.encode(
                    entry.getKey(),
                    StandardCharsets.UTF_8
                )
                + "=" +
                URLEncoder.encode(
                    entry.getValue(),
                    StandardCharsets.UTF_8
                )
            )
            .collect(Collectors.joining("&"));

        // 只傳送到自己的本機 Spring Boot
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(
                "http://localhost:8080/api/payment/ecpay/notify"
            ))
            .header(
                "Content-Type",
                "application/x-www-form-urlencoded"
            )
            .POST(
                HttpRequest.BodyPublishers.ofString(formBody)
            )
            .build();

        System.out.println("================================");
        System.out.println("本機綠界通知測試");
        System.out.println("訂單資料庫 ID：" + orderId);
        System.out.println("交易編號：" + tradeNo);
        System.out.println("金額：" + amount);
        System.out.println("SimulatePaid：" + simulatePaid);
        System.out.println("================================");

        HttpClient client = HttpClient.newHttpClient();

        HttpResponse<String> response = client.send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );

        System.out.println(
            "HTTP 狀態碼：" + response.statusCode()
        );

        System.out.println(
            "後端回應：" + response.body()
        );
    }

    // 安全讀取金鑰，不把金鑰印出來
    private static String readSecret(
            String envName,
            String prompt
    ) {

        String value = System.getenv(envName);

        if (value != null && !value.isBlank()) {
            return value;
        }

        Console console = System.console();

        if (console == null) {
            throw new IllegalStateException(
                "請從 VS Code 終端機執行，並設定 " + envName
            );
        }

        char[] password = console.readPassword("%s", prompt);

        if (password == null || password.length == 0) {
            throw new IllegalArgumentException(
                envName + " 不可為空"
            );
        }

        return new String(password);
    }
}