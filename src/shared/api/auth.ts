import axios from 'axios';
import axiosInstance from "@/shared/api/axiosInstance";
import {AgentRegisterPayload, MeUser} from "@/entities/auth/types";

export const login = async (email: string, password: string) => {
    const response = await axiosInstance.post("/api/auth/login", {
        email,
        password,
    });

    return response.data;
};

export const logout = async (refreshToken: string) => {
    return axiosInstance.post("/api/auth/logout", {
        refreshToken,
    });
};

export const getMe = async (): Promise<MeUser> => {
    const { data } = await axiosInstance.get<MeUser>("/api/auth/me");
    return data;
};

export async function registerAgent(payload: AgentRegisterPayload): Promise<void> {
    await axiosInstance.post("/api/auth/agent/register", payload);
}

export const changePassword = async (oldPassword: string, newPassword: string) => {
    const response = await axiosInstance.patch("/api/auth/change-password", {
        oldPassword,
        newPassword,
    });
    return response.data;
};