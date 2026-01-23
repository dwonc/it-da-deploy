package com.project.itda.domain.ai.service;

import com.project.itda.domain.ai.dto.request.PersonalizedRecommendRequest;
import com.project.itda.domain.ai.dto.response.PersonalizedRecommendResponse;
import com.project.itda.domain.meeting.entity.Meeting;
import com.project.itda.domain.meeting.repository.MeetingRepository;
import com.project.itda.domain.user.entity.User;
import com.project.itda.domain.user.entity.UserPreference;
import com.project.itda.domain.user.repository.UserPreferenceRepository;
import com.project.itda.domain.user.repository.UserRepository;
import com.project.itda.domain.review.repository.ReviewRepository;
import com.project.itda.domain.participation.repository.ParticipationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PersonalizedRecommendService {

    private final AIServiceClient aiServiceClient;
    private final UserRepository userRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final MeetingRepository meetingRepository;
    private final ReviewRepository reviewRepository;
    private final ParticipationRepository participationRepository;

    public Meeting getPersonalizedRecommendation(Long userId) {
        log.info("🎯 개인화 AI 추천 시작: userId={}", userId);

        try {
            // 1. 사용자 정보 조회
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));

            UserPreference userPref = userPreferenceRepository.findByUserId(userId)
                    .orElse(null);

            // 2. 사용자 통계 계산
            Double userAvgRating = Optional.ofNullable(reviewRepository.getAvgRatingByUserId(userId))
                    .orElse(3.5);

            Long userMeetingCount = Optional.ofNullable(
                    participationRepository.countByUserIdAndStatus(
                            userId,
                            com.project.itda.domain.participation.enums.ParticipationStatus.COMPLETED
                    )
            ).orElse(0L);

            Double userRatingStd = Optional.ofNullable(reviewRepository.getRatingStdByUserId(userId))
                    .orElse(0.5);

            // ⭐ 3. 선호도 기반 후보 필터링
            List<Meeting> candidateMeetings = getCandidateMeetings(user, userPref);

            if (candidateMeetings.isEmpty()) {
                log.warn("⚠️ 추천 가능한 모임 없음");
                return null;
            }

            // 4. FastAPI 요청 생성
            PersonalizedRecommendRequest request = PersonalizedRecommendRequest.builder()
                    .userId(userId)
                    .userLat(user.getLatitude() != null ? user.getLatitude() : 37.5665)
                    .userLng(user.getLongitude() != null ? user.getLongitude() : 126.9780)
                    .userInterests(userPref != null && userPref.getInterests() != null
                            ? userPref.getInterests()
                            : "[]")
                    .userTimePreference(userPref != null && userPref.getTimePreference() != null
                            ? userPref.getTimePreference()
                            : "AFTERNOON")
                    .userLocationPref(userPref != null && userPref.getLocationType() != null
                            ? userPref.getLocationType().name()
                            : "INDOOR")
                    .userBudgetType(userPref != null && userPref.getBudgetType() != null
                            ? userPref.getBudgetType().name()
                            : "VALUE")
                    .userEnergyType(userPref != null && userPref.getEnergyType() != null
                            ? userPref.getEnergyType().name()
                            : "EXTROVERT")
                    .userLeadershipType(userPref != null && userPref.getLeadershipType() != null
                            ? userPref.getLeadershipType().name()
                            : "FOLLOWER")
                    .userFrequencyType(userPref != null && userPref.getFrequencyType() != null
                            ? userPref.getFrequencyType().name()
                            : "REGULAR")
                    .userPurposeType(userPref != null && userPref.getPurposeType() != null
                            ? userPref.getPurposeType().name()
                            : "TASK")
                    .userAvgRating(userAvgRating)
                    .userMeetingCount(userMeetingCount.intValue())
                    .userRatingStd(userRatingStd)
                    .candidateMeetings(candidateMeetings.stream()
                            .map(this::convertToDto)
                            .collect(Collectors.toList()))
                    .build();

            // 5. FastAPI 호출
            PersonalizedRecommendResponse aiResponse;
            try {
                aiResponse = aiServiceClient.post(
                        "/api/ai/recommendations/personalized-recommendation",
                        request,
                        PersonalizedRecommendResponse.class
                );
            } catch (Exception fastApiError) {
                log.warn("⚠️ FastAPI 호출 실패, fallback 사용: {}", fastApiError.getMessage());
                return candidateMeetings.get(0);
            }

            // 6. 응답 검증
            if (aiResponse == null || !Boolean.TRUE.equals(aiResponse.getSuccess())
                    || aiResponse.getRecommendation() == null) {
                log.warn("⚠️ AI 추천 실패 - 랜덤 추천");
                return candidateMeetings.get(0);
            }

            // 7. 추천된 모임 반환
            Long recommendedMeetingId = aiResponse.getMeetingId();

            if (recommendedMeetingId == null) {
                log.warn("⚠️ 추천 모임 ID 없음 - 랜덤 추천");
                return candidateMeetings.get(0);
            }

            Meeting recommended = meetingRepository.findById(recommendedMeetingId)
                    .orElse(candidateMeetings.get(0));

            log.info("✅ 개인화 추천 완료: meetingId={}, rating={}",
                    recommendedMeetingId, aiResponse.getPredictedRating());

            return recommended;

        } catch (Exception e) {
            log.error("❌ 개인화 추천 실패: {}", e.getMessage(), e);
            return meetingRepository.findTopByOrderByCreatedAtDesc()
                    .orElse(null);
        }
    }

    /**
     * ⭐ 선호도 기반 후보 필터링 (수정 버전)
     */
    private List<Meeting> getCandidateMeetings(User user, UserPreference userPref) {
        // 1) 전체 모임 조회 (100개)
        List<Meeting> allMeetings = meetingRepository.findTop100ByOrderByCreatedAtDesc();

        if (userPref == null) {
            log.info("🔍 선호도 없음 → 전체 50개 반환");
            return allMeetings.subList(0, Math.min(50, allMeetings.size()));
        }

        // 2) 선호도 필터링
        List<Meeting> filtered = allMeetings.stream()
                .filter(meeting -> {

                    // ⭐ 시간대 필터 (수정!)
                    if (userPref.getTimePreference() != null
                            && !userPref.getTimePreference().isEmpty()) {

                        String timePreference = userPref.getTimePreference().toUpperCase();

                        // "FLEXIBLE" 포함 시 시간대 제약 없음
                        if (!timePreference.contains("FLEXIBLE")) {
                            // "MORNING,EVENING" 같은 케이스 파싱
                            Set<String> preferredTimes = new HashSet<>(
                                    Arrays.asList(timePreference.split(","))
                            );

                            String meetingTimeSlot = meeting.getTimeSlot().name();

                            // 모임 시간대가 선호 시간대에 없으면 제외
                            if (!preferredTimes.contains(meetingTimeSlot)) {
                                return false; // ❌ 시간대 불일치
                            }
                        }
                    }

                    // ⭐ 장소 타입 필터 (수정!)
                    if (userPref.getLocationType() != null) {
                        String userLocPref = userPref.getLocationType().name();
                        String meetingLoc = meeting.getLocationType().name();

                        // "BOTH"가 아닌 경우만 필터링
                        if (!"BOTH".equals(userLocPref) && !userLocPref.equals(meetingLoc)) {
                            return false; // ❌ 장소 타입 불일치
                        }
                    }

                    // ⭐ 관심사 필터 (최소 1개 매칭)
                    if (userPref.getInterests() != null && !userPref.getInterests().isEmpty()) {
                        String interests = userPref.getInterests().toLowerCase();
                        String category = meeting.getCategory().toLowerCase();
                        String subcategory = (meeting.getSubcategory() != null)
                                ? meeting.getSubcategory().toLowerCase() : "";

                        // 관심사에 category나 subcategory가 포함되어야 함
                        boolean hasMatch = interests.contains(category)
                                || interests.contains(subcategory)
                                || category.contains(interests.split(",")[0].trim())  // ⭐ 역방향도 체크
                                || (!subcategory.isEmpty() && subcategory.contains(interests.split(",")[0].trim()));

                        if (!hasMatch) {
                            return false; // ❌ 관심사 0개
                        }
                    }

                    return true; // ✅ 통과
                })
                .limit(50)
                .collect(Collectors.toList());

        log.info("🔍 선호도 필터링: {} → {} (시간={}, 장소={}, 관심사={})",
                allMeetings.size(), filtered.size(),
                userPref.getTimePreference(), userPref.getLocationType(), userPref.getInterests());

        // 3) 필터링 결과가 너무 적으면 완화
        if (filtered.size() < 10) {
            log.warn("⚠️ 필터링 결과 부족 ({}) → 전체 사용", filtered.size());
            return allMeetings.subList(0, Math.min(50, allMeetings.size()));
        }

        return filtered;
    }

    /**
     * Meeting → CandidateMeetingDto 변환
     */
    private PersonalizedRecommendRequest.CandidateMeetingDto convertToDto(Meeting meeting) {
        return PersonalizedRecommendRequest.CandidateMeetingDto.builder()
                .meetingId(meeting.getMeetingId())
                .latitude(meeting.getLatitude())
                .longitude(meeting.getLongitude())
                .category(meeting.getCategory())
                .subcategory(meeting.getSubcategory())
                .timeSlot(meeting.getTimeSlot().name())
                .locationType(meeting.getLocationType().name())
                .vibe(meeting.getVibe())
                .maxParticipants(meeting.getMaxParticipants())
                .expectedCost(meeting.getExpectedCost())
                .avgRating(meeting.getAvgRating())
                .ratingCount(meeting.getRatingCount())
                .currentParticipants(meeting.getCurrentParticipants())
                .build();
    }
}