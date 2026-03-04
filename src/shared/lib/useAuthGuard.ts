import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import axiosInstance from "@/shared/api/axiosInstance";
import { clearTokens, setTokens } from "@/store/slices/authSlice";
import { RootState } from "@/store";

export function useAuthGuard() {
    const dispatch = useDispatch();
    const router = useRouter();
    const accessToken = useSelector((state: RootState) => state.auth.accessToken);
    const refreshToken = useSelector((state: RootState) => state.auth.refreshToken);

    useEffect(() => {
        if (!accessToken) {
            dispatch(clearTokens());
            router.replace("/");
            return;
        }

        const isExpired = (token?: string) => {
            if (!token) return true;
            try {
                const [, payload] = token.split(".");
                const { exp } = JSON.parse(atob(payload));
                return Date.now() >= exp * 1000;
            } catch {
                return true;
            }
        };

        // Если токен истек, пытаемся обновить его только если есть refreshToken
        if (isExpired(accessToken)) {
            if (!refreshToken) {
                // Если токен истек и нет refreshToken, перенаправляем на главную
                dispatch(clearTokens());
                router.replace("/");
                return;
            }

            axiosInstance.post("/api/auth/refresh-token", {
                refreshToken
            })
                .then((res) => {
                    const { accessToken: newAccess, refreshToken: newRefresh } = res.data;
                    dispatch(setTokens({ accessToken: newAccess, refreshToken: newRefresh }));
                })
                .catch(() => {
                    dispatch(clearTokens());
                    router.replace("/");
                });
        }
        // Если токен валиден, разрешаем доступ даже без refreshToken
        // Это позволяет работать автоматической авторизации через внешний сайт
    }, [accessToken, refreshToken, dispatch, router]);
}
