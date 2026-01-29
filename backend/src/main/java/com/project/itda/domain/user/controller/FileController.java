package com.project.itda.domain.user.controller;


import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@RestController
@RequestMapping("/uploads")
public class FileController {

    // ✅ 너의 맥 경로로 설정!
    @Value("${file.upload-dir}")
    private String uploadDir;

    @GetMapping("/{fileName}")
    public ResponseEntity<Resource> serveChatImage(
            @PathVariable String fileName,
            @RequestParam(value = "download", defaultValue = "false") boolean download) {
        return serveFile(fileName, "", download);
    }

    // ✅ [수정 2] 여기도 추가
    @GetMapping("/meetings/{fileName}")
    public ResponseEntity<Resource> serveMeetingImage(
            @PathVariable String fileName,
            @RequestParam(value = "download", defaultValue = "false") boolean download) {
        return serveFile(fileName, "meetings", download);
    }

    // ✅ [수정 3] 공통 메서드 수정: 'boolean download' 파라미터 처리
    private ResponseEntity<Resource> serveFile(String fileName, String subDir, boolean download) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(subDir).resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = "image/png";
                if (fileName.toLowerCase().endsWith(".jpg") || fileName.toLowerCase().endsWith(".jpeg")) {
                    contentType = "image/jpeg";
                } else if (fileName.toLowerCase().endsWith(".gif")) {
                    contentType = "image/gif";
                }

                // 한글 파일명 깨짐 방지
                String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8)
                        .replace("+", "%20");

                // ⚡ [핵심] download가 true면 "attachment"(다운로드), 아니면 "inline"(보기)
                String dispositionType = download ? "attachment" : "inline";

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        // ⚡ 여기가 수정된 부분입니다!
                        .header(HttpHeaders.CONTENT_DISPOSITION, dispositionType + "; filename=\"" + encodedFileName + "\"")
                        .body(resource);
            } else {
                log.error("❌ 파일 없음: {}", filePath);
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            log.error("❌ URL 오류: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}