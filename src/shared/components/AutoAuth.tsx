"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

import { setTokens, clearTokens } from "@/store/slices/authSlice";
import { setBusiness } from "@/store/slices/businessSlice";
import { setUser } from "@/store/slices/userSlice";
import { getMe } from "@/shared/api/auth";
import { getCurrentBusiness } from "@/shared/api/business";

const roleToPath: Record<string, string> = {
    TravelAgent: "/dashboard/agent",
    TravelAgency: "/dashboard/agency",
    Airline: "/dashboard/airline",
    Partnership: "/dashboard/partnership",
    Passenger: "/passenger",
};

// Функция для декодирования JWT токена
const decodeJWT = (token: string): any => {
    try {
        const [, payload] = token.split(".");
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
};

export default function AutoAuth() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const [hasProcessed, setHasProcessed] = useState(false);

    useEffect(() => {
        if (hasProcessed) return;

        const accessToken = searchParams?.get("accessToken");
        const refreshToken = searchParams?.get("refreshToken");

        if (!accessToken || !refreshToken) {
            setHasProcessed(true);
            return;
        }

        const processAuth = async () => {
            try {
                // Декодируем токен для получения информации о пользователе
                const decoded = decodeJWT(accessToken);
                if (!decoded) {
                    throw new Error("Invalid token");
                }

                // Сохраняем токены в Redux
                dispatch(setTokens({ accessToken, refreshToken }));

                // Получаем данные пользователя
                const user = await getMe();
                dispatch(setUser(user));

                // Пассажиры не имеют бизнеса, пропускаем запрос
                if (user.role.type !== "Passenger") {
                    let business = null;
                    try {
                        business = await getCurrentBusiness();
                    } catch (_) {
                        if (user.role.type !== "TravelAgent") {
                            throw _;
                        }
                    }
                    if (business) {
                        dispatch(setBusiness(business));
                    }
                }

                // Сохраняем сессию в cookies через API
                await fetch("/api/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ accessToken, role: user.role.type }),
                    credentials: "include",
                });

                // Перенаправляем на соответствующий дашборд
                const path = roleToPath[user.role.type] ?? "/";
                router.replace(path);
                toast.success(t("auth.loginSuccessful") || "Login successful!");
            } catch (error) {
                console.error("AutoAuth error:", error);
                dispatch(clearTokens());
                toast.error(t("auth.autoAuthFailed") || "Auto authentication failed");
            } finally {
                setHasProcessed(true);
            }
        };

        void processAuth();
    }, [searchParams, dispatch, router, t, hasProcessed]);

    return null;
}

















