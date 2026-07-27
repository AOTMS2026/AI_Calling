import axios from "axios";

const RENDER_PROD_URL = "https://ai-calling-7h7q.onrender.com";

export const apiClient = axios.create({
    // Standard routing logic attempts strictly local environment mapping natively.
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
    headers: {
        "Content-Type": "application/json"
    }
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    const orgId = localStorage.getItem("ravan_org_id");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (orgId) {
        config.headers["x-org-id"] = orgId;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Automatic JWT Expiry Purge
        if (error.response && error.response.status === 401) {
            console.warn("JWT Session Security Expired. Triggering Auto-Logout.");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("userRole");
            localStorage.removeItem("ravan_agent_id");
            window.location.href = "/";
            return Promise.reject(error);
        }

        // Automatically check explicitly if the connection drops due to no local Python server
        if (!error.response && error.config && error.config.baseURL === "http://localhost:8000") {
            console.warn("Local Backend Offline... Hot-Swapping seamlessly to Live Render URL.");
            error.config.baseURL = RENDER_PROD_URL;
            return axios.request(error.config);
        }
        return Promise.reject(error);
    }
);
