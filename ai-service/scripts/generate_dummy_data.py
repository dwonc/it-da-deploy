import random
from datetime import datetime, timedelta

# 기본 설정
N_MEETINGS = 1000
START_MEETING_ID = 101

# 사용자 ID 범위 (1-20)
USER_IDS = list(range(1, 21))

# 카테고리별 상세 정보
CATEGORY_DETAILS = {
    '스포츠': {
        'subcategories': ['러닝', '축구', '배드민턴', '등산', '요가', '사이클링'],
        'location_type': 'OUTDOOR',
        'cost_range': (0, 10000),
        'vibes': ['활기찬', '에너지 넘치는'],
        'time_slots': ['MORNING', 'EVENING'],
        'max_participants': (6, 15),
        'titles': {
            '러닝': ['한강 러닝', '새벽 러닝 크루', '올림픽공원 러닝', '남산 트레일 러닝', '탄천 러닝'],
            '축구': ['풋살 게임', '아침 축구', '주말 축구', '축구 친선전', '5vs5 축구'],
            '배드민턴': ['배드민턴 동호회', '주중 배드민턴', '배드민턴 레슨', '초급 배드민턴', '실력 향상 배드민턴'],
            '등산': ['북한산 등산', '관악산 등반', '인왕산 트레킹', '남산 산책', '도봉산 등산'],
            '요가': ['아침 요가', '저녁 힐링 요가', '빈야사 플로우', '하타 요가', '파워 요가'],
            '사이클링': ['한강 라이딩', '자전거 투어', '양수리 라이딩', '북한강 사이클링', '강변 자전거']
        },
        'locations': {
            '러닝': [
                ('한강공원', '서울 영등포구 여의도동', 37.5285, 126.9342),
                ('올림픽공원', '서울 송파구 방이동', 37.5219, 127.1240),
                ('탄천', '서울 강남구 역삼동', 37.5012, 127.0396),
            ],
            '축구': [
                ('잠실종합운동장', '서울 송파구 올림픽로', 37.5145, 127.0726),
                ('상암 월드컵경기장', '서울 마포구 상암동', 37.5794, 126.8895),
            ],
            '배드민턴': [
                ('송파 체육관', '서울 송파구 잠실동', 37.5133, 127.1000),
                ('강남 체육센터', '서울 강남구 역삼동', 37.5012, 127.0396),
            ],
            '등산': [
                ('북한산 입구', '서울 은평구 진관동', 37.6404, 126.9293),
                ('관악산 입구', '서울 관악구 신림동', 37.4619, 126.9538),
            ],
            '요가': [
                ('강남 요가센터', '서울 강남구 역삼동', 37.5012, 127.0396),
                ('홍대 요가스튜디오', '서울 마포구 홍대입구', 37.5563, 126.9236),
            ],
            '사이클링': [
                ('여의도 한강공원', '서울 영등포구 여의도동', 37.5285, 126.9342),
                ('뚝섬 한강공원', '서울 광진구 자양동', 37.5304, 127.0669),
            ]
        }
    },
    '맛집': {
        'subcategories': ['한식', '중식', '일식', '양식', '이자카야'],
        'location_type': 'INDOOR',
        'cost_range': (15000, 40000),
        'vibes': ['여유로운', '힐링'],
        'time_slots': ['AFTERNOON', 'EVENING'],
        'max_participants': (4, 8),
        'titles': {
            '한식': ['한정식 코스', '고깃집 투어', '전통 한식', '계절 밥상', '한옥 한정식'],
            '중식': ['중화요리 코스', '딤섬 맛집', '탕수육 맛집', '짜장면 투어', '중국집 탐방'],
            '일식': ['오마카세', '초밥 맛집', '라멘 투어', '스시 코스', '일식당 탐방'],
            '양식': ['파스타 맛집', '스테이크 하우스', '이탈리안 코스', '프렌치 다이닝', '양식 레스토랑'],
            '이자카야': ['일본 선술집', '사케바', '이자카야 투어', '선술집 탐방', '일본식 주점']
        },
        'locations': {
            '한식': [
                ('북촌한옥마을', '서울 종로구 계동', 37.5819, 126.9858),
                ('인사동', '서울 종로구 인사동', 37.5742, 126.9854),
            ],
            '중식': [
                ('명동', '서울 중구 명동', 37.5636, 126.9834),
                ('을지로', '서울 중구 을지로', 37.5665, 126.9910),
            ],
            '일식': [
                ('청담동', '서울 강남구 청담동', 37.5240, 127.0479),
                ('압구정동', '서울 강남구 압구정동', 37.5276, 127.0283),
            ],
            '양식': [
                ('이태원동', '서울 용산구 이태원동', 37.5345, 126.9946),
                ('한남동', '서울 용산구 한남동', 37.5349, 127.0026),
            ],
            '이자카야': [
                ('홍대입구', '서울 마포구 홍대입구', 37.5563, 126.9236),
                ('을지로', '서울 중구 을지로', 37.5665, 126.9910),
            ]
        }
    },
    '카페': {
        'subcategories': ['카페투어', '브런치', '디저트', '베이커리'],
        'location_type': 'INDOOR',
        'cost_range': (10000, 20000),
        'vibes': ['여유로운', '힐링', '감성적인'],
        'time_slots': ['MORNING', 'AFTERNOON'],
        'max_participants': (4, 8),
        'titles': {
            '카페투어': ['핫플 카페 투어', '성수 카페 탐방', '감성 카페', '루프탑 카페', '카페 순례'],
            '브런치': ['브런치 맛집', '건강 브런치', '에그베네딕트', '브런치 플레이트', '주말 브런치'],
            '디저트': ['디저트 카페', '케이크 맛집', '마카롱 투어', '타르트 카페', '수제 디저트'],
            '베이커리': ['베이커리 투어', '빵집 탐방', '크루아상', '프랑스 베이커리', '수제 빵']
        },
        'locations': {
            '카페투어': [
                ('성수동', '서울 성동구 성수동', 37.5445, 127.0557),
                ('가로수길', '서울 강남구 신사동', 37.5198, 127.0229),
            ],
            '브런치': [
                ('한남동', '서울 용산구 한남동', 37.5349, 127.0026),
                ('홍대입구', '서울 마포구 홍대입구', 37.5563, 126.9236),
            ],
            '디저트': [
                ('연남동', '서울 마포구 연남동', 37.5663, 126.9245),
                ('삼청동', '서울 종로구 삼청동', 37.5842, 126.9826),
            ],
            '베이커리': [
                ('이태원동', '서울 용산구 이태원동', 37.5345, 126.9946),
                ('청담동', '서울 강남구 청담동', 37.5240, 127.0479),
            ]
        }
    },
    '문화예술': {
        'subcategories': ['전시회', '공연', '갤러리', '공방체험'],
        'location_type': 'INDOOR',
        'cost_range': (5000, 25000),
        'vibes': ['감성적인', '창의적인'],
        'time_slots': ['AFTERNOON', 'EVENING'],
        'max_participants': (4, 10),
        'titles': {
            '전시회': ['미술 전시', '현대미술', '사진 전시', '디자인 전시', '기획 전시'],
            '공연': ['연극 관람', '뮤지컬', '콘서트', '재즈 공연', '클래식'],
            '갤러리': ['갤러리 투어', '작은 전시', '아트 투어', '미술관 탐방', '갤러리 순례'],
            '공방체험': ['도자기 공방', '가죽 공방', '레더 소품', '도예 체험', '핸드메이드']
        },
        'locations': {
            '전시회': [
                ('삼청동', '서울 종로구 삼청동', 37.5842, 126.9826),
                ('DDP', '서울 중구 을지로', 37.5665, 127.0088),
            ],
            '공연': [
                ('대학로', '서울 종로구 대학로', 37.5814, 127.0022),
                ('세종문화회관', '서울 종로구 세종대로', 37.5720, 126.9769),
            ],
            '갤러리': [
                ('삼청동', '서울 종로구 삼청동', 37.5842, 126.9826),
                ('성수동', '서울 성동구 성수동', 37.5445, 127.0557),
            ],
            '공방체험': [
                ('인사동', '서울 종로구 인사동', 37.5742, 126.9854),
                ('연남동', '서울 마포구 연남동', 37.5663, 126.9245),
            ]
        }
    },
    '스터디': {
        'subcategories': ['영어회화', '독서토론', '코딩', '재테크'],
        'location_type': 'INDOOR',
        'cost_range': (0, 8000),
        'vibes': ['진지한'],
        'time_slots': ['EVENING'],
        'max_participants': (4, 8),
        'titles': {
            '영어회화': ['영어 프리토킹', '비즈니스 영어', 'OPIC 스터디', '토익 스피킹', '영어 회화'],
            '독서토론': ['책 읽기 모임', '독서 토론', '철학 독서', '자기계발서', '소설 읽기'],
            '코딩': ['Python 스터디', '웹개발', 'Java 스터디', 'React 스터디', '코딩 테스트'],
            '재테크': ['주식 투자', '부동산 공부', '재무 설계', '경제 스터디', '자산 관리']
        },
        'locations': {
            '영어회화': [
                ('강남 스터디카페', '서울 강남구 역삼동', 37.5012, 127.0396),
                ('종로 스터디룸', '서울 종로구 종로', 37.5702, 126.9842),
            ],
            '독서토론': [
                ('홍대 북카페', '서울 마포구 홍대입구', 37.5563, 126.9236),
                ('신촌 북카페', '서울 서대문구 신촌동', 37.5563, 126.9364),
            ],
            '코딩': [
                ('테헤란로 코워킹', '서울 강남구 테헤란로', 37.5048, 127.0500),
                ('판교 코워킹', '경기 성남시 분당구', 37.3956, 127.1110),
            ],
            '재테크': [
                ('강남 스터디룸', '서울 강남구 역삼동', 37.5012, 127.0396),
                ('여의도 스터디룸', '서울 영등포구 여의도동', 37.5219, 126.9245),
            ]
        }
    },
    '취미활동': {
        'subcategories': ['그림', '베이킹', '쿠킹', '플라워'],
        'location_type': 'INDOOR',
        'cost_range': (15000, 35000),
        'vibes': ['창의적인', '여유로운', '즐거운'],
        'time_slots': ['AFTERNOON', 'EVENING'],
        'max_participants': (4, 10),
        'titles': {
            '그림': ['수채화 그리기', '유화 클래스', '드로잉', '인물화', '풍경화'],
            '베이킹': ['쿠키 만들기', '마카롱 클래스', '케이크 베이킹', '타르트', '브라우니'],
            '쿠킹': ['이탈리안 요리', '한식 쿠킹', '일식 요리', '베트남 요리', '프렌치 쿠킹'],
            '플라워': ['꽃다발 만들기', '플라워 클래스', '드라이 플라워', '프리저브드', '플로럴 디자인']
        },
        'locations': {
            '그림': [
                ('홍대 아트센터', '서울 마포구 홍대입구', 37.5563, 126.9236),
                ('이태원 아트스튜디오', '서울 용산구 이태원동', 37.5345, 126.9946),
            ],
            '베이킹': [
                ('신사동 베이킹 스튜디오', '서울 강남구 신사동', 37.5198, 127.0229),
                ('청담동 베이킹 스튜디오', '서울 강남구 청담동', 37.5240, 127.0479),
            ],
            '쿠킹': [
                ('이태원 쿠킹 스튜디오', '서울 용산구 이태원동', 37.5345, 126.9946),
                ('인사동 쿠킹 스쿨', '서울 종로구 인사동', 37.5742, 126.9854),
            ],
            '플라워': [
                ('청담동 플라워 스튜디오', '서울 강남구 청담동', 37.5240, 127.0479),
                ('신사동 플라워 클래스', '서울 강남구 신사동', 37.5198, 127.0229),
            ]
        }
    },
    '소셜': {
        'subcategories': ['보드게임', '방탈출', '볼링', '당구'],
        'location_type': 'INDOOR',
        'cost_range': (10000, 25000),
        'vibes': ['즐거운', '활기찬'],
        'time_slots': ['EVENING'],
        'max_participants': (4, 10),
        'titles': {
            '보드게임': ['보드게임 나잇', '전략 게임', '파티 게임', '협동 게임', '보드카페'],
            '방탈출': ['미스터리 방탈출', '호러 방탈출', '추리 방탈출', '판타지 방탈출', '이스케이프 룸'],
            '볼링': ['볼링 한 게임', '볼링 레슨', '볼링 대회', '주말 볼링', '볼링 동호회'],
            '당구': ['3쿠션 당구', '당구 레슨', '포켓볼', '당구 게임', '당구 클럽']
        },
        'locations': {
            '보드게임': [
                ('홍대 보드게임카페', '서울 마포구 홍대입구', 37.5563, 126.9236),
                ('강남 보드게임카페', '서울 강남구 역삼동', 37.5012, 127.0396),
            ],
            '방탈출': [
                ('강남 방탈출카페', '서울 강남구 역삼동', 37.5012, 127.0396),
                ('홍대 방탈출', '서울 마포구 홍대입구', 37.5563, 126.9236),
            ],
            '볼링': [
                ('잠실 볼링장', '서울 송파구 잠실동', 37.5133, 127.1000),
                ('강남 볼링장', '서울 강남구 역삼동', 37.5012, 127.0396),
            ],
            '당구': [
                ('강남 당구장', '서울 강남구 역삼동', 37.5012, 127.0396),
                ('압구정 당구클럽', '서울 강남구 압구정동', 37.5276, 127.0283),
            ]
        }
    }
}

# 이모지 매핑
EMOJI_MAP = {
    '러닝': '🏃', '축구': '⚽', '배드민턴': '🏸', '등산': '⛰️', '요가': '🧘', '사이클링': '🚴',
    '한식': '🍱', '중식': '🥢', '일식': '🍣', '양식': '🍝', '이자카야': '🍶',
    '카페투어': '☕', '브런치': '🥞', '디저트': '🍰', '베이커리': '🥐',
    '전시회': '🖼️', '공연': '🎭', '갤러리': '🎨', '공방체험': '🏺',
    '영어회화': '💬', '독서토론': '📚', '코딩': '💻', '재테크': '💰',
    '그림': '🎨', '베이킹': '🍪', '쿠킹': '🍝', '플라워': '💐',
    '보드게임': '🎲', '방탈출': '🔐', '볼링': '🎳', '당구': '🎱'
}


def generate_meeting_time(days_ahead_range=(0, 30)):
    """미래 날짜 생성"""
    days = random.randint(*days_ahead_range)
    base_date = datetime.now() + timedelta(days=days)

    # 시간대별 시간 설정
    time_slot_hours = {
        'MORNING': (6, 11),
        'AFTERNOON': (12, 17),
        'EVENING': (18, 22)
    }

    time_slot = random.choice(['MORNING', 'AFTERNOON', 'EVENING'])
    hour_range = time_slot_hours[time_slot]
    hour = random.randint(*hour_range)
    minute = random.choice([0, 30])

    meeting_datetime = base_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
    return meeting_datetime.strftime('%Y-%m-%d %H:%M:%S'), time_slot


def generate_sql_insert():
    """SQL INSERT 문 생성"""
    sql_statements = []

    # ✅ USE 문 추가
    sql_statements.append("USE itda;\n")

    sql_statements.append("-- ========================================")
    sql_statements.append("-- 1000개 모임 더미 데이터")
    sql_statements.append(f"-- meeting_id: {START_MEETING_ID} ~ {START_MEETING_ID + N_MEETINGS - 1}")
    sql_statements.append("-- ========================================\n")

    sql_statements.append("INSERT INTO meetings (")
    sql_statements.append("  meeting_id, organizer_id, title, description, category, subcategory,")
    sql_statements.append("  meeting_time, time_slot, location_name, location_address,")
    sql_statements.append("  latitude, longitude, location_type, vibe,")
    sql_statements.append("  max_participants, current_participants, expected_cost,")
    sql_statements.append("  status, image_url, avg_rating, rating_count,")
    sql_statements.append("  created_at, updated_at")
    sql_statements.append(") VALUES\n")

    values = []

    for i in range(N_MEETINGS):
        meeting_id = START_MEETING_ID + i

        # 랜덤 카테고리 선택
        category = random.choice(list(CATEGORY_DETAILS.keys()))
        details = CATEGORY_DETAILS[category]

        # 서브카테고리 선택
        subcategory = random.choice(details['subcategories'])

        # 제목 생성
        title_template = random.choice(details['titles'][subcategory])
        emoji = EMOJI_MAP.get(subcategory, '✨')
        title = f"{title_template} {emoji}"

        # 설명 생성
        descriptions = [
            f"{subcategory} 함께 즐겨요!",
            f"초보자도 환영하는 {subcategory} 모임",
            f"{subcategory} 좋아하는 분들 모여요",
            f"재밌는 {subcategory} 모임",
            f"{subcategory} 친목 모임"
        ]
        description = random.choice(descriptions)

        # 시간 생성
        meeting_time, time_slot = generate_meeting_time()

        # 위치 선택
        locations = details['locations'][subcategory]
        location = random.choice(locations)
        location_name, location_address, latitude, longitude = location

        # 기타 정보
        location_type = details['location_type']
        vibe = random.choice(details['vibes'])
        max_participants = random.randint(*details['max_participants'])
        current_participants = random.randint(1, max_participants - 1)
        expected_cost = random.randint(*details['cost_range'])

        # 주최자
        organizer_id = random.choice(USER_IDS)

        # 평점
        avg_rating = round(random.uniform(4.0, 5.0), 1)
        rating_count = random.randint(5, 20)

        # 이미지 URL
        image_url = f"https://example.com/{subcategory.lower()}.jpg"

        # SQL VALUE 생성
        value = f"""({meeting_id}, {organizer_id}, '{title}', '{description}', 
 '{category}', '{subcategory}', '{meeting_time}', '{time_slot}', '{location_name}', '{location_address}', 
 {latitude}, {longitude}, '{location_type}', '{vibe}', {max_participants}, {current_participants}, {expected_cost}, 'RECRUITING', 
 '{image_url}', {avg_rating}, {rating_count}, NOW(), NOW())"""

        values.append(value)

    # VALUES 연결
    sql_statements.append(",\n".join(values))
    sql_statements.append(";")

    return "\n".join(sql_statements)


# SQL 생성
sql_output = generate_sql_insert()

# 파일로 저장
output_file = "insert_1000_meetings.sql"
with open(output_file, "w", encoding="utf-8") as f:
    f.write(sql_output)

print(f"✅ {output_file} 파일이 생성되었습니다!")
print(f"📊 총 {N_MEETINGS}개의 모임 데이터가 생성되었습니다.")
print(f"🔢 meeting_id 범위: {START_MEETING_ID} ~ {START_MEETING_ID + N_MEETINGS - 1}")