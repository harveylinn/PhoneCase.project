package com.phonecase.backend.service;

import com.phonecase.backend.entity.ImageSample;
import com.phonecase.backend.repository.ImageSampleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ImageSampleService {

    private final ImageSampleRepository repository;

    public ImageSampleService(ImageSampleRepository repository) {
        this.repository = repository;
    }

    public List<ImageSample> findAll(String reviewStatus) {
        if (reviewStatus == null || reviewStatus.isBlank()) {
            return repository.findAll();
        }
        return repository.findByReviewStatusOrderByCreatedAtDesc(reviewStatus);
    }

    public ImageSample findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "找不到圖片樣本，id: " + id));
    }

    public ImageSample create(ImageSample sample) {
        sample.setId(null);
        if (sample.getReviewStatus() == null || sample.getReviewStatus().isBlank()) {
            sample.setReviewStatus("待審核");
        }
        return repository.save(sample);
    }

    public ImageSample updateReview(Long id, String reviewStatus, String reviewerNote) {
        ImageSample sample = findById(id);
        if (!List.of("待審核", "通過", "退回").contains(reviewStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "審核狀態只能是待審核、通過或退回");
        }
        sample.setReviewStatus(reviewStatus);
        sample.setReviewerNote(reviewerNote);
        return repository.save(sample);
    }

    public ImageSample updateDescription(Long id, String aiDescription) {
        ImageSample sample = findById(id);
        sample.setAiDescription(aiDescription);
        return repository.save(sample);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }
}
