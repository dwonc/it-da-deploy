package com.project.itda.domain.meeting.service;

import com.project.itda.domain.meeting.dto.request.MeetingCreateRequest;
import com.project.itda.domain.meeting.dto.request.MeetingUpdateRequest;
import com.project.itda.domain.meeting.dto.response.MeetingDetailResponse;
import com.project.itda.domain.meeting.dto.response.MeetingResponse;
import com.project.itda.domain.meeting.entity.Meeting;
import com.project.itda.domain.meeting.enums.MeetingStatus;
import com.project.itda.domain.meeting.enums.MeetingTimeSlot;
import com.project.itda.domain.meeting.repository.MeetingRepository;
import com.project.itda.domain.participation.dto.response.ParticipantDto;
import com.project.itda.domain.participation.entity.Participation;
import com.project.itda.domain.participation.enums.ParticipationStatus;
import com.project.itda.domain.participation.repository.ParticipationRepository;
import com.project.itda.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 모임 서비스 (CRUD)
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final ParticipationRepository participationRepository;

    /**
     * 모임 생성
     */
    @Transactional
    public MeetingResponse createMeeting(User user, MeetingCreateRequest request) {
        log.info("📍 POST /api/meetings - userId: {}", user.getUserId());

        // 시간대 자동 설정
        MeetingTimeSlot timeSlot = MeetingTimeSlot.fromHour(request.getMeetingTime().getHour());

        // LocationType Enum 변환
        Meeting.LocationType locationType = Meeting.LocationType.valueOf(
                request.getLocationType().toString().toUpperCase()
        );

        Meeting meeting = Meeting.builder()
                .organizer(user)
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .subcategory(request.getSubcategory())
                .meetingTime(request.getMeetingTime())
                .timeSlot(timeSlot)
                .locationName(request.getLocationName())
                .locationAddress(request.getLocationAddress())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .locationType(locationType)
                .vibe(request.getVibe())
                .maxParticipants(request.getMaxParticipants())
                .currentParticipants(1)  // 주최자 포함
                .expectedCost(request.getExpectedCost() != null ? request.getExpectedCost() : 0)
                .status(MeetingStatus.RECRUITING)
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : true)
                .imageUrl(request.getImageUrl())
                .tags(request.getTags())
                .build();

        Meeting savedMeeting = meetingRepository.save(meeting);

        log.info("✅ 모임 생성 완료 - meetingId: {}", savedMeeting.getMeetingId());

        return toMeetingResponse(savedMeeting);
    }

    /**
     * 모임 상세 조회
     */
    @Transactional(readOnly = true)
    public MeetingDetailResponse getMeetingDetail(Long meetingId) {
        log.info("📍 GET /api/meetings/{}", meetingId);

        Meeting meeting = findById(meetingId);

        long dDay = ChronoUnit.DAYS.between(LocalDateTime.now(), meeting.getMeetingTime());

        return MeetingDetailResponse.builder()
                .meetingId(meeting.getMeetingId())
                .organizerId(meeting.getOrganizer().getUserId())
                .organizerUsername(meeting.getOrganizer().getUsername())
                .organizerEmail(meeting.getOrganizer().getEmail())
                .organizerProfileImage(meeting.getOrganizer().getProfileImageUrl())
                .title(meeting.getTitle())
                .description(meeting.getDescription())
                .category(meeting.getCategory())
                .subcategory(meeting.getSubcategory())
                .meetingTime(meeting.getMeetingTime())
                .timeSlot(meeting.getTimeSlot().name())
                .locationName(meeting.getLocationName())
                .locationAddress(meeting.getLocationAddress())
                .latitude(meeting.getLatitudeAsDouble())
                .longitude(meeting.getLongitudeAsDouble())
                .locationType(meeting.getLocationType().name())
                .vibe(meeting.getVibe())
                .currentParticipants(meeting.getCurrentParticipants())
                .maxParticipants(meeting.getMaxParticipants())
                .expectedCost(meeting.getExpectedCost())
                .imageUrl(meeting.getImageUrl())
                .status(meeting.getStatus().name())
                .createdAt(meeting.getCreatedAt())
                .isFull(meeting.isFull())
                .dDay(dDay)
                .build();
    }

    /**
     * 모임 수정
     */
    @Transactional
    public MeetingResponse updateMeeting(User user, Long meetingId, MeetingUpdateRequest request) {
        log.info("📍 PUT /api/meetings/{} - userId: {}", meetingId, user.getUserId());

        Meeting meeting = findById(meetingId);

        // 주최자 확인
        if (!meeting.isOrganizer(user.getUserId())) {
            throw new IllegalStateException("주최자만 모임을 수정할 수 있습니다");
        }

        // LocationType 변환
        Meeting.LocationType locationType = Meeting.LocationType.valueOf(
                request.getLocationType().toUpperCase()
        );

        meeting.update(
                request.getTitle(),
                request.getDescription(),
                request.getMeetingTime(),
                request.getLocationName(),
                request.getLocationAddress(),
                request.getLatitude(),
                request.getLongitude(),
                locationType,
                request.getVibe(),
                request.getMaxParticipants(),
                request.getExpectedCost(),
                request.getImageUrl(),
                request.getTags()
        );

        log.info("✅ 모임 수정 완료 - meetingId: {}", meetingId);

        return toMeetingResponse(meeting);
    }

    /**
     * 모임 삭제
     */
    @Transactional
    public void deleteMeeting(User user, Long meetingId) {
        log.info("📍 DELETE /api/meetings/{} - userId: {}", meetingId, user.getUserId());

        Meeting meeting = findById(meetingId);

        if (!meeting.isOrganizer(user.getUserId())) {
            throw new IllegalStateException("주최자만 모임을 삭제할 수 있습니다");
        }

        meeting.delete();

        log.info("✅ 모임 삭제 완료 - meetingId: {}", meetingId);
    }

    /**
     * 모임 단건 조회
     */
    @Transactional(readOnly = true)
    public Meeting findById(Long meetingId) {
        return meetingRepository.findById(meetingId)
                .orElseThrow(() -> new IllegalArgumentException("모임을 찾을 수 없습니다: " + meetingId));
    }

    /**
     * ID 리스트로 모임 조회
     */
    @Transactional(readOnly = true)
    public List<Meeting> findByIdIn(List<Long> meetingIds) {
        return meetingRepository.findAllById(meetingIds);
    }

    /**
     * 카테고리별 모임 조회
     */
    @Transactional(readOnly = true)
    public List<Meeting> findByCategoryAndStatusRecruiting(String category) {
        return meetingRepository.findByCategoryAndStatusRecruiting(category);
    }

    /**
     * Meeting → MeetingResponse 변환
     */
    private MeetingResponse toMeetingResponse(Meeting meeting) {
        long dDay = ChronoUnit.DAYS.between(LocalDateTime.now(), meeting.getMeetingTime());

        return MeetingResponse.builder()
                .meetingId(meeting.getMeetingId())
                .organizerId(meeting.getOrganizer().getUserId())
                .organizerUsername(meeting.getOrganizer().getUsername())
                .organizerProfileImage(meeting.getOrganizer().getProfileImageUrl())
                .title(meeting.getTitle())
                .description(meeting.getDescription())
                .category(meeting.getCategory())
                .subcategory(meeting.getSubcategory())
                .meetingTime(meeting.getMeetingTime())
                .timeSlot(meeting.getTimeSlot().name())
                .locationName(meeting.getLocationName())
                .locationAddress(meeting.getLocationAddress())
                .latitude(meeting.getLatitudeAsDouble())
                .longitude(meeting.getLongitudeAsDouble())
                .locationType(meeting.getLocationType().name())
                .vibe(meeting.getVibe())
                .currentParticipants(meeting.getCurrentParticipants())
                .maxParticipants(meeting.getMaxParticipants())
                .expectedCost(meeting.getExpectedCost())
                .imageUrl(meeting.getImageUrl())
                .status(meeting.getStatus().name())
                .createdAt(meeting.getCreatedAt())
                .updatedAt(meeting.getUpdatedAt())
                .isFull(meeting.isFull())
                .dDay(dDay)
                .build();
    }

    @Transactional(readOnly = true)
    public MeetingDetailResponse getMeetingById(Long meetingId) {
        log.info("🔍 모임 상세 조회 - meetingId: {}", meetingId);

        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new IllegalArgumentException("모임을 찾을 수 없습니다."));

        // 참여자 목록 조회 (APPROVED 상태만)
        List<Participation> participations = participationRepository
                .findByMeetingAndStatus(meeting, ParticipationStatus.APPROVED);

        log.info("👥 조회된 참여자 수: {}", participations.size());

        // 참여자 DTO 변환
        List<ParticipantDto> participants = participations.stream()
                .map(p -> ParticipantDto.builder()
                        .userId(p.getUser().getUserId())
                        .username(p.getUser().getUsername())
                        .profileImage(p.getUser().getProfileImageUrl())
                        .status(p.getStatus().name())
                        .joinedAt(p.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        log.info("📦 변환된 참여자 DTO 수: {}", participants.size());

        MeetingDetailResponse response = MeetingDetailResponse.builder()
                .meetingId(meeting.getMeetingId())
                .organizerId(meeting.getOrganizer().getUserId())
                .organizerUsername(meeting.getOrganizer().getUsername())
                .organizerProfileImage(meeting.getOrganizer().getProfileImageUrl())
                .organizerEmail(meeting.getOrganizer().getEmail())
                .title(meeting.getTitle())
                .description(meeting.getDescription())
                .category(meeting.getCategory())
                .subcategory(meeting.getSubcategory())
                .meetingTime(meeting.getMeetingTime())
                .timeSlot(meeting.getTimeSlot().name())
                .locationName(meeting.getLocationName())
                .locationAddress(meeting.getLocationAddress())
                .latitude(meeting.getLatitude())
                .longitude(meeting.getLongitude())
                .locationType(meeting.getLocationType().name())
                .vibe(meeting.getVibe())
                .currentParticipants(meeting.getCurrentParticipants())
                .maxParticipants(meeting.getMaxParticipants())
                .expectedCost(meeting.getExpectedCost())
                .imageUrl(meeting.getImageUrl())
                .status(meeting.getStatus().name())
                .avgRating(meeting.getAvgRating() != null ? meeting.getAvgRating() : 0.0)
                .reviewCount((long) (meeting.getReviewCount() != null ? meeting.getReviewCount() : 0))
                .createdAt(meeting.getCreatedAt())
                .isFull(meeting.getCurrentParticipants() >= meeting.getMaxParticipants())
                .dDay((long) calculateDDay(meeting.getMeetingTime()))
                .participants(participants)  // 이 부분이 중요!
                .build();

        log.info("✅ 응답 생성 완료 - participants 포함: {}", response.getParticipants() != null);

        return response;
    }

    private int calculateDDay(LocalDateTime meetingTime) {
        return (int) ChronoUnit.DAYS.between(LocalDate.now(), meetingTime.toLocalDate());
    }

}