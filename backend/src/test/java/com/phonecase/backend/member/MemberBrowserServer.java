package com.phonecase.backend.member;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.Executors;
import com.sun.net.httpserver.HttpServer;
import org.springframework.http.HttpMethod;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

/** 只在 test classpath 使用，將隔離的 MockMvc API 接到 loopback HTTP，供手動瀏覽器驗收。 */
public class MemberBrowserServer {
    private static volatile String mode = "normal";
    public static void main(String[] args) throws Exception {
        MemberApiTest fixture = new MemberApiTest();
        fixture.setup();
        Path dist = Path.of(args[0]).toAbsolutePath().normalize();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 18080), 0);
        server.setExecutor(Executors.newCachedThreadPool());
        // 故障注入只在這支測試程式，正式 API 沒有這些控制。
        server.createContext("/", exchange -> {
            try {
                String path = exchange.getRequestURI().getPath();
                int status = 200;
                byte[] bytes;
                String contentType = "application/json; charset=utf-8";
                if (path.equals("/__test/mode")) {
                    mode = exchange.getRequestURI().getQuery();
                    bytes = "{\"testMode\":true}".getBytes(StandardCharsets.UTF_8);
                } else if (path.startsWith("/api/member/")) {
                    String currentMode = mode;
                    boolean me = path.equals("/api/member/me") && exchange.getRequestMethod().equals("GET");
                    boolean patch = exchange.getRequestMethod().equals("PATCH");
                    if ((me && currentMode.equals("restore500")) || (patch && currentMode.equals("patch500"))) {
                        status = 500; bytes = "{\"success\":false,\"message\":\"測試服務暫時無法使用，請重試。\"}".getBytes(StandardCharsets.UTF_8);
                    } else if (me && (currentMode.equals("restore403") || currentMode.equals("expired"))) {
                        status = currentMode.equals("expired") ? 401 : 403;
                        bytes = "{\"success\":false,\"message\":\"測試身分確認失敗。\"}".getBytes(StandardCharsets.UTF_8);
                    } else {
                        var request = MockMvcRequestBuilders.request(HttpMethod.valueOf(exchange.getRequestMethod()), path)
                            .content(exchange.getRequestBody().readAllBytes()).contentType("application/json");
                        String auth = exchange.getRequestHeaders().getFirst("Authorization");
                        if (auth != null) request.header("Authorization", auth);
                        synchronized (fixture) {
                            var response = fixture.mvc.perform(request).andReturn().getResponse();
                            status = response.getStatus(); bytes = response.getContentAsByteArray();
                        }
                        if ((me && currentMode.equals("delayMe")) || (patch && currentMode.equals("delayPatch"))) Thread.sleep(3000);
                    }
                } else if (path.startsWith("/api/")) {
                    // 其他組員 API 不偽造成功，以便明確標示本服務僅驗收會員。
                    status = 503; bytes = "{\"message\":\"會員隔離驗收未提供其他模組 API\"}".getBytes(StandardCharsets.UTF_8);
                } else {
                    Path file = dist.resolve(path.substring(1)).normalize();
                    if (!file.startsWith(dist)) { exchange.sendResponseHeaders(403, -1); exchange.close(); return; }
                    if (!Files.isRegularFile(file)) file = dist.resolve("index.html");
                    contentType = file.toString().endsWith(".js") ? "text/javascript" : file.toString().endsWith(".css") ? "text/css" : "text/html; charset=utf-8";
                    bytes = Files.readAllBytes(file);
                }
                exchange.getResponseHeaders().set("Content-Type", contentType);
                exchange.getResponseHeaders().set("Cache-Control", "no-store");
                exchange.sendResponseHeaders(status, bytes.length);
                exchange.getResponseBody().write(bytes);
            } catch (Exception failure) {
                try { exchange.sendResponseHeaders(500, -1); } catch (Exception ignored) { }
            } finally { exchange.close(); }
        });
        server.start();
        System.out.println("MEMBER_TEST_SERVER http://127.0.0.1:18080 - memory only, no database");
    }
}
