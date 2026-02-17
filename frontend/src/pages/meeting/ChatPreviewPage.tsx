import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import axios from "axios";
import "./ChatPreviewPage.css";

interface MeetingInfo {
  meetingId: number;
  chatRoomId: number;
  title: string;
  organizerUsername: string;
  meetingTime: string;
  locationName: string;
  currentParticipants: number;
  maxParticipants: number;
}

const ChatPreviewPage = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [meeting, setMeeting] = useState<MeetingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetingInfo();
  }, [meetingId]);

  const fetchMeetingInfo = async () => {
    try {
      const response = await axios.get(
        `import.meta.env.VITE_API_URL || 'https://api.it-da.cloud'/api/meetings/${meetingId}`,
        { withCredentials: true },
      );
      setMeeting(response.data);
    } catch (err) {
      console.error("모임 정보 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterChat = () => {
    navigate(`/chat/${meeting?.chatRoomId}`);
  };

  const handleGoBack = () => {
    navigate(`/meetings/${meetingId}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="error-container">
        <p>모임 정보를 불러올 수 없습니다.</p>
        <button onClick={handleGoBack}>돌아가기</button>
      </div>
    );
  }

  return (
    <div className="chat-preview-page">
      <div className="preview-container">
        <div className="success-icon">🎉</div>

        <h1 className="preview-title">참여 신청이 완료되었습니다!</h1>

        <div className="meeting-summary">
          <h2>{meeting.title}</h2>
          <div className="summary-details">
            <div className="detail-item">
              <span className="label">모임장</span>
              <span className="value">{meeting.organizerUsername}</span>
            </div>
            <div className="detail-item">
              <span className="label">일시</span>
              <span className="value">
                {new Date(meeting.meetingTime).toLocaleString("ko-KR", {
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="detail-item">
              <span className="label">장소</span>
              <span className="value">{meeting.locationName}</span>
            </div>
            <div className="detail-item">
              <span className="label">참여 인원</span>
              <span className="value">
                {meeting.currentParticipants}/{meeting.maxParticipants}명
              </span>
            </div>
          </div>
        </div>

        <div className="chat-info-box">
          <h3>💬 톡방 안내</h3>
          <ul className="info-list">
            <li>모임 참여자들과 실시간으로 소통할 수 있어요</li>
            <li>모임 장소나 시간 변경 사항을 확인하세요</li>
            <li>서로 인사를 나누고 모임을 준비해요</li>
            <li>예의를 지키며 즐거운 대화를 나눠주세요</li>
          </ul>
        </div>

        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={handleGoBack}>
            모임 상세로
          </button>
          <button className="btn btn-primary" onClick={handleEnterChat}>
            💬 톡방 입장하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPreviewPage;
