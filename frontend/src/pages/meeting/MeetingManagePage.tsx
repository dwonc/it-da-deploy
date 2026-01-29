import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import axios from "axios";
import "./MeetingManagePage.css";

interface ParticipationRequest {
  participationId: number;
  userId: number;
  username: string;
  profileImage: string;
  status: string;
  createdAt: string;
}

const MeetingManagePage = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [meeting, setMeeting] = useState<any>(null);
  const [participants, setParticipants] = useState<ParticipationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetingData();
  }, [meetingId]);

  const fetchMeetingData = async () => {
    try {
      // 모임 정보
      const meetingRes = await axios.get(
        `http://localhost:8080/api/meetings/${meetingId}`,
        { withCredentials: true }
      );
      setMeeting(meetingRes.data);
      console.log("✅ 모임 정보:", meetingRes.data);

      // 참여자 목록
      const participantsRes = await axios.get(
        `http://localhost:8080/api/participations/meeting/${meetingId}`,
        { withCredentials: true }
      );
      console.log("✅ 참여자 목록:", participantsRes.data);
      setParticipants(participantsRes.data.participants || []);
    } catch (err) {
      console.error("데이터 로딩 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (participationId: number) => {
    try {
      await axios.post(
        `http://localhost:8080/api/participations/${participationId}/approve`,
        {},
        { withCredentials: true }
      );
      alert("✅ 참여를 승인했습니다.");
      fetchMeetingData();
    } catch (err) {
      console.error("승인 실패:", err);
      alert("승인에 실패했습니다.");
    }
  };

  const handleReject = async (participationId: number) => {
    const reason = prompt("거절 사유를 입력해주세요 (선택):");

    try {
      await axios.post(
        `http://localhost:8080/api/participations/${participationId}/reject`,
        { reason: reason || "주최자가 거절하였습니다." },
        { withCredentials: true }
      );
      alert("❌ 참여를 거절했습니다.");
      fetchMeetingData();
    } catch (err) {
      console.error("거절 실패:", err);
      alert("거절에 실패했습니다.");
    }
  };

  // 날짜 포맷 함수 수정
  const formatDate = (dateString: string) => {
    if (!dateString) return "날짜 정보 없음";

    try {
      const date = new Date(dateString);

      // Invalid Date 체크
      if (isNaN(date.getTime())) {
        return "날짜 형식 오류";
      }

      // 한국 시간으로 포맷팅
      return date.toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (err) {
      console.error("날짜 변환 오류:", err);
      return "날짜 정보 없음";
    }
  };

  // 모임 시간 포맷
  const formatMeetingTime = (dateString: string) => {
    if (!dateString) return "시간 정보 없음";

    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return "시간 정보 없음";
      }

      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (err) {
      return "시간 정보 없음";
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const pendingParticipants = participants.filter(
    (p) => p.status === "PENDING"
  );
  const approvedParticipants = participants.filter(
    (p) => p.status === "APPROVED"
  );

  return (
    <div className="meeting-manage-page">
      <div className="manage-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ←
        </button>
        <h1>⚙️ 모임 관리</h1>
      </div>

      {/* 모임 정보 요약 */}
      <div className="meeting-summary card">
        <h2>{meeting?.title}</h2>
        <div className="summary-stats">
          <span>
            👥 {meeting?.currentParticipants}/{meeting?.maxParticipants}명
          </span>
          <span>⏰ {formatMeetingTime(meeting?.meetingTime)}</span>
        </div>
      </div>

      {/* 승인 대기 중 */}
      <div className="card">
        <h2 className="section-title">
          ⏳ 승인 대기 ({pendingParticipants.length})
        </h2>
        {pendingParticipants.length === 0 ? (
          <p className="empty-message">승인 대기 중인 신청이 없습니다.</p>
        ) : (
          <div className="participant-list">
            {pendingParticipants.map((p) => (
              <div key={p.participationId} className="participant-item">
                <div className="participant-info">
                  <div className="participant-avatar">
                    {p.profileImage ? (
                      <img src={p.profileImage} alt={p.username} />
                    ) : (
                      p.username.charAt(0)
                    )}
                  </div>
                  <div className="participant-details">
                    <div className="participant-name">{p.username}</div>
                    <div className="participant-date">
                      {formatDate(p.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="participant-actions">
                  <button
                    className="btn btn-approve"
                    onClick={() => handleApprove(p.participationId)}
                  >
                    ✅ 승인
                  </button>
                  <button
                    className="btn btn-reject"
                    onClick={() => handleReject(p.participationId)}
                  >
                    ❌ 거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 참여 중 */}
      <div className="card">
        <h2 className="section-title">
          ✅ 참여 중 ({approvedParticipants.length})
        </h2>
        {approvedParticipants.length === 0 ? (
          <p className="empty-message">아직 승인된 참여자가 없습니다.</p>
        ) : (
          <div className="participant-list">
            {approvedParticipants.map((p) => (
              <div key={p.participationId} className="participant-item">
                <div className="participant-info">
                  <div className="participant-avatar">
                    {p.profileImage ? (
                      <img src={p.profileImage} alt={p.username} />
                    ) : (
                      p.username.charAt(0)
                    )}
                  </div>
                  <div className="participant-details">
                    <div className="participant-name">{p.username}</div>
                    <div className="participant-date">
                      {formatDate(p.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 모임 관리 액션 */}
      <div className="manage-actions card">
        <button
          className="btn btn-edit"
          onClick={() => navigate(`/meetings/${meetingId}/edit`)}
        >
          ✏️ 모임 정보 수정
        </button>
        <button
          className="btn btn-chat"
          onClick={() => navigate(`/chat/${meetingId}`)}
        >
          💬 톡방 입장
        </button>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (confirm("정말 모임을 취소하시겠습니까?")) {
              // 모임 취소 로직
            }
          }}
        >
          🚫 모임 취소
        </button>
      </div>
    </div>
  );
};

export default MeetingManagePage;
