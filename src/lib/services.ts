import axios, { type AxiosInstance } from "axios";

function makeClient(baseURL: string): AxiosInstance {
  const client = axios.create({ baseURL, timeout: 30000 });

  client.interceptors.request.use((config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401 && typeof window !== "undefined") {
        const url: string = err.config?.url ?? "";
        // Only log out when /users/me rejects the token — that's the definitive
        // "token is invalid" signal. Login failures (POST /auth/login) also return
        // 401 but must not trigger a redirect loop.
        if (url.includes("/v1/users/me")) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("auth-store");
          window.location.href = "/login";
        }
      }
      return Promise.reject(err);
    }
  );

  return client;
}

export const authApi          = makeClient(process.env.NEXT_PUBLIC_AUTH_URL          ?? "http://localhost:8001");
export const complianceApi    = makeClient(process.env.NEXT_PUBLIC_COMPLIANCE_URL    ?? "http://localhost:8002");
export const inspectionApi    = makeClient(process.env.NEXT_PUBLIC_INSPECTION_URL    ?? "http://localhost:8003");
export const violationApi     = makeClient(process.env.NEXT_PUBLIC_VIOLATION_URL     ?? "http://localhost:8004");
export const notificationApi  = makeClient(process.env.NEXT_PUBLIC_NOTIFICATION_URL  ?? "http://localhost:8005");
export const reportApi        = makeClient(process.env.NEXT_PUBLIC_REPORT_URL        ?? "http://localhost:8006");
export const gisApi           = makeClient(process.env.NEXT_PUBLIC_GIS_URL           ?? "http://localhost:8009");
export const aiApi            = makeClient(process.env.NEXT_PUBLIC_AI_URL            ?? "http://localhost:8010");
export const contractorApi    = makeClient(process.env.NEXT_PUBLIC_CONTRACTOR_URL    ?? "http://localhost:8011");
export const productionApi    = makeClient(process.env.NEXT_PUBLIC_PRODUCTION_URL    ?? "http://localhost:8012");
