import axios from 'axios';
import { store } from "@/app/store";
const axiosInstance = axios.create({
  baseURL: import.meta.env.PUBLIC_BACKEND_URL,
  withCredentials: true
});
axiosInstance.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isLogin = String(error?.config?.url || "").includes("auth/login");
    if (error?.response?.status == 401 && !isLogin && store.getState().auth.token) {
      const { clearCredentials, persistor } = await import("@/app/store");
      store.dispatch(clearCredentials());
      await persistor.purge();
      window.location.hash = "#/login";
    }
    return Promise.reject(error);
  }
);
export default axiosInstance;