package com.phonecase.backend.controller;

import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/image-samples")
public class ImageSampleUploadController {

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> upload(@RequestParam("file") MultipartFile file)
            throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("圖片不可為空");
        }
        if (file.getContentType() == null
                || !file.getContentType().startsWith("image/")) {
            throw new IllegalArgumentException("只允許上傳圖片檔案");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("圖片大小不可超過 5MB");
        }

        String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + "." + (extension == null ? "jpg" : extension);
        Path uploadDir = Paths.get("uploads").toAbsolutePath().normalize();
        Files.createDirectories(uploadDir);
        Files.copy(file.getInputStream(), uploadDir.resolve(filename),
                StandardCopyOption.REPLACE_EXISTING);

        return Map.of("imageUrl", "/images/" + filename);
    }
}
