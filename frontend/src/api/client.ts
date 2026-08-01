import axios from "axios";

const RENDER_PROD_URL = "https://ai-calling-7h7q.onrender.com";

const getCache = new Map<string, { data: any, expiry: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute generic cache TTL for <1ms data fetching

export const apiClient = axios.create({
    // Standard routing logic attempts strictly local environment mapping natively.
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
    headers: {
        "Content-Type": "application/json"
    }
});

// Cache Hook Intercepts GET explicitly
const originalGet = apiClient.get;
apiClient.get = async (url: string, config?: any) => {
    const noCache = config?.headers?.['Cache-Control'] === 'no-cache' || config?.params?._forceRefresh;
    const key = url + JSON.stringify(config || {});

    if (!noCache) {
        const cached = getCache.get(key);
        if (cached && Date.now() < cached.expiry) {
            return Promise.resolve(cached.data);
        }
    }

    const response = await originalGet.call(apiClient, url, config);
    if (!noCache) {
        getCache.set(key, { data: response, expiry: Date.now() + CACHE_TTL_MS });
    }
    return response;
};

// Hook mutations to instantly purge the local GET cache to keep arrays fresh
const clearCacheMethods = ['post', 'put', 'patch', 'delete'];
clearCacheMethods.forEach(method => {
    const original = (apiClient as any)[method];
    (apiClient as any)[method] = async (...args: any[]) => {
        getCache.clear();
        return original.apply(apiClient, args);
    };
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
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.warn("JWT Session Security Expired or Missing. Triggering Auto-Logout.");
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
