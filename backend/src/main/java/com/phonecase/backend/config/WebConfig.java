
package com.phonecase.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // 與上傳功能使用相同的資料夾
    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(
            ResourceHandlerRegistry registry) {

        String uploadLocation = Paths
                .get(uploadDir)
                .toAbsolutePath()
                .normalize()
                .toUri()
                .toString();

        if (!uploadLocation.endsWith("/")) {
            uploadLocation += "/";
        }

        registry.addResourceHandler("/images/**")
                .addResourceLocations(
                        "classpath:/static/images/",
                        uploadLocation
                );
    }
}
