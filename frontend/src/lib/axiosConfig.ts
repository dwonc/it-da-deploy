import axios from "axios";

// axios 전역 설정
axios.defaults.withCredentials = true;
axios.defaults.baseURL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export default axios;
