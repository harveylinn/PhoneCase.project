package com.phonecase.backend.payment;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payment/ecpay")
public class EcpayCallbackController {

    @Value("${ECPAY_MERCHANT_ID:2000132}")
    private String merchantId;

    @Value("${ECPAY_HASH_KEY:}")
    private String hashKey;

    @Value("${ECPAY_HASH_IV:}")
    private String hashIV;

    // 接收綠界付款通知
    @PostMapping(
    value = "/notify",
    consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE
)
    public ResponseEntity<String> receivePayment(
            @RequestParam Map<String, String> params
    ) {
        System.out.println("收到綠界通知，參數名稱：" + params.keySet());

        // 1. 檢查金鑰
        if (hashKey.isBlank() || hashIV.isBlank()) {
            return ResponseEntity
                    .status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("0|CONFIG_ERROR");
        }

        // 2. 取得綠界傳來的檢查碼
        String receivedMac =
                params.getOrDefault("CheckMacValue", "");

        if (receivedMac.isBlank()) {
            return ResponseEntity
                    .badRequest()
                    .body("0|INVALID_MAC");
        }

        // 3. 自己重新計算檢查碼
        String calculatedMac = EcpayCheckMacUtil.generate(
                params,
                hashKey,
                hashIV
        );

        // 4. 比對檢查碼
        boolean validMac = MessageDigest.isEqual(
                calculatedMac.getBytes(StandardCharsets.UTF_8),
                receivedMac.toUpperCase(Locale.ROOT)
                        .getBytes(StandardCharsets.UTF_8)
        );

        if (!validMac) {
            System.out.println("綠界付款通知：驗證失敗");

            return ResponseEntity
                    .badRequest()
                    .body("0|INVALID_MAC");
        }

        // 5. 確認特店編號
        if (!merchantId.equals(params.get("MerchantID"))) {
            return ResponseEntity
                    .badRequest()
                    .body("0|INVALID_MERCHANT");
        }

        // 6. 取得付款資訊
        String tradeNo = params.get("MerchantTradeNo");
        String rtnCode = params.get("RtnCode");
        String tradeAmount = params.get("TradeAmt");
        String simulatePaid = params.get("SimulatePaid");

        System.out.println("===== 綠界付款測試通知 =====");
        System.out.println("交易編號：" + tradeNo);
        System.out.println("交易金額：" + tradeAmount);
        System.out.println("付款狀態碼：" + rtnCode);

        // 7. 判斷付款結果
        if ("1".equals(simulatePaid)) {

            System.out.println("綠界後台模擬付款通知");

        } else if ("1".equals(rtnCode)) {

            System.out.println("綠界回報付款成功（尚未更新資料庫）");

        } else {

            System.out.println("付款未成功或狀態異常");
        }

        // 8. 告訴綠界：已收到測試通知
        return ResponseEntity.ok("1|OK");
    }
}