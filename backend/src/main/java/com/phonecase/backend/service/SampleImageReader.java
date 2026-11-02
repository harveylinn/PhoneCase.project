package com.phonecase.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import java.io.*;
import java.net.URI;
import java.net.http.*;
import java.nio.file.*;
import java.time.Duration;
import java.util.Locale;
import java.util.Set;

/** Read Cloudinary images into memory only. Legacy local samples remain readable. */
@Component
public class SampleImageReader {
    static final int MAX_BYTES = 5 * 1024 * 1024;
    private static final Set<String> TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
    private final Path uploadRoot;
    private final HttpClient client;

    @org.springframework.beans.factory.annotation.Autowired
    public SampleImageReader(@Value("${app.upload.dir:uploads}") String uploadDir) {
        this(Paths.get(uploadDir), HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NEVER).build());
    }

    SampleImageReader(Path uploadRoot, HttpClient client) {
        this.uploadRoot = uploadRoot.toAbsolutePath().normalize();
        this.client = client;
    }

    public static URI cloudinaryUri(String value) {
        try {
            URI uri = URI.create(value == null ? "" : value.trim());
            if (!"https".equalsIgnoreCase(uri.getScheme())
                    || !"res.cloudinary.com".equalsIgnoreCase(uri.getHost())
                    || uri.getRawUserInfo() != null || uri.getPort() != -1
                    || uri.getFragment() != null
                    || uri.getPath() == null || !uri.getPath().matches("/[^/]+/image/upload/.+")) {
                throw new IllegalArgumentException();
            }
            return uri;
        } catch (IllegalArgumentException error) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "請使用 Cloudinary 的 HTTPS 圖片網址");
        }
    }

    public ImageData read(String imageUrl) {
        if (imageUrl != null && imageUrl.startsWith("/images/")) return readLegacy(imageUrl);
        URI uri = cloudinaryUri(imageUrl);
        try {
            var request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(30))
                    .header("Accept", "image/jpeg,image/png,image/webp,image/gif").GET().build();
            var response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
            try (InputStream stream = response.body()) {
                if (response.statusCode() != 200) {
                    throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                            "無法讀取雲端圖片，請確認 Cloudinary 圖片網址可公開存取");
                }
                String mime = response.headers().firstValue("Content-Type").orElse("")
                        .split(";", 2)[0].trim().toLowerCase(Locale.ROOT);
                requireType(mime);
                if (response.headers().firstValueAsLong("Content-Length").orElse(0) > MAX_BYTES) tooLarge();
                return new ImageData(readLimited(stream), mime);
            }
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "雲端圖片讀取中斷", error);
        } catch (IOException error) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "雲端圖片讀取失敗，請稍後重試", error);
        }
    }

    private ImageData readLegacy(String url) {
        Path file = uploadRoot.resolve(url.substring("/images/".length())).normalize();
        try {
            if (!file.startsWith(uploadRoot) || !Files.isRegularFile(file)
                    || !file.toRealPath().startsWith(uploadRoot.toRealPath())) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到舊版圖片檔案");
            }
            String mime = Files.probeContentType(file);
            requireType(mime);
            try (InputStream stream = Files.newInputStream(file)) {
                return new ImageData(readLimited(stream), mime);
            }
        } catch (IOException error) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到舊版圖片檔案", error);
        }
    }

    private static void requireType(String mime) {
        if (!TYPES.contains(mime == null ? "" : mime)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "圖片必須是 JPG、PNG、WebP 或 GIF");
        }
    }

    static byte[] readLimited(InputStream stream) throws IOException {
        byte[] bytes = stream.readNBytes(MAX_BYTES + 1);
        if (bytes.length > MAX_BYTES) tooLarge();
        if (bytes.length == 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "圖片不可為空");
        return bytes;
    }

    private static void tooLarge() {
        throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "圖片大小不可超過 5MB");
    }

    public record ImageData(byte[] bytes, String mimeType) {}
}
