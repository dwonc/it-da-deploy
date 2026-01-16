// src/pages/meeting/MeetingListPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMeetingStore } from '@/stores/useMeetingStore';
import { CATEGORY_DATA } from '@/pages/category/CategoryDetailPage';
import styles from './MeetingListPage.module.css';

// ✅ 지역 데이터
const regionData = {
    '서울': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
    '부산': ['강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구'],
    '대구': ['남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구'],
    '인천': ['강화군', '계양구', '남동구', '동구', '미추홀구', '부평구', '서구', '연수구', '옹진군', '중구'],
    '광주': ['광산구', '남구', '동구', '북구', '서구'],
    '대전': ['대덕구', '동구', '서구', '유성구', '중구'],
    '울산': ['남구', '동구', '북구', '울주군', '중구'],
    '세종': ['세종시'],
    '경기': ['가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시', '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시', '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시', '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'],
    '강원': ['강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군', '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군', '화천군', '횡성군'],
    '충북': ['괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '제천시', '증평군', '진천군', '청주시', '충주시'],
    '충남': ['계룡시', '공주시', '금산군', '논산시', '당진시', '보령시', '부여군', '서산시', '서천군', '아산시', '예산군', '천안시', '청양군', '태안군', '홍성군'],
    '전북': ['고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군', '완주군', '익산시', '임실군', '장수군', '전주시', '정읍시', '진안군'],
    '전남': ['강진군', '고흥군', '곡성군', '광양시', '구례군', '나주시', '담양군', '목포시', '무안군', '보성군', '순천시', '신안군', '여수시', '영광군', '영암군', '완도군', '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군'],
    '경북': ['경산시', '경주시', '고령군', '구미시', '군위군', '김천시', '문경시', '봉화군', '상주시', '성주군', '안동시', '영덕군', '영양군', '영주시', '영천시', '예천군', '울릉군', '울진군', '의성군', '청도군', '청송군', '칠곡군', '포항시'],
    '경남': ['거제시', '거창군', '고성군', '김해시', '남해군', '밀양시', '사천시', '산청군', '양산시', '의령군', '진주시', '창녕군', '창원시', '통영시', '하동군', '함안군', '함양군', '합천군'],
    '제주': ['서귀포시', '제주시']
};

const MeetingListPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const category = searchParams.get('category')
        ? decodeURIComponent(searchParams.get('category')!)
        : null;
    const subcategory = searchParams.get('subcategory')
        ? decodeURIComponent(searchParams.get('subcategory')!)
        : null;

    // ✅ 현재 카테고리 정보 가져오기
    const getCurrentCategoryInfo = () => {
        // 전체 모임 (카테고리 없음)
        if (!category) {
            return { icon: '🌟', description: '모든 카테고리의 모임을 한눈에' };
        }

        const categoryData = CATEGORY_DATA[category as any];

        if (!categoryData) {
            return { icon: '📋', description: '함께하는 즐거운 시간' };
        }

        // 서브카테고리가 있으면 해당 정보 반환
        if (subcategory) {
            const subData = categoryData.subcategories.find((s: any) => s.name === subcategory);
            if (subData) {
                return { icon: subData.icon, description: subData.description };
            }
        }

        // 메인 카테고리 정보 반환
        return { icon: categoryData.icon, description: categoryData.description };
    };
    const currentInfo = getCurrentCategoryInfo();

    // ✅ Zustand store에서 데이터 가져오기
    const {
        meetings,
        isLoading,
        error,
        fetchMeetingsByCategory
    } = useMeetingStore();

    // ✅ 필터 상태 관리
    const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
    const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
    const [selectedDay, setSelectedDay] = useState<string>('전체');
    const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
    const [sortOrder, setSortOrder] = useState<string>('최신순');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // ✅ 컴포넌트 마운트 시 서버에서 데이터 로드
    useEffect(() => {
        console.log('🔄 데이터 로드 시작:', { category, subcategory });
        if (category) {
            if (subcategory) {
                fetchMeetingsByCategory(category, subcategory);
            } else {
                fetchMeetingsByCategory(category);
            }
        } else {
            // 전체 모임 - 카테고리 없이 전체 조회
            fetchMeetingsByCategory();
        }
    }, [category, subcategory, fetchMeetingsByCategory]);

    // ✅ 날짜 포맷팅 함수
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const dayName = dayNames[date.getDay()];
        return `${month}/${day} (${dayName})`;
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    // ✅ 요일/시간대 판단 함수
    const getDayType = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = date.getDay();
        return (day === 0 || day === 6) ? '주말' : '평일';
    };

    const getTimeType = (dateStr: string) => {
        const date = new Date(dateStr);
        const hour = date.getHours();
        if (hour >= 6 && hour < 12) return '오전';
        if (hour >= 12 && hour < 18) return '오후';
        return '저녁';
    };

    // ✅ D-Day 계산
    const calculateDday = (dateStr: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const meetingDate = new Date(dateStr);
        meetingDate.setHours(0, 0, 0, 0);
        const diff = Math.ceil((meetingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    // ✅ 필터링 + 정렬
    const getFilteredAndSortedMeetings = () => {
        let filtered = [...meetings];

        // 지역 필터링
        if (selectedProvince) {
            filtered = filtered.filter(m => {
                if (!m.locationAddress) return false;
                return m.locationAddress.includes(selectedProvince);
            });
        }

        if (selectedDistricts.length > 0) {
            filtered = filtered.filter(m => {
                if (!m.locationAddress) return false;
                return selectedDistricts.some(district => m.locationAddress.includes(district));
            });
        }

        // 요일 필터링
        if (selectedDay !== '전체') {
            filtered = filtered.filter(m => getDayType(m.meetingTime) === selectedDay);
        }

        // 시간대 필터링
        if (selectedTimes.length > 0) {
            filtered = filtered.filter(m => selectedTimes.includes(getTimeType(m.meetingTime)));
        }

        // 정렬
        const sorted = [...filtered].sort((a, b) => {
            switch (sortOrder) {
                case '최신순':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case '인기순':
                case '평점순':
                    return (b.avgRating || 0) - (a.avgRating || 0);
                case '마감임박순':
                    return calculateDday(a.meetingTime) - calculateDday(b.meetingTime);
                default:
                    return 0;
            }
        });

        return sorted;
    };

    const filteredMeetings = getFilteredAndSortedMeetings();

    // ✅ 핸들러 함수들
    const handleProvinceClick = (province: string | null) => {
        setSelectedProvince(province);
        setSelectedDistricts([]);
    };

    const handleDistrictClick = (district: string) => {
        if (selectedDistricts.includes(district)) {
            setSelectedDistricts(selectedDistricts.filter(d => d !== district));
        } else {
            setSelectedDistricts([...selectedDistricts, district]);
        }
    };

    const handleTimeClick = (time: string) => {
        if (selectedTimes.includes(time)) {
            setSelectedTimes(selectedTimes.filter(t => t !== time));
        } else {
            setSelectedTimes([...selectedTimes, time]);
        }
    };

    // ✅ 로딩 상태
    if (isLoading) {
        return (
            <div className={styles.page}>
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <button className={styles.backBtn} onClick={() => navigate(-1)}>
                            ← 뒤로가기
                        </button>
                        <h1 className={styles.logo} onClick={() => navigate('/')}>
                            IT-DA
                        </h1>
                        <div style={{ marginLeft: 'auto', fontWeight: 'bold' }}>모임 목록</div>
                    </div>
                </header>
                <div className={styles.container}>
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>⏳</div>
                        <div>로딩 중...</div>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ 에러 상태
    if (error) {
        return (
            <div className={styles.page}>
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <button className={styles.backBtn} onClick={() => navigate(-1)}>
                            ← 모임 둘러보기
                        </button>
                        <h1 className={styles.logo} onClick={() => navigate('/')}>
                            IT-DA
                        </h1>
                    </div>
                </header>
                <div className={styles.container}>
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>❌</div>
                        <div>{error}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <button className={styles.backBtn} onClick={() => navigate(-1)}>
                        ← 모임 둘러보기
                    </button>
                    <h1 className={styles.logo} onClick={() => navigate('/')}>
                        IT-DA
                    </h1>
                </div>
            </header>

            <div className={styles.categoryHeader}>
                <div className={styles.categoryContent}>
                    <div className={styles.categoryIcon}>{currentInfo.icon}</div>
                    <h1 className={styles.categoryTitle}>
                        {subcategory || category || '전체 모임'}
                    </h1>
                    <p className={styles.categorySubtitle}>{currentInfo.description}</p>
                </div>
            </div>

            <div className={styles.container}>
                <div className={styles.filter}>
                    {/* 지역 필터 */}
                    <div className={styles.filterRow}>
                        <div className={styles.filterLabel}>지역</div>
                        <div className={styles.filterChips}>
                            <div
                                className={`${styles.chip} ${selectedProvince === null ? styles.active : ''}`}
                                onClick={() => handleProvinceClick(null)}
                            >
                                전체
                            </div>
                            {Object.keys(regionData).map((province) => (
                                <div
                                    key={province}
                                    className={`${styles.chip} ${selectedProvince === province ? styles.active : ''}`}
                                    onClick={() => handleProvinceClick(province)}
                                >
                                    {province}
                                </div>
                            ))}
                        </div>
                    </div>

                    {selectedProvince && (
                        <div className={styles.filterRow}>
                            <div className={styles.filterLabel}>
                                상세지역
                                {selectedDistricts.length > 0 && (
                                    <span style={{ color: '#667eea', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                                        ({selectedDistricts.length}개 선택)
                                    </span>
                                )}
                            </div>
                            <div className={styles.filterChips}>
                                <div
                                    className={`${styles.chip} ${selectedDistricts.length === 0 ? styles.active : ''}`}
                                    onClick={() => setSelectedDistricts([])}
                                >
                                    전체
                                </div>
                                {regionData[selectedProvince].map((district) => (
                                    <div
                                        key={district}
                                        className={`${styles.chip} ${selectedDistricts.includes(district) ? styles.active : ''}`}
                                        onClick={() => handleDistrictClick(district)}
                                    >
                                        {district}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles.filterRow}>
                        <div className={styles.filterLabel}>요일</div>
                        <div className={styles.filterChips}>
                            <div
                                className={`${styles.chip} ${selectedDay === '전체' ? styles.active : ''}`}
                                onClick={() => setSelectedDay('전체')}
                            >
                                전체
                            </div>
                            <div
                                className={`${styles.chip} ${selectedDay === '평일' ? styles.active : ''}`}
                                onClick={() => setSelectedDay('평일')}
                            >
                                평일
                            </div>
                            <div
                                className={`${styles.chip} ${selectedDay === '주말' ? styles.active : ''}`}
                                onClick={() => setSelectedDay('주말')}
                            >
                                주말
                            </div>
                        </div>
                    </div>

                    <div className={styles.filterRow}>
                        <div className={styles.filterLabel}>
                            시간대
                            {selectedTimes.length > 0 && (
                                <span style={{ color: '#667eea', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                                    ({selectedTimes.length}개 선택)
                                </span>
                            )}
                        </div>
                        <div className={styles.filterChips}>
                            <div
                                className={`${styles.chip} ${selectedTimes.length === 0 ? styles.active : ''}`}
                                onClick={() => setSelectedTimes([])}
                            >
                                전체
                            </div>
                            <div
                                className={`${styles.chip} ${selectedTimes.includes('오전') ? styles.active : ''}`}
                                onClick={() => handleTimeClick('오전')}
                            >
                                오전
                            </div>
                            <div
                                className={`${styles.chip} ${selectedTimes.includes('오후') ? styles.active : ''}`}
                                onClick={() => handleTimeClick('오후')}
                            >
                                오후
                            </div>
                            <div
                                className={`${styles.chip} ${selectedTimes.includes('저녁') ? styles.active : ''}`}
                                onClick={() => handleTimeClick('저녁')}
                            >
                                저녁
                            </div>
                        </div>
                    </div>
                </div>

                {/* 툴바 */}
                <div className={styles.toolbar}>
                    <div className={styles.result}>
                        총 <strong>{filteredMeetings.length}개</strong>의 모임이 있어요
                    </div>
                    <div className={styles.toolbarRight}>
                        <select
                            className={styles.select}
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                        >
                            <option>최신순</option>
                            <option>인기순</option>
                            <option>평점순</option>
                            <option>마감임박순</option>
                        </select>
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            ⊞
                        </button>
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            ☰
                        </button>
                    </div>
                </div>

                {/* 모임 리스트 */}
                {filteredMeetings.length > 0 ? (
                    <div className={viewMode === 'grid' ? styles.grid : styles.list}>
                        {filteredMeetings.map((m) => (
                            <div
                                key={m.meetingId}
                                className={viewMode === 'grid' ? styles.card : styles.listItem}
                                onClick={() => navigate(`/meeting/${m.meetingId}`)}
                            >
                                {viewMode === 'grid' ? (
                                    <>
                                        <div className={styles.image}>
                                            {m.imageUrl ? (
                                                <img src={m.imageUrl} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '4rem' }}>📸</div>
                                            )}
                                            {m.isFull && <div className={styles.badge}>마감</div>}
                                        </div>
                                        <div className={styles.content}>
                                            <h3 className={styles.title}>{m.title}</h3>
                                            <div className={styles.meta}>
                                                <div className={styles.metaItem}>📍 {m.locationName}</div>
                                                <div className={styles.metaItem}>
                                                    ⏰ {formatDate(m.meetingTime)} {formatTime(m.meetingTime)}
                                                </div>
                                                <div className={styles.metaItem}>
                                                    👥 {m.currentParticipants}/{m.maxParticipants}명
                                                </div>
                                            </div>
                                            <div className={styles.stats}>
                                                <div className={styles.stat}>
                                                    <div className={styles.statValue}>{m.avgRating?.toFixed(1) || '0.0'}</div>
                                                    <div className={styles.statLabel}>평점</div>
                                                </div>
                                                <div className={styles.stat}>
                                                    <div className={styles.statValue}>D-{calculateDday(m.meetingTime)}</div>
                                                    <div className={styles.statLabel}>마감</div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className={styles.listLeft}>
                                            <div className={styles.listImage}>
                                                {m.imageUrl ? (
                                                    <img src={m.imageUrl} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '3rem' }}>📸</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.listContent}>
                                            <h3 className={styles.listTitle}>{m.title}</h3>
                                            <div className={styles.listMeta}>
                                                <span>📍 {m.locationName}</span>
                                                <span>⏰ {formatDate(m.meetingTime)} {formatTime(m.meetingTime)}</span>
                                                <span>👥 {m.currentParticipants}/{m.maxParticipants}명</span>
                                            </div>
                                        </div>
                                        <div className={styles.listRight}>
                                            <div className={styles.listStats}>
                                                <div className={styles.listStatItem}>⭐ {m.avgRating?.toFixed(1) || '0.0'}</div>
                                            </div>
                                            <div className={styles.listDday}>D-{calculateDday(m.meetingTime)}</div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>🔍</div>
                        <div>해당 조건의 모임이 아직 없어요</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MeetingListPage;