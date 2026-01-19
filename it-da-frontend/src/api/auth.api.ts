import axios from "axios";
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SessionInfoResponse,
} from "@/types/auth.types";

const apiClient = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const currentPath = window.location.pathname;
    const requestUrl = error.config?.url || "";

    if (error.response?.status === 401) {
      // ✅ 로그인/회원가입 페이지에서는 리다이렉트 안 함
      if (currentPath.includes("/login") || currentPath.includes("/signup")) {
        return Promise.reject(error);
      }

      // ✅ 프로필 조회는 401이 정상일 수 있음 (공개 프로필 조회)
      if (
        requestUrl.includes("/profile/lookup") ||
        requestUrl.includes("/profile/")
      ) {
        return Promise.reject(error);
      }

      // ✅ 인증이 필요한 엔드포인트에서만 리다이렉트
      if (
        requestUrl.includes("/auth/session") ||
        requestUrl.includes("/mypage") ||
        requestUrl.includes("/follow")
      ) {
        console.warn("인증 필요 - 로그인 페이지로 이동");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post("/auth/login", credentials);
    return data;
  },

  signup: async (signupData: SignupRequest): Promise<any> => {
    console.log("=".repeat(50));
    console.log("🌐 API Client에서 서버로 전송하는 데이터:");
    console.log(JSON.stringify(signupData, null, 2));
    console.log("=".repeat(50));

    const { data } = await apiClient.post("/users/signup", signupData);
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  checkSession: async (): Promise<SessionInfoResponse> => {
    const { data } = await apiClient.get("/auth/session");
    return data;
  },
};

export default apiClient;
