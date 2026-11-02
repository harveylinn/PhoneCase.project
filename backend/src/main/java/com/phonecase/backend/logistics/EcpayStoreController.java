package com.phonecase.backend.logistics;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/logistics/ecpay")
public class EcpayStoreController {

    // 綠界物流測試網址
    private static final String MAP_URL =
            "https://logistics-stage.ecpay.com.tw/Express/map";

    // React 前端網址
    private static final String FRONTEND_URL =
        "http://localhost:5174";

    // 綠界測試特店編號
    @Value("${ECPAY_MERCHANT_ID:2000132}")
    private String merchantId;

    // 綠界選完門市後，要回傳資料的 HTTPS 網址
    @Value("${ECPAY_LOGISTICS_REPLY_URL:}")
    private String replyUrl;

    // ========================================
    // 1. 開啟綠界超商選店頁面
    // ========================================

    @GetMapping(
        value = "/map",
        produces = MediaType.TEXT_HTML_VALUE
    )
    public String openMap(
            @RequestParam(defaultValue = "UNIMART") String store
    ) {

        // 只允許 7-ELEVEN 或全家
        if (!store.equals("UNIMART") &&
            !store.equals("FAMI")) {

            return "<h2>不支援的超商類型</h2>";
        }

        // 檢查 HTTPS 回傳網址
        if (replyUrl.isBlank() ||
            !replyUrl.startsWith("https://")) {

            return "<h2>尚未設定物流 HTTPS 回傳網址</h2>";
        }

        // 建立表單，送往綠界選店系統
        return """
            <!DOCTYPE html>
            <html lang="zh-Hant">

            <head>
                <meta charset="UTF-8">
                <title>綠界超商選店</title>
            </head>

            <body>

                <h2>正在開啟綠界超商選店...</h2>

                <form
                    id="storeForm"
                    action="%s"
                    method="POST"
                >

                    <input
                        type="hidden"
                        name="MerchantID"
                        value="%s"
                    >

                    <input
                        type="hidden"
                        name="LogisticsType"
                        value="CVS"
                    >

                    <input
                        type="hidden"
                        name="LogisticsSubType"
                        value="%s"
                    >

                    <input
                        type="hidden"
                        name="IsCollection"
                        value="N"
                    >

                    <input
                        type="hidden"
                        name="ServerReplyURL"
                        value="%s"
                    >

                </form>

                <script>
                    document.getElementById("storeForm").submit();
                </script>

            </body>
            </html>
            """.formatted(
                escapeHtml(MAP_URL),
                escapeHtml(merchantId),
                escapeHtml(store),
                escapeHtml(replyUrl)
            );
    }


    // ========================================
    // 2. 接收綠界回傳的門市資料
    // ========================================

    @PostMapping(
        value = "/reply",
        consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE,
        produces = MediaType.TEXT_HTML_VALUE
    )
    public String receiveStore(
            @RequestParam Map<String, String> params
    ) {

        // 取得門市資料
        String storeId =
                params.getOrDefault("CVSStoreID", "");

        String storeName =
                params.getOrDefault("CVSStoreName", "");

        String storeAddress =
                params.getOrDefault("CVSAddress", "");

        String storeChain =
                params.getOrDefault("LogisticsSubType", "");


        // 印在 Spring Boot 終端機
        System.out.println("===== 綠界選店測試 =====");

        System.out.println(
            "門市代碼：" + storeId
        );

        System.out.println(
            "門市名稱：" + storeName
        );

        System.out.println(
            "門市地址：" + storeAddress
        );


        // 檢查有沒有取得門市
        if (storeId.isBlank() || storeName.isBlank()) {

            return """
                <html lang="zh-Hant">
                <meta charset="UTF-8">
                <body>
                    <h2>沒有收到完整的門市資料</h2>
                </body>
                </html>
                """;
        }


        // 避免門市資料直接插入 JavaScript 造成語法問題
        String encodedId = encode(storeId);

        String encodedName = encode(storeName);

        String encodedAddress = encode(storeAddress);

        String encodedChain = encode(storeChain);


        // ========================================
        // 3. 將門市資料傳回 React
        // ========================================

        return """
            <!DOCTYPE html>
            <html lang="zh-Hant">

            <head>
                <meta charset="UTF-8">
                <title>門市選擇完成</title>
            </head>

            <body>

                <h2>門市選擇完成！</h2>

                <p id="message">
                    正在將門市資料傳回結帳頁面...
                </p>

                <p id="storeInfo"></p>

                <script>

                    // 綠界回傳的門市資料
                    const store = {

                        id: decodeURIComponent("%s"),

                        name: decodeURIComponent("%s"),

                        address: decodeURIComponent("%s"),

                        chain: decodeURIComponent("%s")

                    };


                    // 顯示選擇結果
                    document.getElementById("storeInfo").textContent =
                        store.name + "（" + store.id + "）";


                    // 如果是由 React 開啟的視窗
                    if (
                        window.opener &&
                        !window.opener.closed
                    ) {

                        // 將資料傳回 React
                        window.opener.postMessage(
                            {
                                type: "ECPAY_STORE_SELECTED",
                                store: store
                            },
                            "%s"
                        );

                        // 關閉選店視窗
                        window.close();

                    } else {

                        document.getElementById("message").textContent =
                            "已收到門市資料，請回到結帳頁面。";

                    }

                </script>

            </body>
            </html>
            """.formatted(
                encodedId,
                encodedName,
                encodedAddress,
                encodedChain,
                FRONTEND_URL
            );
    }


    // ========================================
    // 4. URL 編碼工具
    // ========================================

    private String encode(String value) {

        return URLEncoder.encode(
            value,
            StandardCharsets.UTF_8
        ).replace("+", "%20");
    }


    // ========================================
    // 5. HTML 特殊字元處理
    // ========================================

    private String escapeHtml(String value) {

        return org.springframework.web.util.HtmlUtils
                .htmlEscape(value);
    }

}
