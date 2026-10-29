package com.phonecase.backend.service;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.web.server.ResponseStatusException;
import java.io.*;
import java.net.http.*;
import java.nio.file.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SampleImageReaderTest {
    static final String URL = "https://res.cloudinary.com/gpjb7mz7/image/upload/v1793135674/Airx.webp";
    @TempDir Path dir;
    @Test void acceptsCloudinaryDeliveryUrl() {
        assertEquals(URL, SampleImageReader.cloudinaryUri("  " + URL + "  ").toString());
    }
    @Test void rejectsOtherHostsRedirectSourcesAndLocalUrls() {
        for (String url : List.of("http://res.cloudinary.com/demo/image/upload/a.jpg", "https://localhost/a.png",
                "https://res.cloudinary.com.evil.test/demo/image/upload/a.jpg", "https://res.cloudinary.com@evil.test/a.jpg",
                "https://res.cloudinary.com/demo/image/fetch/https://localhost/a", "/images/a.jpg")) {
            assertThrows(ResponseStatusException.class, () -> SampleImageReader.cloudinaryUri(url));
        }
    }
    @SuppressWarnings("unchecked")
    HttpResponse<InputStream> response(int status, String mime, byte[] bytes) {
        HttpResponse<InputStream> r = mock(HttpResponse.class);
        when(r.statusCode()).thenReturn(status);
        when(r.headers()).thenReturn(HttpHeaders.of(Map.of("content-type", List.of(mime)), (a,b) -> true));
        when(r.body()).thenReturn(new ByteArrayInputStream(bytes));
        return r;
    }
    @Test void readsCloudImageWithoutWritingFiles() throws Exception {
        var client = mock(HttpClient.class);
        var bytes = new byte[]{1,2,3};
        var ok = response(200, "image/webp", bytes);
        when(client.send(any(HttpRequest.class), org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<InputStream>>any())).thenReturn(ok);
        var image = new SampleImageReader(dir, client).read(URL);
        assertArrayEquals(bytes, image.bytes()); assertEquals("image/webp", image.mimeType());
        try(var files = Files.list(dir)) { assertEquals(0, files.count()); }
    }
    @Test void refusesRedirectsAndNonImages() throws Exception {
        var client = mock(HttpClient.class);
        var redirect = response(302, "image/png", new byte[]{1});
        var html = response(200, "text/html", new byte[]{1});
        when(client.send(any(HttpRequest.class), org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<InputStream>>any())).thenReturn(redirect, html);
        var reader = new SampleImageReader(dir, client);
        assertThrows(ResponseStatusException.class, () -> reader.read(URL));
        assertThrows(ResponseStatusException.class, () -> reader.read(URL));
    }
    @Test void capsImagesEvenWithoutContentLength() {
        assertThrows(ResponseStatusException.class, () -> SampleImageReader.readLimited(new ByteArrayInputStream(new byte[SampleImageReader.MAX_BYTES+1])));
        assertThrows(ResponseStatusException.class, () -> SampleImageReader.readLimited(new ByteArrayInputStream(new byte[0])));
    }
    @Test void retainsLegacyImagesAndRejectsTraversal() throws Exception {
        Files.write(dir.resolve("old.png"), new byte[]{1,2,3});
        var reader = new SampleImageReader(dir, mock(HttpClient.class));
        assertArrayEquals(new byte[]{1,2,3}, reader.read("/images/old.png").bytes());
        assertThrows(ResponseStatusException.class, () -> reader.read("/images/../secret.png"));
    }
    @Test void cloudImageReachesExistingAiAnalysisFlow() {
        var repo = mock(com.phonecase.backend.repository.ImageSampleRepository.class);
        var vision = mock(AiVisionService.class);
        var products = mock(ProductService.class);
        var recommendations = mock(ProductRecommendationService.class);
        var reader = mock(SampleImageReader.class);
        var sample = new com.phonecase.backend.entity.ImageSample(); sample.setId(1L); sample.setImageUrl(URL);
        when(repo.findById(1L)).thenReturn(Optional.of(sample));
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(reader.read(URL)).thenReturn(new SampleImageReader.ImageData(new byte[]{1}, "image/webp"));
        var criteria = new com.phonecase.backend.dto.AiVisionResult("Apple", "iPhone 16 Pro", null, null, null, null);
        when(vision.analyze(any())).thenReturn(criteria);
        when(recommendations.findSimilar(criteria, null)).thenReturn(List.of());
        var service = new ImageSampleService(repo, vision, products, recommendations, reader);
        assertEquals(criteria, service.analyzeImage(1L).criteria());
        verify(vision).analyze(argThat(r -> "AQ==".equals(r.imageBase64()) && "image/webp".equals(r.imageMimeType())));
    }
    @Test void validatesCloudUrlWhenSavingSample() {
        var repo = mock(com.phonecase.backend.repository.ImageSampleRepository.class);
        var service = new ImageSampleService(repo, mock(AiVisionService.class), mock(ProductService.class), mock(ProductRecommendationService.class), mock(SampleImageReader.class));
        var sample = new com.phonecase.backend.entity.ImageSample(); sample.setImageUrl("http://localhost/secret");
        assertThrows(ResponseStatusException.class, () -> service.create(sample));
        verifyNoInteractions(repo);
    }
}
