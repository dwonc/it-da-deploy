"""
AI Recommendation Integration Service
GPT 파싱 → DB 검색 → AI 모델 추천 통합
"""

import httpx
import math
import uuid
from collections import Counter
from typing import List, Dict, Optional

import numpy as np

from app.core.scoring_utils import match_from_percentile
from app.services.gpt_prompt_service import GPTPromptService
from app.models.model_loader import model_loader
from app.core.logging import logger


class AIRecommendationService:
    """AI 추천 통합 서비스"""

    def __init__(
        self,
        gpt_service: GPTPromptService,
        spring_boot_url: str = "http://localhost:8080"
    ):
        self.gpt_service = gpt_service
        self.spring_boot_url = spring_boot_url

    # -------------------------
    # Normalizers (Spring Enum/DB 값 호환)
    # -------------------------
    def _normalize_timeslot(self, ts: Optional[str]) -> Optional[str]:
        """Spring Enum: MORNING/AFTERNOON/EVENING/NIGHT"""
        if not ts:
            return None

        raw = str(ts).strip()

        # ✅ "MORNING,FLEXIBLE" 같은 값 들어오면 첫 토큰만 사용
        if "," in raw:
            raw = raw.split(",")[0].strip()

        lower = raw.lower()
        mapping = {
            "morning": "MORNING",
            "afternoon": "AFTERNOON",
            "evening": "EVENING",
            "night": "NIGHT",
            "오전": "MORNING",
            "아침": "MORNING",
            "점심": "AFTERNOON",
            "오후": "AFTERNOON",
            "저녁": "EVENING",
            "밤": "NIGHT",
            "야간": "NIGHT",
        }
        return mapping.get(lower, raw.upper())

    def _normalize_location_type(self, lt: Optional[str]) -> Optional[str]:
        """Spring Enum: INDOOR/OUTDOOR"""
        if not lt:
            return None
        raw = str(lt).strip()
        lower = raw.lower()
        mapping = {
            "indoor": "INDOOR",
            "outdoor": "OUTDOOR",
            "실내": "INDOOR",
            "실외": "OUTDOOR",
            "야외": "OUTDOOR",
        }
        return mapping.get(lower, raw.upper())

    def _normalize_budget_for_model(self, bt: Optional[str]) -> str:
        """모델 입력은 소문자로 통일 (value/quality)"""
        if not bt:
            return "value"
        raw = str(bt).strip()
        mapping = {
            "VALUE": "value", "value": "value", "가성비": "value", "합리": "value",
            "QUALITY": "quality", "quality": "quality", "품질": "quality",
        }
        return mapping.get(raw, mapping.get(raw.upper(), mapping.get(raw.lower(), "value")))

    # -------------------------
    # Intent (문장 의도)
    # -------------------------
    def _detect_intent(self, user_prompt: str, parsed_query: dict) -> str:
        t = (user_prompt or "").lower()

        quiet_words = ["조용", "쉬", "힐링", "편하게", "여유", "카페", "대화", "산책", "전시", "독서", "쉬고"]
        active_words = ["러닝", "운동", "뛰", "배드민턴", "축구", "헬스", "등산", "클라이밍"]

        if any(w in t for w in quiet_words):
            return "QUIET"
        if any(w in t for w in active_words):
            return "ACTIVE"

        vibe = parsed_query.get("vibe")
        if vibe in ["힐링", "여유로운"]:
            return "QUIET"
        return "NEUTRAL"

    def _apply_intent_adjustment(self, intent: str, meeting: dict) -> float:
        """
        match_score에 더해지는 보정값.
        너희 카테고리 체계에 맞춰 튜닝하면 됨.
        """
        cat = (meeting.get("category") or "")
        sub = (meeting.get("subcategory") or "")

        if intent == "QUIET":
            # 스포츠는 강하게 패널티
            if cat == "스포츠":
                return -25.0
            # 조용할만한 것들 보너스(너희 데이터에 맞춰 수정)
            if cat in ["카페", "문화", "취미"] or sub in ["독서", "보드게임", "전시", "스터디"]:
                return +15.0

        if intent == "ACTIVE":
            if cat == "스포츠":
                return +15.0
            if cat in ["카페", "문화"]:
                return -10.0

        return 0.0

    # -------------------------
    # Search payload builder (중요)
    # -------------------------
    def _should_apply_time_slot(self, q: dict) -> bool:
        # time_slot은 추측이 섞이므로 confidence 높을 때만 필터로 사용
        return q.get("time_slot") is not None and q.get("confidence", 0) >= 0.9

    def _should_apply_vibe(self, q: dict) -> bool:
        return q.get("vibe") is not None and q.get("confidence", 0) >= 0.9

    def _infer_location_type(self, q: dict) -> Optional[str]:
        kws = q.get("keywords") or []
        text = " ".join(kws)
        if "실내" in text:
            return "INDOOR"
        if "야외" in text or "실외" in text:
            return "OUTDOOR"
        return None

    def _to_spring_search_request(self, enriched_query: dict, user_ctx: dict) -> dict:
        raw_keywords = enriched_query.get("keywords") or []
        keywords = self._clean_keywords(raw_keywords)

        keyword = enriched_query.get("keyword")
        if not keyword and keywords:
            keyword = " ".join(keywords)

        # ✅ 유저 좌표
        lat = user_ctx.get("lat") or user_ctx.get("latitude")
        lng = user_ctx.get("lng") or user_ctx.get("longitude")

        # ✅ locationQuery
        location_query = enriched_query.get("locationQuery") or enriched_query.get("location_query")

        # ✅ "근처/주변/집" 의도
        near_me = self._is_near_me_phrase(location_query)

        # ✅ timeSlot: "유저 선호" 절대 섞이지 않게!
        # - enriched_query에 timeSlot이 들어가도 무시(=enrich 단계에서 섞였을 수 있음)
        conf = float(enriched_query.get("confidence", 0) or 0)
        gpt_ts = enriched_query.get("time_slot")  # 오직 snake만 본다 (중요)
        time_slot = self._normalize_timeslot(gpt_ts) if (gpt_ts and conf >= 0.9) else None

        payload = {
            "category": enriched_query.get("category"),
            "subcategory": enriched_query.get("subcategory"),

            # ✅ GPT time_slot만, conf 높을 때만
            "timeSlot": time_slot,

            "vibe": enriched_query.get("vibe"),
            "keywords": keywords,

            # ✅ userLocation은 항상 보내도 됨 (거리 계산용)
            "userLocation": {
                "latitude": lat,
                "longitude": lng
            },

            "locationQuery": location_query,
            "maxCost": enriched_query.get("maxCost") or enriched_query.get("max_cost"),
        }

        # ✅ radius는 “근처 의도일 때만” 포함
        if near_me:
            payload["radius"] = float(enriched_query.get("radius") or 10.0)

        # 로그
        logger.info(
            f"[PAYLOAD] near_me={near_me} userLocation={payload.get('userLocation')} "
            f"radius={payload.get('radius', None)} timeSlot={payload.get('timeSlot')}"
        )
        logger.info(f"[PAYLOAD_KEYWORDS] raw={raw_keywords} -> cleaned={keywords}")

        # null/""/[] 제거
        def clean(o):
            if isinstance(o, dict):
                return {k: clean(v) for k, v in o.items() if v is not None and v != "" and v != []}
            return o

        return clean(payload)

    # -------------------------
    # Step 4: candidate search + relaxation
    # -------------------------
    async def _search_meetings(self, enriched_query: dict, user_context: dict) -> list[dict]:
        try:
            payload = self._to_spring_search_request(enriched_query, user_context)
            logger.info(f"[PAYLOAD_FULL] {payload}")

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.spring_boot_url}/api/meetings/search",
                    json=payload
                )

            if response.status_code == 200:
                result = response.json()
                return result.get("meetings", [])
            else:
                logger.warning(f"⚠️ 모임 검색 실패: {response.status_code} body={response.text}")
                return []
        except Exception as e:
            logger.error(f"⚠️ 모임 검색 API 호출 실패: {e}")
            return []

    from collections import Counter

    async def _search_with_relaxation(self, base_query: dict, user_context: dict, trace_steps: list) -> list[dict]:
        """
        - confidence 기반 초기 필터 강도 조절
        - relax 우선순위: locationQuery -> vibe -> timeSlot -> keywords -> subcategory -> (마지막) category
        - category 가드: category가 있었는데 결과가 전부 다른 category면 locationQuery 제거 후 category 고정 재시도
        - trace_steps 유지
        """

        conf = float(base_query.get("confidence", 0) or 0)

        def drop_keys(q: dict, *keys):
            qq = dict(q)
            for k in keys:
                qq.pop(k, None)
            return qq

        def norm(q: dict):
            # 키 이름 흔들림 방지 (너 코드에 time_slot/timeSlot 섞여있어서)
            qq = dict(q)
            if "time_slot" in qq and "timeSlot" not in qq:
                qq["timeSlot"] = qq.pop("time_slot")
            return qq

        async def _try(label: str, q: dict, level: int):
            q = norm(q)
            meetings = await self._search_meetings(q, user_context)
            meetings = meetings or []
            trace_steps.append({
                "level": level,
                "label": label,
                "payload": self._to_spring_search_request(q, user_context),
                "count": len(meetings),
                # 디버깅용(원하면 지워도 됨)
                "cats": dict(Counter((m.get("category"), m.get("subcategory")) for m in meetings)) if meetings else {},
            })
            return meetings

        base_cat = (base_query.get("category") or "").strip() or None

        # -----------------------
        # 1) conf 기반 시작 쿼리 정규화
        # -----------------------
        q0 = dict(base_query)

        # conf 낮으면 "세부"만 미리 뺌 (category/location은 건드리지 마!)
        if conf < 0.70:
            q0 = drop_keys(q0, "subcategory")
        if conf < 0.85:
            q0 = drop_keys(q0, "vibe", "time_slot", "timeSlot")

        # ✅ L0
        cands = await _try("L0(conf 반영)", q0, 0)
        if cands:
            # category 가드: 원하는 category가 있었는데 결과가 전부 다른 category면 재시도
            if base_cat and all((m.get("category") or "").strip() != base_cat for m in cands):
                q_fix = drop_keys(q0, "location_query", "locationQuery")  # 지역 버리고 category 유지
                c2 = await _try("L0-guard(location 제거, category 유지)", q_fix, 1)
                if c2:
                    return c2
            return cands

        # -----------------------
        # 2) relax plan (요청 수 컨트롤)
        # -----------------------
        # 핵심: category는 맨 마지막
        # locationQuery(지역) -> vibe -> timeSlot -> keywords -> subcategory -> category
        if conf >= 0.90:
            plans = [
                ("L1 locationQuery 제거", ("location_query", "locationQuery")),
                ("L2 vibe 제거", ("vibe",)),
                ("L3 timeSlot 제거", ("time_slot", "timeSlot")),
                ("L4 keywords 제거", ("keywords",)),
                ("L5 subcategory 제거", ("subcategory",)),
                ("L6 category 제거", ("category",)),
            ]
        elif conf >= 0.75:
            plans = [
                ("L1 locationQuery 제거", ("location_query", "locationQuery")),
                ("L2 timeSlot 제거", ("time_slot", "timeSlot")),
                ("L3 subcategory 제거", ("subcategory",)),
                ("L4 keywords 제거", ("keywords",)),
                ("L5 category 제거", ("category",)),
            ]
        else:
            # 낮은 conf: 이미 넓게 시작했으니 2~3번만
            plans = [
                ("L1 locationQuery 제거", ("location_query", "locationQuery")),
                ("L2 keywords 제거", ("keywords",)),
                ("L3 category 제거", ("category",)),
            ]

        # -----------------------
        # 3) relax 순차 수행 + category 가드
        # -----------------------
        current = dict(q0)
        level = 1
        for label, keys in plans:
            qn = drop_keys(current, *keys)
            cands = await _try(label, qn, level)

            if cands:
                # category 가드: base_cat이 있는데 결과가 전부 다른 카테고리면 "지역 제거 + category 유지" 한번 더
                if base_cat and all((m.get("category") or "").strip() != base_cat for m in cands):
                    q_fix = drop_keys(qn, "location_query", "locationQuery")  # 지역 버리고 category 유지
                    c2 = await _try(f"{label}-guard(location 제거, category 유지)", q_fix, level + 1)
                    if c2:
                        return c2
                return cands

            current = qn
            level += 1

        return []

    # -------------------------
    # Main pipeline
    # -------------------------
    async def get_ai_recommendations(self, user_prompt: str, user_id: int, top_n: int = 5) -> Dict:
        rid = str(uuid.uuid4())[:8]
        logger.info(f"[RID={rid}] 🔍 AI 검색 요청: user_id={user_id}, prompt='{user_prompt}'")

        try:
            # Step 1
            logger.info(f"[Step 1] GPT 프롬프트 파싱: {user_prompt}")
            parsed_query = await self.gpt_service.parse_search_query(user_prompt)

            # Step 2
            logger.info(f"[Step 2] 사용자 컨텍스트 조회: user_id={user_id}")
            user_context = await self._get_user_context(user_id)
            logger.info(f"[CTX] lat={user_context.get('latitude')} lng={user_context.get('longitude')}")

            kw = parsed_query.get("keywords") or []
            conf = float(parsed_query.get("confidence", 0) or 0)
            cat = parsed_query.get("category")
            sub = parsed_query.get("subcategory")
            vibe = parsed_query.get("vibe")
            ts = parsed_query.get("time_slot")

            # ✅ 정보 거의 없는 입력(예: "집에서", "그냥", "추천") 방지
            if conf < 0.6 and len(kw) == 0 and not cat and not sub and not vibe and not ts:
                card = self._make_clarification_card(user_prompt, parsed_query, user_context)
                return {
                    "user_prompt": user_prompt,
                    "parsed_query": parsed_query,
                    "total_candidates": 0,
                    "recommendations": [card],
                    "search_trace": {
                        "steps": [],
                        "final_level": 0,
                        "final_label": "EARLY_CLARIFY",
                        "fallback": False
                    }
                }

            # Step 3
            enriched_query = await self.gpt_service.enrich_with_user_context(parsed_query, user_context)

            # Step 4
            trace_steps: list = []

            # ✅ L0를 미리 완화해서 시도 횟수를 줄임
            base_query = self._pre_relax_query_by_conf(enriched_query)

            candidate_meetings = await self._search_with_relaxation(base_query, user_context, trace_steps)

            if not candidate_meetings:
                logger.warning("⚠️ 검색 결과 없음 - SVD 기반 추천으로 대체")
                data = await self._fallback_svd_recommendation(user_id, user_prompt, parsed_query, top_n, user_context)


                # fallback도 intent 보정
                intent = self._detect_intent(user_prompt, parsed_query)

                for rec in data.get("recommendations", []):
                    rec["match_score"] = int(max(0, min(100, rec.get("match_score", 0) + self._apply_intent_adjustment(intent, rec))))
                    rec["intent"] = intent

                data["search_trace"] = {
                    "steps": trace_steps,
                    "final_level": trace_steps[-1]["level"] if trace_steps else 0,
                    "final_label": trace_steps[-1]["label"] if trace_steps else "L0 원본",
                    "fallback": True
                }
                return data


            logger.info(f"[Step 5] AI 점수 계산: {len(candidate_meetings)}개 모임")

            intent = self._detect_intent(user_prompt, parsed_query)  # ✅ 먼저 만들고

            scored_meetings = await self._score_meetings(
                user_id, user_context, candidate_meetings, parsed_query, intent
            )

            # ✅ intent 보정(룰 기반)
            for m in scored_meetings:
                m["match_score"] = int(max(0, min(100, m["match_score"] + self._apply_intent_adjustment(intent, m))))
                m["intent"] = intent



            # Step 6
            top_recommendations = sorted(scored_meetings, key=lambda x: x["match_score"], reverse=True)[:top_n]

            # Step 7
            for rec in top_recommendations:
                if (not parsed_query.get("keywords")) or parsed_query.get("confidence", 0) < 0.6:
                    rec["reasoning"] = self._fallback_reasoning(rec, parsed_query)
                else:
                    rec["reasoning"] = await self._generate_reasoning(user_context, rec, parsed_query)

            return {
                "user_prompt": user_prompt,
                "parsed_query": parsed_query,
                "total_candidates": len(candidate_meetings),
                "recommendations": top_recommendations,
                "search_trace": {
                    "steps": trace_steps,
                    "final_level": trace_steps[-1]["level"] if trace_steps else 0,
                    "final_label": trace_steps[-1]["label"] if trace_steps else "L0 원본",
                    "fallback": False
                }
            }

        except Exception as e:
            logger.error(f"❌ AI 추천 실패: {e}")
            raise

    # -------------------------
    # Scoring (너 코드 거의 그대로)
    # -------------------------
    # AIRecommendationService 안에 있는 _score_meetings()를 이 버전으로 교체하면 됨.
    # - /search 랭킹: ranker로 match_score 만들고 정렬
    # - UI용 predicted_rating: (선택) regressor로 같이 넣어줌
    # - 기존 key_points 유지

    async def _score_meetings(
            self,
            user_id: int,
            user_context: dict,
            candidate_meetings: list[dict],
            parsed_query: dict,
            intent: str,
    ) -> list[dict]:
        def pick(d: dict, *keys, default=None):
            for k in keys:
                if k in d and d.get(k) is not None:
                    return d.get(k)
            return default

        if not model_loader.ranker or not model_loader.ranker.is_loaded():
            raise RuntimeError("LightGBM Ranker 모델이 로드되지 않았습니다.")
        if not model_loader.feature_builder:
            raise RuntimeError("FeatureBuilder가 로드되지 않았습니다.")

        use_regressor_for_rating = bool(model_loader.regressor and model_loader.regressor.is_loaded())

        # ✅ confidence (0~1)
        conf = float(parsed_query.get("confidence", 0) or 0)

        def dynamic_ceil(n: int, conf: float) -> int:
            # 후보 수가 적을수록 상한이 낮아야 "그럴듯"
            if n <= 2:
                base = 78
            elif n == 3:
                base = 82
            elif n <= 5:
                base = 86
            elif n <= 10:
                base = 90
            else:
                base = 92

            # confidence 낮을수록 상한 깎기 (최대 12점 정도)
            penalty = int(round((1.0 - max(0.0, min(1.0, conf))) * 12))
            return max(70, base - penalty)

        user = {
            "lat": pick(user_context, "lat", "latitude", default=None),
            "lng": pick(user_context, "lng", "longitude", default=None),
            "interests": pick(user_context, "interests", default=""),
            "time_preference": self._normalize_timeslot(
                pick(user_context, "time_preference", "timePreference", default=None)
            ),
            "user_location_pref": pick(user_context, "user_location_pref", "userLocationPref", default=None),
            "budget_type": self._normalize_budget_for_model(
                pick(user_context, "budget_type", "budgetType", default="value")
            ),
            "user_avg_rating": float(pick(user_context, "user_avg_rating", "userAvgRating", default=3.0)),
            "user_meeting_count": int(pick(user_context, "user_meeting_count", "userMeetingCount", default=0)),
            "user_rating_std": float(pick(user_context, "user_rating_std", "userRatingStd", default=0.5)),
        }

        rows, feats, valid_candidates = [], [], []
        for raw in candidate_meetings:
            try:
                m = self._normalize_meeting(raw)
                feat, x = model_loader.feature_builder.build(user, m)
                rows.append(x[0])
                feats.append(feat)
                valid_candidates.append(m)
            except Exception as e:
                logger.warning(f"⚠️ feature build 실패 meeting_id={raw.get('meeting_id')}: {e}")
                continue

        if not rows:
            return []

        X = np.vstack(rows)

        # 1) ranker raw
        rank_raw = model_loader.ranker.predict(X)
        raw_list = [float(v) for v in rank_raw]
        n = len(raw_list)

        # ✅ 동적 상한
        ceil = dynamic_ceil(n, conf)

        # 2) optional rating
        rating_list = None
        if use_regressor_for_rating:
            try:
                preds = model_loader.regressor.predict(X)
                rating_list = [float(v) for v in preds]
            except Exception as e:
                logger.warning(f"⚠️ regressor rating 예측 실패. rating 없이 진행: {e}")
                rating_list = None

        # 3) match_score 계산
        match_scores = [55] * n

        if n <= 10:
            # ✅ 소수 후보는 "등수 + raw 간격" 기반 (100% 방지)
            base = [90, 84, 79, 74, 69, 65, 62, 60, 58, 56]
            order = sorted(range(n), key=lambda i: raw_list[i], reverse=True)

            top = raw_list[order[0]]
            bottom = raw_list[order[-1]]
            span = (top - bottom) if (top - bottom) != 0 else 1.0

            for rank, i in enumerate(order):
                b = base[rank] if rank < len(base) else 55

                # top=1, bottom=0
                t = (raw_list[i] - bottom) / span

                # -3 ~ +3 정도만 흔들어주기
                adj = (t - 0.5) * 6.0

                ms = b + adj

                # 바닥/상한 기본 캡
                ms = max(52, min(92, ms))

                # ✅ confidence+n 기반 동적 상한 적용
                ms = min(ms, ceil)

                match_scores[i] = int(round(ms))

        else:
            # 후보 많으면 percentile 기반
            sorted_vals = sorted(raw_list)

            def percentile_midrank(x: float) -> float:
                lt = 0
                eq = 0
                for v in sorted_vals:
                    if v < x:
                        lt += 1
                    elif v == x:
                        eq += 1
                p = (lt + 0.5 * eq) / n
                eps = 0.5 / n
                if p < eps:
                    p = eps
                if p > 1 - eps:
                    p = 1 - eps
                return p

            for i, s in enumerate(raw_list):
                p = percentile_midrank(float(s))  # 0~1
                p = max(0.0, min(1.0, 0.5 + (p - 0.5) * 2.0))  # stretch 약하게

                ms = match_from_percentile(p, floor=52, ceil=92, gamma=1.5)
                ms = min(ms, ceil)  # ✅ 동적 상한
                match_scores[i] = int(ms)

        # 4) 결과 구성
        results = []
        for idx, (m, feat, s) in enumerate(zip(valid_candidates, feats, raw_list)):
            ms = int(match_scores[idx])

            if ms >= 88:
                lvl = "VERY_HIGH"
            elif ms >= 80:
                lvl = "HIGH"
            elif ms >= 65:
                lvl = "MEDIUM"
            else:
                lvl = "LOW"

            item = {
                **m,
                "rank_raw": round(float(s), 4),
                "match_score": ms,
                "match_level": lvl,
                "key_points": self._build_key_points_from_feat(feat),
                "score_meta": {
                    "n_candidates": n,
                    "confidence": round(conf, 3),
                    "ceil": int(ceil),
                }
            }

            if rating_list is not None:
                item["predicted_rating"] = round(float(rating_list[idx]), 3)

            results.append(item)

        results.sort(key=lambda x: x.get("match_score", 0), reverse=True)
        return results

    def _build_key_points_from_feat(self, feat: dict) -> list[str]:
        points = []
        if feat.get("distance_km", 999) <= 3:
            points.append(f"가까운 거리({feat['distance_km']:.1f}km)")
        if feat.get("time_match") == 1.0:
            points.append("선호 시간대 일치")
        if feat.get("location_type_match") == 1.0:
            points.append("실내/야외 선호 일치")
        if feat.get("cost_match_score", 0) >= 0.7:
            points.append("예산에 잘 맞음")
        if feat.get("interest_match_score", 0) >= 0.5:
            points.append("관심사 매칭")
        return points[:3]

    # -------------------------
    # User context / Reasoning / Fallback / Batch
    # -------------------------
    async def _get_user_context(self, user_id: int) -> Dict:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.spring_boot_url}/api/users/{user_id}/context")
                response.raise_for_status()
                ctx = response.json()
                logger.info(f"✅ 사용자 컨텍스트 조회 성공: userId={user_id}")
                return ctx
        except Exception as e:
            logger.error(f"❌ 사용자 컨텍스트 조회 실패: {e}")
            return {
                "user_id": user_id,
                "latitude": 37.5665,
                "longitude": 126.9780,
                "interests": "",
                "time_preference": "",
                "budget_type": "VALUE",
                "user_avg_rating": 0.0,
                "user_meeting_count": 0,
                "user_rating_std": 0.0
            }

    async def _generate_reasoning(self, user_context: Dict, meeting: Dict, parsed_query: Dict) -> str:
        """
        GPT를 활용한 동적이고 공감 가능한 추천 이유 생성
        """
        try:
            # ✅ None 체크를 포함한 안전한 값 추출
            user_prompt_keywords = " ".join(parsed_query.get("keywords", []))
            category = meeting.get("category") or ""
            subcategory = meeting.get("subcategory") or ""
            location = meeting.get("location_name") or "미정"
            distance = meeting.get("distance_km") if meeting.get("distance_km") is not None else 0
            cost = meeting.get("expected_cost") if meeting.get("expected_cost") is not None else 0
            participants = meeting.get("current_participants") if meeting.get("current_participants") is not None else 0
            max_participants = meeting.get("max_participants") if meeting.get("max_participants") is not None else 10
            vibe = meeting.get("vibe") or ""

            # ✅ GPT 프롬프트
            prompt = f"""
    당신은 친근하고 공감 능력이 뛰어난 AI 추천 어시스턴트입니다.
    사용자의 상황과 감정을 이해하고, 왜 이 모임이 딱 맞는지 자연스럽게 설명하세요.

    **사용자 키워드:** {user_prompt_keywords}

    **추천 모임:**
    - 제목: {meeting.get('title', '제목 없음')}
    - 카테고리: {category} - {subcategory}
    - 분위기: {vibe}
    - 위치: {location} ({distance:.1f}km)
    - 비용: {cost:,}원
    - 참가자: {participants}/{max_participants}명

    **작성 규칙:**
    1. 사용자의 감정/상황에 공감하는 한 문장으로 시작
    2. 이 모임의 매력 포인트를 2-3문장으로 설명
    3. 친근하고 따뜻한 말투 (존댓말 + 반말 섞어서)
    4. 이모지 1-2개만 사용 (과하지 않게)
    5. 총 3-4문장, 80-120자 이내

    **좋은 예시:**
    - "오늘 힘드셨죠? 😊 조용한 카페에서 브런치 먹으면서 머리 좀 식히는 건 어떨까요? 홍대 카페는 분위기도 아늑하고 2.3km 거리라 부담 없어요!"
    - "딱 적당히 몸 풀고 싶을 때네요! 🏃 한강에서 5km 가볍게 뛰면서 같이 달리는 사람들이랑 수다도 떨면 스트레스가 확 풀려요."
    - "기분전환엔 전시회만 한 게 없죠! 🎨 성수동 갤러리는 무료 입장이고 작품 보면서 감성 충전하기 딱이에요."

    **이제 작성하세요 (추천 이유만, 다른 말 없이):**
    """

            # ✅ await 제거 - 동기 호출
            response = self.gpt_service.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "당신은 공감 능력이 뛰어난 AI 추천 어시스턴트입니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=200
            )

            reasoning = response.choices[0].message.content.strip()
            logger.info(f"✅ GPT reasoning 생성: {reasoning[:50]}...")
            return reasoning

        except Exception as e:
            logger.error(f"⚠️ GPT reasoning 실패, fallback 사용: {e}")
            return self._fallback_reasoning(meeting, parsed_query)

    def _fallback_reasoning(self, meeting: Dict, parsed_query: Dict) -> str:
        """GPT 실패 시 템플릿 기반 reasoning"""

        # ✅ None 체크를 포함한 안전한 값 추출
        category = meeting.get("category") or ""
        subcategory = meeting.get("subcategory") or ""
        location = meeting.get("location_name") or "미정"
        distance = meeting.get("distance_km") if meeting.get("distance_km") is not None else 0
        cost = meeting.get("expected_cost") if meeting.get("expected_cost") is not None else 0
        participants = meeting.get("current_participants") if meeting.get("current_participants") is not None else 0

        templates = {
            "카페": [
                f"조용한 {location}에서 힐링 타임 어때요? ☕ {distance:.1f}km 거리라 부담 없이 다녀올 수 있어요!",
                f"카페에서 브런치 먹으면서 여유롭게 쉬는 건 어떨까요? 현재 {participants}명이 참여 중이라 편안한 분위기예요.",
            ],
            "스포츠": [
                f"가볍게 몸 풀면서 스트레스 날려버리기 좋아요! 🏃 {location}에서 함께 운동하면 더 재밌어요.",
                f"적당히 땀 흘리면서 기분전환하기 딱! {participants}명이랑 같이 하면 동기부여도 되고요.",
            ],
            "맛집": [
                f"맛있는 거 먹으면서 힐링하는 게 최고죠! 🍽️ {subcategory} 좋아하시면 강추예요.",
                f"{cost:,}원으로 맛있는 음식 먹으면서 스트레스 풀 수 있어요!",
            ],
            "문화예술": [
                f"감성 충전이 필요할 때! 🎨 {location}에서 여유롭게 예술 감상하면 마음이 편안해져요.",
                f"조용히 전시 보면서 머리 비우기 딱 좋은 모임이에요. {distance:.1f}km 거리라 가깝고요.",
            ],
            "소셜": [
                f"가볍게 놀면서 기분전환! 🎮 {subcategory} 하면서 웃다 보면 스트레스가 확 풀려요.",
                f"{participants}명이랑 함께하는 {subcategory} 모임! 부담 없이 즐기기 좋아요.",
            ],
        }

        import random
        options = templates.get(category, [f"이 모임은 당신의 취향과 잘 맞을 것 같아요! 😊 {location}에서 {distance:.1f}km 거리예요."])
        return random.choice(options)

    async def _fallback_svd_recommendation(
            self,
            user_id: int,
            user_prompt: str,
            parsed_query: Dict,
            top_n: int,
            user_context: Dict,  # ✅ 추가
    ) -> Dict:
        if not model_loader.svd or not model_loader.svd.is_loaded():
            raise RuntimeError("SVD 모델 로드되지 않음")

        svd_recommendations = await model_loader.svd.recommend(user_id=user_id, top_n=top_n * 2)
        meeting_ids = [int(mid) for mid, _ in svd_recommendations]
        meetings = await self._get_meetings_by_ids(meeting_ids)

        # ✅ fallback에서도 유저좌표 기반 거리 계산 주입
        meetings = self._inject_distance_km(meetings, user_context)

        scored = []
        for meeting in meetings:
            # meeting_id 키 혼용 대응
            m_id = meeting.get("meeting_id") or meeting.get("meetingId")
            svd_score = next((score for mid, score in svd_recommendations if int(mid) == int(m_id)), 3.5)

            scored.append({
                **meeting,
                "match_score": min(100, int(float(svd_score) * 20)),
                "predicted_rating": round(float(svd_score), 1),
                "svd_score": round(float(svd_score), 2),
                "key_points": ["SVD 협업 필터링 기반 추천"],
                "reasoning": "과거 참여 이력을 바탕으로 추천된 모임입니다."
            })

        return {
            "user_prompt": user_prompt,
            "parsed_query": parsed_query,
            "total_candidates": len(scored),
            "recommendations": scored[:top_n],
            "fallback": True
        }

    async def _get_meetings_by_ids(self, meeting_ids: List[int]) -> List[Dict]:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.spring_boot_url}/api/meetings/batch",
                    json={"meetingIds": meeting_ids}
                )
            if response.status_code == 200:
                return response.json().get("meetings", [])
            return []
        except Exception as e:
            logger.error(f"⚠️ 모임 정보 조회 실패: {e}")
            return []

    def _normalize_meeting(self, m: dict) -> dict:
        """
        Spring 응답(snake/camel 혼용) → FeatureBuilder 입력 표준화
        + UI 유지 필드(title,image_url) 포함
        """
        return {
            "meeting_id": m.get("meeting_id") or m.get("meetingId"),

            "lat": m.get("latitude") or m.get("lat"),
            "lng": m.get("longitude") or m.get("lng"),

            "category": m.get("category", "") or "",
            "subcategory": m.get("subcategory", "") or "",

            "time_slot": self._normalize_timeslot(m.get("time_slot") or m.get("timeSlot")),
            "meeting_location_type": self._normalize_location_type(m.get("location_type") or m.get("locationType")),
            "vibe": m.get("vibe", "") or "",

            "max_participants": m.get("max_participants") or m.get("maxParticipants") or 10,
            "meeting_participant_count": m.get("current_participants") or m.get("currentParticipants") or 0,
            "expected_cost": m.get("expected_cost") or m.get("expectedCost") or 0,

            "meeting_avg_rating": m.get("avg_rating") or m.get("avgRating") or 0.0,
            "meeting_rating_count": m.get("rating_count") or m.get("ratingCount") or 0,

            "distance_km": m.get("distance_km") or m.get("distanceKm"),

            # UI용 보존
            "title": m.get("title"),
            "image_url": m.get("image_url") or m.get("imageUrl"),
            "location_name": m.get("location_name") or m.get("locationName"),
            "location_address": m.get("location_address") or m.get("locationAddress"),
            "meeting_time": m.get("meeting_time") or m.get("meetingTime"),
            "current_participants": m.get("current_participants") or m.get("currentParticipants"),
            "max_participants": m.get("max_participants") or m.get("maxParticipants"),
        }

    def _make_clarification_card(self, user_prompt: str, parsed_query: dict, user_context: dict) -> dict:
        # 유저 위치가 있으면 “집 근처” 같은 문구도 가능
        # (여기서는 단순 텍스트로만)
        return {
            "meeting_id": -1,
            "title": "어떤 걸 하고 싶은지 한 가지만 더 알려줘요 🙂",
            "category": "SYSTEM",
            "subcategory": "CLARIFY",
            "location_name": "추천을 위해 추가 정보가 필요해요",
            "image_url": None,

            "match_score": 0,
            "match_level": "INFO",
            "predicted_rating": None,

            "key_points": [
                "예: 집에서 요리 같이 하기",
                "예: 집에서 스터디/공부",
                "예: 집 근처 카페에서 브런치",
            ],
            "reasoning": (
                f"지금 입력은 '{user_prompt}'라서 추천 범위를 좁히기 어려워요. "
                "원하는 활동(요리/스터디/영화/운동 등)이나 지역(홍대/성수 등) 중 1개만 더 말해줘요!"
            ),
            "is_clarification": True,
            "intent": "NEUTRAL",
        }

    def _pre_relax_query_by_conf(self, q: dict) -> dict:
        """
        L0 자체를 confidence 기반으로 완화해서,
        relaxation 단계가 과도하게 여러 번 돌지 않게 함.
        """
        conf = float(q.get("confidence", 0) or 0)
        qq = dict(q)

        # 0.7 미만이면 subcategory는 너무 공격적 → L0에서 제거
        if conf < 0.7:
            qq.pop("subcategory", None)

        # 0.6 미만이면 vibe는 제거
        if conf < 0.6:
            qq.pop("vibe", None)

        # time_slot은 너가 이미 0.9 이상일 때만 쓰기로 했으니 유지
        if conf < 0.9:
            qq.pop("time_slot", None)
            qq.pop("timeSlot", None)

        # 0.45 미만이면 category도 제거하고 keyword 위주로 넓게
        if conf < 0.45:
            qq.pop("category", None)

        return qq

    # -------------------------
    # Distance utils (fallback에서도 거리 계산)
    # -------------------------
    def _haversine_km(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """두 좌표 간 거리(km)."""
        R = 6371.0
        p1, p2 = math.radians(lat1), math.radians(lat2)
        d1 = math.radians(lat2 - lat1)
        d2 = math.radians(lon2 - lon1)
        a = (math.sin(d1 / 2) ** 2) + math.cos(p1) * math.cos(p2) * (math.sin(d2 / 2) ** 2)
        return 2 * R * math.asin(math.sqrt(a))

    def _inject_distance_km(self, meetings: List[Dict], user_ctx: Dict) -> List[Dict]:
        """meetings에 distance_km이 없으면 유저좌표로 계산해서 넣어줌."""
        u_lat = user_ctx.get("latitude") or user_ctx.get("lat")
        u_lng = user_ctx.get("longitude") or user_ctx.get("lng")

        if u_lat is None or u_lng is None:
            return meetings

        out = []
        for m in meetings or []:
            # 이미 spring에서 내려준 distance가 있으면 유지
            if m.get("distance_km") is not None or m.get("distanceKm") is not None:
                out.append(m)
                continue

            m_lat = m.get("latitude") or m.get("lat")
            m_lng = m.get("longitude") or m.get("lng")

            if m_lat is None or m_lng is None:
                out.append(m)
                continue

            try:
                d = self._haversine_km(float(u_lat), float(u_lng), float(m_lat), float(m_lng))
                mm = dict(m)
                mm["distance_km"] = round(float(d), 3)  # UI는 0.1단위로 잘라서 보여주면 됨
                out.append(mm)
            except Exception:
                out.append(m)

        return out

    def _clean_keywords(self, keywords: Optional[list[str]]) -> list[str]:
        if not keywords:
            return []

        stop = {
            "하고싶어", "하고", "싶어", "원해", "추천", "해주세요", "해줘",
            "그냥", "좀", "한번", "같이",
            "밖에서", "집에서", "근처", "주변", "요즘",
            "뛰어놀고",  # 필요하면 빼도 됨(러닝이면 살리고 싶을 수도)
        }

        cleaned = []
        for k in keywords:
            if not k:
                continue
            w = str(k).strip()
            if len(w) < 2:
                continue
            if w in stop:
                continue
            cleaned.append(w)

        # ✅ 중복 제거(순서 유지)
        seen = set()
        out = []
        for w in cleaned:
            if w not in seen:
                out.append(w)
                seen.add(w)
        return out

    def _is_near_me_phrase(self, q: str | None) -> bool:
        if not q:
            return False
        s = str(q).strip().lower()
        return ("근처" in s) or ("주변" in s) or ("집" in s) or ("내 근처" in s)








