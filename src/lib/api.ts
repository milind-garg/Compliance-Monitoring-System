import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      const url: string = err.config?.url ?? "";
      if (url.includes("/v1/users/me")) {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
