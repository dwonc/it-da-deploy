import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || "https://api.it-da.cloud";

export default axios;
