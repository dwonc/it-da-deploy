package com.project.itda.domain.participation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 참여자 정보 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantDto {
    private Long userId;
    private String username;
    private String profileImage;
    private String status;
    private LocalDateTime joinedAt;
}