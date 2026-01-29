# app/services/fallback/personalized_recommender.py (새 파일)
from typing import List

from fastapi import logger


class PersonalizedRecommender:
    """성향 기반 개인화 추천"""

    def __init__(self, model_loader):
        self.model_loader = model_loader

    async def recommend(
            self,
            user: dict,
            candidates: List[dict],
            top_k: int = 10
    ) -> dict:
        """
        1단계: 선호도 필터링 (70% 제거)
        2단계: Regressor 점수 계산
        3단계: 랜덤 선택
        """

        # 1단계: 선호도 필터링
        filtered = self._filter_by_preference(user, candidates)

        if len(filtered) < 5:
            # 필터링 결과가 너무 적으면 완화
            filtered = candidates

        # 2단계: Regressor 점수 계산
        scored = []
        for meeting_data in filtered:
            try:
                meeting = self._convert_to_meeting_dict(meeting_data)
                feat, x = self.model_loader.feature_builder.build(user, meeting)

                # Regressor 예측
                predicted_rating = self.model_loader.regressor.predict(x)[0]

                # ⭐ Bonus 강화
                bonus = self._calculate_bonus(user, meeting)

                final_rating = float(np.clip(predicted_rating + bonus, 1.0, 5.0))

                scored.append({
                    "meeting_id": meeting_data.meetingId,
                    "predicted_rating": round(final_rating, 2),
                    "bonus_score": round(bonus, 2),
                    "meeting_data": meeting_data
                })
            except Exception as e:
                logger.warning(f"⚠️ 점수 계산 실패: {e}")
                continue

        if not scored:
            return {"success": False, "message": "추천 불가"}

        # 3단계: Top-K 선택
        scored.sort(key=lambda x: x["predicted_rating"], reverse=True)
        top_list = scored[:top_k]

        # 랜덤 선택
        import random
        best = random.choice(top_list)

        return {
            "success": True,
            "recommendation": self._build_response(best),
            "predicted_rating": best["predicted_rating"],
            "bonus_score": best["bonus_score"],
            "top_candidates": [
                {"meetingId": x["meeting_id"], "rating": x["predicted_rating"]}
                for x in top_list
            ]
        }

    def _filter_by_preference(self, user: dict, candidates: List) -> List:
        """
        ⭐ 핵심: 선호도 기반 사전 필터링

        - 시간대 불일치: 제거
        - 장소 타입 불일치: 제거
        - 관심사 0개 매칭: 패널티
        """
        filtered = []

        user_time_pref = user.get("time_preference", "").upper()
        user_times = [t.strip() for t in user_time_pref.split(",") if t.strip()]

        user_loc_pref = user.get("user_location_pref", "").upper()

        # 관심사 파싱
        user_interests = user.get("interests", "")
        if isinstance(user_interests, str):
            try:
                import json
                interests_list = json.loads(user_interests)
            except:
                interests_list = [x.strip() for x in user_interests.split(",") if x.strip()]
        else:
            interests_list = user_interests or []

        for meeting in candidates:
            # ⭐ 1. 시간대 필터 (FLEXIBLE 아니면 엄격)
            meeting_time = meeting.timeSlot.upper() if hasattr(meeting, 'timeSlot') else ""

            if user_times and "FLEXIBLE" not in user_times:
                if meeting_time not in user_times:
                    continue  # ❌ 시간대 불일치 → 제외

            # ⭐ 2. 장소 타입 필터
            meeting_loc = meeting.locationType.upper() if hasattr(meeting, 'locationType') else ""

            if user_loc_pref and user_loc_pref != "BOTH":
                if meeting_loc != user_loc_pref:
                    continue  # ❌ 장소 타입 불일치 → 제외

            # ⭐ 3. 관심사 최소 1개 매칭 (선택)
            # (너무 엄격하면 결과가 없을 수 있으니 주석 처리 가능)
            # if interests_list:
            #     meeting_cat = (meeting.category or "").lower()
            #     meeting_sub = (meeting.subcategory or "").lower()
            #
            #     has_match = any(
            #         interest.lower() in meeting_cat or interest.lower() in meeting_sub
            #         for interest in interests_list
            #     )
            #
            #     if not has_match:
            #         continue  # ❌ 관심사 0개 → 제외

            filtered.append(meeting)

        logger.info(f"🔍 선호도 필터링: {len(candidates)} → {len(filtered)}")
        return filtered

    def calculate_personality_bonus(user: dict, meeting: dict) -> float:
        """
        성향 기반 보너스 점수 - 강화 버전

        기존: -0.5 ~ +0.5
        개선: -1.5 ~ +2.0 (영향력 4배 증가)
        """
        bonus = 0.0

        # 1. ⭐ 시간대 선호도 (가장 중요!)
        user_time_pref = user.get("time_preference", "").upper()
        meeting_time = meeting.get("time_slot", "").upper()

        if user_time_pref and meeting_time:
            # MORNING,FLEXIBLE 같은 케이스 처리
            user_times = [t.strip() for t in user_time_pref.split(",")]

            if meeting_time in user_times:
                bonus += 1.2  # ⭐ 기존 0.3 → 1.2 (4배)
            elif "FLEXIBLE" in user_times:
                bonus += 0.3  # flexible이면 약간만
            else:
                bonus -= 0.8  # ⭐ 기존 -0.2 → -0.8 (패널티 강화)

        # 2. ⭐ 장소 타입 선호도 (두 번째로 중요!)
        user_loc_pref = user.get("user_location_pref", "").upper()
        meeting_loc = meeting.get("meeting_location_type", "").upper()

        if user_loc_pref and meeting_loc:
            if user_loc_pref == meeting_loc:
                bonus += 1.0  # ⭐ 기존 0.3 → 1.0
            else:
                bonus -= 0.6  # ⭐ 기존 -0.2 → -0.6

        # 3. ⭐ 관심사 매칭 (키워드 기반)
        user_interests = user.get("interests", "")
        if isinstance(user_interests, str):
            try:
                import json
                interests_list = json.loads(user_interests)
            except:
                interests_list = [x.strip() for x in user_interests.split(",") if x.strip()]
        else:
            interests_list = user_interests or []

        if interests_list:
            meeting_cat = (meeting.get("category") or "").lower()
            meeting_sub = (meeting.get("subcategory") or "").lower()

            # 관심사가 category/subcategory에 포함되면 큰 보너스
            for interest in interests_list:
                interest_lower = interest.lower()
                if interest_lower in meeting_cat or interest_lower in meeting_sub:
                    bonus += 0.8  # ⭐ 기존 0.2 → 0.8
                    break  # 한 번만 카운트

        # 4. Energy Type (EXTROVERT vs INTROVERT)
        energy = user.get("energy_type", "").upper()
        vibe = (meeting.get("vibe") or "").lower()

        if energy == "EXTROVERT":
            if any(v in vibe for v in ["즐거운", "활기찬", "에너지"]):
                bonus += 0.5  # ⭐ 기존 0.2 → 0.5
        elif energy == "INTROVERT":
            if any(v in vibe for v in ["여유로운", "조용한", "힐링"]):
                bonus += 0.5  # ⭐ 기존 0.2 → 0.5

        # 5. Budget Type
        budget_type = user.get("budget_type", "").upper()
        cost = meeting.get("expected_cost", 0)

        if budget_type == "VALUE":  # 가성비
            if cost <= 15000:
                bonus += 0.4  # ⭐ 기존 0.1 → 0.4
            elif cost > 30000:
                bonus -= 0.4
        elif budget_type == "QUALITY":  # 품질
            if cost >= 20000:
                bonus += 0.4

        # 6. Leadership Type
        leadership = user.get("leadership_type", "").upper()
        participants = meeting.get("meeting_participant_count", 0)
        max_participants = meeting.get("max_participants", 10)

        if leadership == "LEADER":
            # 리더형은 소규모 선호
            if max_participants <= 8:
                bonus += 0.3
        elif leadership == "FOLLOWER":
            # 팔로워형은 중규모 선호
            if 6 <= max_participants <= 15:
                bonus += 0.3

        # 7. Frequency Type
        frequency = user.get("frequency_type", "").upper()
        # (이건 단발/정기 모임 구분이 필요한데 meeting에 없으면 스킵)

        # 최종 범위 제한
        bonus = max(-1.5, min(2.0, bonus))

        return bonus