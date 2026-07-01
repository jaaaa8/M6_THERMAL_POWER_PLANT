
import apiClient from "./apiClient";

const AUTH_API = "/api/v1/auth";

export const authService = {
        login: async (username, password) => {
            const response = await apiClient.post(
                "/api/v1/auth/login",
                {
                    username,
                    password,
                }
            );

            const data = response.data.data;

            localStorage.setItem(
                "accessToken",
                data.accessToken
            );

            localStorage.setItem(
                "refreshToken",
                data.refreshToken
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            return data;
        },

    refreshToken: async () => {
        const refreshToken =
            localStorage.getItem("refreshToken");

        const response = await apiClient.post(
            `${AUTH_API}/refresh`,
            {
                refreshToken,
            }
        );

        const data = response.data?.data;

        if (data?.accessToken) {
            localStorage.setItem(
                "accessToken",
                data.accessToken
            );

            localStorage.setItem(
                "refreshToken",
                data.refreshToken
            );
        }

        return data;
    },

    logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        window.location.href = "/login";
    },

    getCurrentUser: () => {
        const user = localStorage.getItem("user");

        return user ? JSON.parse(user) : null;
    },

    getAccessToken: () => {
        return localStorage.getItem("accessToken");
    },

    isAuthenticated: () => {
        return !!localStorage.getItem("accessToken");
    },
};