
import axios from "axios";

const BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:8080";

const apiClient = axios.create({
    baseURL: BASE_URL,
});

apiClient.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem("accessToken");

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    }
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {

        const originalRequest = error.config;

        console.log("ERROR STATUS:",
            error.response?.status);

        console.log("URL:",
            error.config?.url);

        if (

            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes("/auth/login") &&
            !originalRequest.url.includes("/auth/refresh")
        ) {

            originalRequest._retry = true;

            try {

                const refreshToken =
                    localStorage.getItem("refreshToken");

                const refreshResponse =
                    await axios.post(
                        `${BASE_URL}/api/v1/auth/refresh`,
                        {
                            refreshToken,
                        }
                    );

                const {
                    accessToken,
                    refreshToken: newRefreshToken,
                } = refreshResponse.data.data;

                localStorage.setItem(
                    "accessToken",
                    accessToken
                );

                localStorage.setItem(
                    "refreshToken",
                    newRefreshToken
                );

                originalRequest.headers.Authorization =
                    `Bearer ${accessToken}`;

                return apiClient(originalRequest);

            } catch (refreshError) {

                localStorage.clear();

                window.location.href = "/login";

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;