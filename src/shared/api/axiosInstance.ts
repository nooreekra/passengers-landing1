import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { store } from "@/store";
import { setTokens, clearTokens } from "@/store/slices/authSlice";
import { logout } from "@/shared/api/auth";
import i18n from "@/shared/i18n";

let isRefreshing = false;
let requestQueue: Array<(value?: unknown) => void> = [];

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

axiosInstance.interceptors.request.use((config) => {
    const token = store.getState().auth.accessToken;
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Добавляем заголовок Accept-Language для всех запросов
    if (config.headers) {
        const currentLanguage = i18n.language || 'en';
        const languageCode = currentLanguage === 'ru' ? 'ru-RU' : 'en-US';
        config.headers['Accept-Language'] = languageCode;
    }
    
    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = store.getState().auth.refreshToken;

            if (!refreshToken) {
                await handleUnauthorized();
                return Promise.reject(error);
            }

            try {
                if (!isRefreshing) {
                    isRefreshing = true;

                    const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`, {
                        refreshToken,
                    });

                    const { accessToken, refreshToken: newRefreshToken } = res.data;
                    store.dispatch(setTokens({ accessToken, refreshToken: newRefreshToken }));

                    isRefreshing = false;

                    requestQueue.forEach((cb) => cb());
                    requestQueue = [];

                } else {
                    await new Promise((resolve) => requestQueue.push(resolve));
                }

                const token = store.getState().auth.accessToken;
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    // Добавляем заголовок Accept-Language для повторного запроса
                    const currentLanguage = i18n.language || 'en';
                    const languageCode = currentLanguage === 'ru' ? 'ru-RU' : 'en-US';
                    originalRequest.headers['Accept-Language'] = languageCode;
                }

                return axiosInstance(originalRequest);

            } catch (err) {
                isRefreshing = false;
                requestQueue = [];
                await handleUnauthorized();
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

async function handleUnauthorized() {
    const refreshToken = store.getState().auth.refreshToken;

    store.dispatch(clearTokens());

    if (refreshToken) {
        try {
            await logout(refreshToken);
        } catch (e) {
            console.warn("Logout request failed", e);
        }
    }
}

export default axiosInstance;
