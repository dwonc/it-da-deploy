import { useEffect, useState } from "react";
import axios from "axios";
import "./ChatPreviewModal.css";

interface ChatPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  onEnterChat: () => void;
  participationStatus: string | null; // ✅ 추가
}

interface MeetingInfo {
  meetingId: number;
  title: string;
  organizerUsername: string;
  meetingTime: string;
  locationName: string;
  currentParticipants: number;
  maxParticipants: number;
}

const ChatPreviewModal = ({
  isOpen,
  onClose,
  meetingId,
  onEnterChat,
  participationStatus,
}: ChatPreviewModalProps) => {
  const [meeting, setMeeting] = useState<MeetingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchMeetingInfo();
    }
  }, [isOpen, meetingId]);

  const fetchMeetingInfo = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/meetings/${meetingId}`,
        { withCredentials: true }
      );
      setMeeting(response.data);
    } catch (err) {
      console.error("모임 정보 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // ✅ 승인 여부에 따라 버튼 표시
  const canEnterChat = participationStatus === "APPROVED";

  return (
    <div className="chat-preview-overlay" onClick={onClose}>
      <div className="chat-preview-modal" onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className="loading-spinner">로딩 중...</div>
        ) : !meeting ? (
          <div className="error-message">
            <p>모임 정보를 불러올 수 없습니다.</p>
            <button className="btn btn-secondary" onClick={onClose}>
              닫기
            </button>
          </div>
        ) : (
          <>
            <button className="modal-close-btn" onClick={onClose}>
              ✕
            </button>

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
              <h3>{canEnterChat ? "💬 톡방 안내" : "⏳ 승인 대기 중"}</h3>
              {canEnterChat ? (
                <ul className="info-list">
                  <li>모임 참여자들과 실시간으로 소통할 수 있어요</li>
                  <li>모임 장소나 시간 변경 사항을 확인하세요</li>
                  <li>서로 인사를 나누고 모임을 준비해요</li>
                  <li>예의를 지키며 즐거운 대화를 나눠주세요</li>
                </ul>
              ) : (
                <ul className="info-list">
                  <li>모임장이 참여를 승인하면 톡방에 입장할 수 있어요</li>
                  <li>승인 알림은 푸시 또는 이메일로 발송됩니다</li>
                  <li>조금만 기다려주세요! 😊</li>
                </ul>
              )}
            </div>

            <div className="action-buttons">
              <button className="btn btn-secondary" onClick={onClose}>
                확인
              </button>
              {canEnterChat ? (
                <button className="btn btn-primary" onClick={onEnterChat}>
                  💬 톡방 입장하기
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  disabled
                  style={{ opacity: 0.5, cursor: "not-allowed" }}
                >
                  ⏳ 승인 대기 중
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPreviewModal;
