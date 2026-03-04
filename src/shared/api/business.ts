import axiosInstance from "./axiosInstance";
import { Business, UpdateBusinessPayload } from "@/entities/business/types";

export const getCurrentBusiness = async (): Promise<Business> => {
    const { data } = await axiosInstance.get<Business>("/api/businesses/me");
    return data;
};

export const getBusiness = async (id: string): Promise<Business> => {
    const { data } = await axiosInstance.get<Business>(`/api/businesses/${id}`);
    return data;
};

export const updateBusiness = async (id: string, payload: UpdateBusinessPayload): Promise<Business> => {
    const { data } = await axiosInstance.put<Business>(`/api/businesses/${id}`, payload);
    return data;
};
