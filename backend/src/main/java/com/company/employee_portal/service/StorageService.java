package com.company.employee_portal.service;

import com.company.employee_portal.exception.ApiException;
import com.company.employee_portal.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StorageService {

    @Value("${storage.bucket}")
    private String bucket;

    @Value("${storage.public-endpoint}")
    private String publicEndpoint;

    @Value("${spring.servlet.multipart.max-file-size}")
    private DataSize maxFileSize;

    private static final List<String> ALLOWED_TYPES = List.of(
            "image/jpeg", "image/png", "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    public String upload(MultipartFile file) {
        if (file.isEmpty())
            throw new ApiException(ErrorCode.EMPTY_FILE);
        if (file.getSize() > maxFileSize.toBytes())
            throw new ApiException(ErrorCode.FILE_TOO_LARGE);
        if (!ALLOWED_TYPES.contains(file.getContentType()))
            throw new ApiException(ErrorCode.INVALID_FILE_TYPE);

        try {
            String key = UUID.randomUUID() + "_" + file.getOriginalFilename();
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .contentType(file.getContentType())
                            .build(),
                    RequestBody.fromBytes(file.getBytes())
            );
            return key;
        } catch (Exception e) {
            throw new ApiException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }

    public void delete(String key) {
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
        } catch (Exception ignored) {
        }
    }

    public String generatePresignedUrl(String key) {
        try {
            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(15))
                    .getObjectRequest(GetObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .build())
                    .build();
            String url = s3Presigner.presignGetObject(presignRequest).url().toString();
            return s3Presigner
		    .presignGetObject(presignRequest)
        	    .url()
	            .toString();
        } catch (Exception e) {
            throw new ApiException(ErrorCode.FILE_NOT_FOUND);
        }
    }
}
