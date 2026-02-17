import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import axios from "axios";
import { useChatStore } from "@/stores/useChatStore";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_URL ??
  "http://localhost:8080";
const WEBSOCKET_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080"; // ✅ 추가

// ✅ metadata를 위한 구체적 타입 정의 (any 제거)
export interface ChatMessage {
  messageId: number;
  senderId: number;
  senderNickname: string;
  content: string;
  type: "TALK" | "IMAGE" | "POLL" | "BILL" | "LOCATION" | "NOTICE" | "READ";
  sentAt: string;
  metadata?: Record<string, unknown> | null;
}

class ChatApi {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private isConnected: boolean = false; // ✅ 추가

  async getRooms() {
    const response = await axios.get(`${API_BASE_URL}/api/social/chat/rooms`, {
      withCredentials: true,
    });
    return response.data;
  }

  async getChatMessages(
    roomId: number,
    page: number = 0,
    size: number = 50,
  ): Promise<ChatMessage[]> {
    const response = await axios.get(
      `${API_BASE_URL}/api/social/messages/${roomId}`,
      {
        params: { page, size },
        withCredentials: true,
      },
    );
    return response.data;
  }

  async followUser(followingId: number) {
    const response = await axios.post(
      `${API_BASE_URL}/api/social/follow/${followingId}`,
      {},
      { withCredentials: true },
    );
    return response.data;
  }

  connect(
    roomId: number,
    userEmail: string,
    onMessageReceived: (message: any) => void,
  ) {
    if (this.client?.connected) {
      console.log("✅ 이미 WebSocket 연결됨");
      this.isConnected = true;

      // ✅ 1. 기존 구독 해제
      if (this.subscription) {
        this.subscription.unsubscribe();
        console.log("🗑️ 기존 구독 해제");
      }

      // ✅ 2. 새로 구독
      this.subscription = this.client.subscribe(
        `/topic/room/${roomId}`,
        (message) => {
          try {
            const parsedMessage = JSON.parse(message.body);
            console.log("📨 메시지 수신:", parsedMessage);
            onMessageReceived(parsedMessage);
          } catch (error) {
            console.error("❌ 메시지 파싱 실패:", error);
          }
        },
      );
      console.log("📡 채팅방 구독 완료:", roomId);

      // ✅ 3. JOIN 신호 전송
      this.client.publish({
        destination: `/app/chat/join/${roomId}`,
        body: JSON.stringify({ email: userEmail }),
      });
      console.log("🔔 JOIN 신호 전송:", roomId);

      // ✅ 4. 잠시 대기 후 READ 신호 전송
      setTimeout(() => {
        this.sendReadEvent(roomId, userEmail);
      }, 100);

      return;
    }

    this.client = new Client({
      webSocketFactory: () =>
        new SockJS(
          `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/ws`,
        ),
      connectHeaders: {},
      debug: (str) => console.log("STOMP:", str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log("✅ WebSocket 연결 성공");
      this.isConnected = true;

      // ✅ 1. 구독 시작
      this.client!.subscribe(`/topic/room/${roomId}`, (message) => {
        try {
          const parsedMessage = JSON.parse(message.body);
          console.log("📨 메시지 수신:", parsedMessage);
          onMessageReceived(parsedMessage);
        } catch (error) {
          console.error("❌ 메시지 파싱 실패:", error);
        }
      });

      // ✅ 2. JOIN 신호 전송
      this.client!.publish({
        destination: `/app/chat/join/${roomId}`,
        body: JSON.stringify({ email: userEmail }),
      });
      console.log("🔔 JOIN 신호 전송:", roomId);

      // ✅ 3. 잠시 대기 후 READ 신호 전송
      setTimeout(() => {
        this.sendReadEvent(roomId, userEmail);
      }, 100);
    };

    this.client.onStompError = (frame) => {
      console.error("❌ STOMP 에러:", frame.headers["message"]);
      console.error("상세:", frame.body);
      this.isConnected = false;
    };

    this.client.activate();
  }

  /**
   * ✅ READ 신호 전송 (WebSocket만 사용)
   */
  private sendReadEvent(roomId: number, userEmail: string) {
    if (this.client?.connected) {
      this.client.publish({
        destination: `/app/chat/read/${roomId}`,
        body: JSON.stringify({ email: userEmail }),
      });
      console.log("✅ READ 신호 전송:", roomId);
    } else {
      console.warn("⚠️ WebSocket 미연결 - READ 신호 전송 실패");
    }
  }

  disconnect(roomId?: number) {
    // ✅ 1. LEAVE 신호 전송
    if (roomId && this.client?.connected) {
      const storedEmail = localStorage.getItem("userEmail");
      if (storedEmail) {
        this.client.publish({
          destination: `/app/chat/leave/${roomId}`,
          body: JSON.stringify({ email: storedEmail }),
        });
        console.log("👋 LEAVE 신호 전송:", roomId);
      }
    }

    // ✅ 2. 구독 정리
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
      console.log("🗑️ 구독 해제 완료");
    }

    // ✅ 3. 클라이언트 정리
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      console.log("🗑️ WebSocket 클라이언트 정리 완료");
    }

    this.isConnected = false;
  }

  sendMessage(
    roomId: number,
    email: string,
    userId: number,
    content: string,
    type: ChatMessage["type"] = "TALK",
    metadata: Record<string, unknown> | null = null,
  ) {
    if (this.client?.connected) {
      const payload = {
        email: email,
        senderId: userId,
        content: content,
        roomId: roomId,
        type: type,
        metadata: metadata,
      };
      console.log("📤 전송하는 메시지:", payload);
      this.client.publish({
        destination: `/app/chat/send/${roomId}`,
        body: JSON.stringify(payload),
      });
    }
  }

  /**
   * ✅ 읽음 처리 (외부에서 호출용 - 예: 페이지 떠날 때)
   */
  async markAsRead(roomId: number) {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) {
      this.sendReadEvent(roomId, storedEmail);
    }
  }

  async getRoomMembers(roomId: number) {
    const response = await axios.get(
      `${API_BASE_URL}/api/social/chat/rooms/${roomId}/members`,
      { withCredentials: true },
    );
    return response.data;
  }

  async uploadImage(roomId: number, file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      `${API_BASE_URL}/api/social/chat/images/${roomId}`,
      formData,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data.imageUrl;
  }

  async updateNotice(roomId: number, notice: string) {
    await axios.put(
      `${API_BASE_URL}/api/social/chat/rooms/${roomId}/notice`,
      { notice },
      { withCredentials: true },
    );
  }

  async searchUsers(keyword: string) {
    const response = await axios.get(
      `${API_BASE_URL}/api/social/chat/users/search`,
      {
        params: { keyword },
        withCredentials: true,
      },
    );
    return response.data;
  }

  async inviteUser(roomId: number, userId: number) {
    await axios.post(
      `${API_BASE_URL}/api/social/chat/rooms/${roomId}/invite`,
      { targetUserId: userId },
      { withCredentials: true },
    );
  }

  async reportUser(
    reportedId: number,
    reason: string,
    description: string = "",
  ) {
    const response = await axios.post(
      `${API_BASE_URL}/api/reports`,
      {
        reportedType: "USER",
        reportedId: reportedId,
        reason: reason,
        description: description,
      },
      { withCredentials: true },
    );
    return response.data;
  }
}

export const chatApi = new ChatApi();
