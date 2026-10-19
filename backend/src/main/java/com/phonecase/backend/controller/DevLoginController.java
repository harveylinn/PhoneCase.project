package com.phonecase.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.server.ResponseStatusException;

@Controller
@Profile("local-demo")
@RequestMapping("/api/dev-login")
public class DevLoginController {

    // 測試會員 ID
    private static final Long TEST_MEMBER_ID = 1L;

    // 限制只能透過本機網址使用
    private void checkLocalhost(HttpServletRequest request) {

        String host = request.getServerName();

        if (!"localhost".equals(host)
                && !"127.0.0.1".equals(host)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "測試登入只允許本機使用"
            );
        }
    }

    // ===================================
    // 1. 顯示測試登入頁面
    // ===================================

    @GetMapping
    @ResponseBody
    public String loginPage(HttpServletRequest request) {

        checkLocalhost(request);

        return """
                <!DOCTYPE html>
                <html lang="zh-Hant">
                <head>
                    <meta charset="UTF-8">
                    <title>訂單測試登入</title>
                </head>
                <body style="font-family:sans-serif;
                             text-align:center;
                             padding:80px;">

                    <h1>手機殼網站：測試會員登入</h1>

                    <p>測試會員 ID：1</p>

                    <form method="POST" action="/api/dev-login">

                        <button type="submit"
                                style="padding:15px 30px;
                                       font-size:18px;
                                       cursor:pointer;">

                            使用測試會員登入

                        </button>

                    </form>

                </body>
                </html>
                """;
    }

    // ===================================
    // 2. 建立測試登入 Session
    // ===================================

    @PostMapping
    @ResponseBody
    public String login(
            HttpServletRequest request
    ) {

        checkLocalhost(request);

        // 取得或建立 Session
        HttpSession session = request.getSession(true);

        // 模擬會員登入
        session.setAttribute("memberId", TEST_MEMBER_ID);

        System.out.println(
                "測試會員登入成功，memberId = "
                        + TEST_MEMBER_ID
        );

        return """
                <!DOCTYPE html>
                <html lang="zh-Hant">
                <head>
                    <meta charset="UTF-8">
                    <title>登入成功</title>
                </head>

                <body style="font-family:sans-serif;
                             text-align:center;
                             padding:80px;">

                    <h1>✅ 測試會員登入成功！</h1>

                    <p>會員 ID：1</p>

                    <p>Session 已建立。</p>

                    <p>現在可以回到 React 結帳頁面。</p>

                </body>
                </html>
                """;
    }
}