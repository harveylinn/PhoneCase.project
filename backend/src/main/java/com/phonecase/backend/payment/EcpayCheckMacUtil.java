package com.phonecase.backend.payment;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

public class EcpayCheckMacUtil {

    public static String generate(
            Map<String, String> params,
            String hashKey,
            String hashIV
    ) {

        // 1. 將參數依照名稱排序
        TreeMap<String, String> sorted =
                new TreeMap<>(String.CASE_INSENSITIVE_ORDER);

        for (Map.Entry<String, String> entry : params.entrySet()) {

            if (!entry.getKey().equalsIgnoreCase("CheckMacValue")
                    && entry.getValue() != null) {

                sorted.put(entry.getKey(), entry.getValue());
            }
        }

        // 2. 加入 HashKey
        StringBuilder raw = new StringBuilder();
        raw.append("HashKey=").append(hashKey);

        // 3. 串接所有參數
        for (Map.Entry<String, String> entry : sorted.entrySet()) {

            raw.append("&")
               .append(entry.getKey())
               .append("=")
               .append(entry.getValue());
        }

        // 4. 加入 HashIV
        raw.append("&HashIV=").append(hashIV);

        // 5. URL 編碼
        String encoded = URLEncoder.encode(
                raw.toString(),
                StandardCharsets.UTF_8
        );

        // 6. 依綠界規則調整特殊字元
        encoded = encoded
                .replace("%21", "!")
                .replace("%2A", "*")
                .replace("%28", "(")
                .replace("%29", ")")
                .toLowerCase(Locale.ROOT);

        // 7. SHA-256 加密
        try {

            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");

            byte[] bytes = digest.digest(
                    encoded.getBytes(StandardCharsets.UTF_8)
            );

            StringBuilder result = new StringBuilder();

            for (byte b : bytes) {
                result.append(
                        String.format("%02X", b & 0xFF)
                );
            }

            return result.toString();

        } catch (Exception e) {
            throw new IllegalStateException(
                    "綠界檢查碼產生失敗", e
            );
        }
    }
}