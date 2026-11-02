package com.phonecase.backend.payment;

import java.security.SecureRandom;
import java.util.Locale;

/** Creates and parses ECPay trade numbers tied to a local order ID. */
final class EcpayTradeNumber {

    private static final SecureRandom RANDOM = new SecureRandom();
    // Keep Z reserved as the separator so the order ID can be parsed safely.
    private static final char[] SUFFIX_CHARACTERS =
            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXY".toCharArray();
    private static final int SUFFIX_LENGTH = 5;

    private EcpayTradeNumber() {
    }

    static String create(long orderId) {
        if (orderId <= 0) {
            throw new IllegalArgumentException("訂單 ID 必須大於 0");
        }

        StringBuilder tradeNo = new StringBuilder()
                .append('N')
                .append(Long.toString(orderId, 36).toUpperCase(Locale.ROOT))
                .append('Z');

        for (int i = 0; i < SUFFIX_LENGTH; i++) {
            tradeNo.append(
                    SUFFIX_CHARACTERS[RANDOM.nextInt(SUFFIX_CHARACTERS.length)]
            );
        }

        // ECPay MerchantTradeNo is limited to 20 characters.
        if (tradeNo.length() > 20) {
            throw new IllegalArgumentException("交易編號過長");
        }
        return tradeNo.toString();
    }

    static long parseOrderId(String tradeNo) {
        if (tradeNo == null) {
            throw new IllegalArgumentException("交易編號不可為空");
        }

        // Accept trade numbers created by the previous version for pending orders.
        if (tradeNo.matches("PC[0-9A-Z]+")) {
            return parseLegacyOrderId(tradeNo);
        }

        int separator = tradeNo.lastIndexOf('Z');
        if (!tradeNo.startsWith("N")
                || separator < 2
                || separator != tradeNo.length() - SUFFIX_LENGTH - 1
                || !tradeNo.substring(separator + 1).matches("[0-9A-Y]{5}")) {
            throw new IllegalArgumentException("交易編號格式錯誤");
        }

        String encodedId = tradeNo.substring(1, separator);
        long orderId = parsePositiveBase36(encodedId);
        String expectedPrefix =
                "N" + Long.toString(orderId, 36).toUpperCase(Locale.ROOT) + "Z";
        if (!tradeNo.startsWith(expectedPrefix)) {
            throw new IllegalArgumentException("交易編號格式錯誤");
        }
        return orderId;
    }

    private static long parseLegacyOrderId(String tradeNo) {
        long orderId = parsePositiveBase36(tradeNo.substring(2));
        String expected =
                "PC" + Long.toString(orderId, 36).toUpperCase(Locale.ROOT);
        if (!tradeNo.equals(expected)) {
            throw new IllegalArgumentException("交易編號格式錯誤");
        }
        return orderId;
    }

    private static long parsePositiveBase36(String encodedId) {
        try {
            long orderId = Long.parseLong(encodedId, 36);
            if (orderId <= 0) {
                throw new IllegalArgumentException("交易編號中的訂單 ID 錯誤");
            }
            return orderId;
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("交易編號中的訂單 ID 錯誤", exception);
        }
    }
}
