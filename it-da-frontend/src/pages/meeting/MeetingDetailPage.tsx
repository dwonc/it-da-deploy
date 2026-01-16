// src/pages/meeting/MeetingDetailPage.tsx
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeetingStore } from '@/stores/useMeetingStore';
import styles from './MeetingListPage.module.css';
import './MeetingDetailPage.css';

const MeetingDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { currentMeeting, isLoading, error, fetchMeetingById } = useMeetingStore();

    useEffect(() => {
        if (id) {
            fetchMeetingById(Number(id));
        }
    }, [id, fetchMeetingById]);

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="spinner">로딩 중...</div>
            </div>
        );
    }

    if (error || !currentMeeting) {
        return (
            <div className="error-container">
                <h2>모임을 찾을 수 없습니다</h2>
                <button onClick={() => navigate(-1)}>뒤로 가기</button>
            </div>
        );
    }

    // ✅ 날짜 포맷팅 헬퍼 함수
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short'
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="meeting-detail-page">
            {/* 헤더 */}
            <header className="header">
                <div className="header-content">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        ← 뒤로
                    </button>

                    <h1 className={styles.logo} onClick={() => navigate('/')}>
                        IT-DA
                    </h1>

                    <div className="header-title" style={{ marginLeft: 'auto' }}>
                        모임 상세
                    </div>
                </div>
            </header>

            {/* 메인 컨텐츠 */}
            <div className="main-container">
                {/* 이미지 갤러리 */}
                <div className="image-gallery">
                    <div className="main-image">
                        <div className="image-placeholder">
                            {currentMeeting.imageUrl ? (
                                <img src={currentMeeting.imageUrl} alt={currentMeeting.title} />
                            ) : (
                                <div className="placeholder-icon">📸</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="content-grid">
                    {/* 왼쪽: 모임 정보 */}
                    <div className="left-section">
                        {/* 카테고리 */}
                        <div className="category-badge">
                            {currentMeeting.category} › {currentMeeting.subcategory}
                        </div>

                        {/* 제목 */}
                        <h1 className="meeting-title">{currentMeeting.title}</h1>

                        {/* 평점 & 리뷰 */}
                        <div className="rating-section">
                            <span className="rating">⭐ {currentMeeting.avgRating || 0}</span>
                            <span className="review-count">({currentMeeting.reviewCount}개 리뷰)</span>
                        </div>

                        {/* 설명 */}
                        <div className="description-section">
                            <h2 className="section-title">모임 소개</h2>
                            <p className="description">{currentMeeting.description}</p>
                        </div>

                        {/* 상세 정보 */}
                        <div className="details-section">
                            <h2 className="section-title">상세 정보</h2>
                            <div className="detail-item">
                                <span className="detail-icon">📍</span>
                                <div>
                                    <div className="detail-label">장소</div>
                                    <div className="detail-value">{currentMeeting.locationName}</div>
                                    <div className="detail-subvalue">{currentMeeting.locationAddress}</div>
                                </div>
                            </div>
                            <div className="detail-item">
                                <span className="detail-icon">📅</span>
                                <div>
                                    <div className="detail-label">날짜</div>
                                    <div className="detail-value">{formatDate(currentMeeting.meetingTime)}</div>
                                </div>
                            </div>
                            <div className="detail-item">
                                <span className="detail-icon">⏰</span>
                                <div>
                                    <div className="detail-label">시간</div>
                                    <div className="detail-value">{formatTime(currentMeeting.meetingTime)}</div>
                                </div>
                            </div>
                            <div className="detail-item">
                                <span className="detail-icon">👥</span>
                                <div>
                                    <div className="detail-label">참여 인원</div>
                                    <div className="detail-value">
                                        {currentMeeting.currentParticipants} / {currentMeeting.maxParticipants}명
                                    </div>
                                </div>
                            </div>
                            <div className="detail-item">
                                <span className="detail-icon">💰</span>
                                <div>
                                    <div className="detail-label">참가비</div>
                                    <div className="detail-value">
                                        {currentMeeting.expectedCost === 0
                                            ? '무료'
                                            : `${currentMeeting.expectedCost.toLocaleString()}원`}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 호스트 정보 */}
                        <div className="host-section">
                            <h2 className="section-title">호스트</h2>
                            <div className="host-card">
                                <div className="host-avatar">
                                    {currentMeeting.organizerProfileImage ? (
                                        <img src={currentMeeting.organizerProfileImage} alt={currentMeeting.organizerUsername} />
                                    ) : (
                                        '👤'
                                    )}
                                </div>
                                <div className="host-info">
                                    <div className="host-name">{currentMeeting.organizerUsername}</div>
                                    <div className="host-stats">
                                        평점: {currentMeeting.avgRating || 0}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽: 참여 카드 */}
                    <div className="right-section">
                        <div className="join-card">
                            <div className="join-card-header">
                                <div className="price">
                                    {currentMeeting.expectedCost === 0
                                        ? '무료'
                                        : `${currentMeeting.expectedCost.toLocaleString()}원`}
                                </div>
                                <div className="participants-info">
                                    {currentMeeting.currentParticipants}/{currentMeeting.maxParticipants}명 참여 중
                                </div>
                            </div>
                            <button
                                className="join-btn"
                                disabled={currentMeeting.isFull}
                            >
                                {currentMeeting.isFull ? '모집 마감' : '모임 참여하기'}
                            </button>
                            <div className="card-divider"></div>
                            <button className="wishlist-btn">
                                ♡ 찜하기
                            </button>
                            <button className="share-btn">
                                📤 공유하기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MeetingDetailPage;