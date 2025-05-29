import axios from "axios";

let csrfToken: string | null = null;

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const method = config.method?.toUpperCase() || "GET";

    // Only fetch CSRF token for state-changing methods
    const needsCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    if (needsCsrf) {
      // If no token is cached, fetch it
      if (!csrfToken) {
        try {
          const res = await axiosInstance.get("/api/csrf-token");
          csrfToken = res.data.csrfToken;
        } catch (error) {
          console.error("Failed to fetch CSRF token:", error);
          return Promise.reject(error);
        }
      }

      // Inject token into header
      if (csrfToken) {
        console.log("Injecting CSRF token header:", csrfToken);
        config.headers["X-CSRF-TOKEN"] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
