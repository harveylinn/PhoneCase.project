package com.phonecase.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/image-samples")
public class ImageSampleUploadController {
    @PostMapping("/upload")
    public void upload() {
        throw new ResponseStatusException(HttpStatus.GONE,
                "請先將圖片上傳至 Cloudinary，再使用圖片網址新增樣本");
    }
}
