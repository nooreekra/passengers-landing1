import axiosInstance from "@/shared/api/axiosInstance";

import {PromoTable} from "@/features/promo/model/types";
import {ApiIncentivePayload} from "@/entities/promo/types";

const now = new Date();
const oneWeekAgo = new Date(now);
oneWeekAgo.setDate(now.getDate() - 7);

const twoWeeksLater = new Date(now);
twoWeeksLater.setDate(now.getDate() + 14);

const travelStart = new Date(now);
travelStart.setDate(now.getDate() - 3);

const travelEnd = new Date(now);
travelEnd.setDate(now.getDate() + 10);

export const getPromos = async (
    offset = 0,
    limit = 10,
    searchTerm = "",
    dateRange: { from?: Date; to?: Date } = {}
): Promise<{
    items: PromoTable[];
    total: number;
    offset: number;
    limit: number;
}> => {
    const params: Record<string, string | number | boolean | undefined> = {
        offset,
        limit,
        name: searchTerm,
        type: "Airline",
    };

    if (dateRange.from) {
        params.bookingFrom = dateRange.from.toISOString();
    }

    if (dateRange.to) {
        params.bookingTo = dateRange.to.toISOString();
    }

    const { data } = await axiosInstance.get("/api/promos", { params });
    return data;
};

export const getPartnershipPromos = async (
    offset = 0,
    limit = 10,
    searchTerm = "",
    dateRange: { from?: Date; to?: Date } = {}
): Promise<{
    items: PromoTable[];
    total: number;
    offset: number;
    limit: number;
}> => {
    const params: Record<string, string | number | boolean | undefined> = {
        offset,
        limit,
        name: searchTerm,
        type: "Partner",
    };

    if (dateRange.from) {
        params.bookingFrom = dateRange.from.toISOString();
    }

    if (dateRange.to) {
        params.bookingTo = dateRange.to.toISOString();
    }

    const { data } = await axiosInstance.get("/api/promos", { params });
    return data;
};

export const getPromoById = async (promoId: string) => {
    const res = await axiosInstance.get(`/api/promos/${promoId}`);
    return res.data;
};

type CreateAirlinePromoDto = {
    type: "Airline";
    name: string;
    description: string;
    ruleDescription: string;
    imageUri?: string;
    businessId: string;
};

type CreatePartnerPromoDto = {
    type: "Partner";
    name: string;
    description: string;
    ruleDescription: string;
    images: { imageUri: string; isMobile: boolean }[];
    businessId: string;
};

export type CreatePromoDto = CreateAirlinePromoDto | CreatePartnerPromoDto;

export const createPromo = async (payload: CreatePromoDto) => {
    const { data } = await axiosInstance.post("/api/promos", payload);
    return data;
};

export interface UpdatePromoDto {
    name: string;
    description: string;
    ruleDescription: string;
    imageUri?: string;
}

export const updatePromo = async (promoId: string, payload: UpdatePromoDto) => {
    // API ожидает явное указание типа для Airline
    const body = { type: "Airline" as const, ...payload } as any;
    const { data } = await axiosInstance.put(`/api/promos/${promoId}`, body);
    return data;
};

// Partner update: supports images array (desktop/mobile)
export type UpdatePartnerPromoDto = {
    type: "Partner";
    name: string;
    description: string;
    ruleDescription: string;
    images: { imageUri: string; isMobile: boolean }[];
};

export const updatePartnerPromo = async (promoId: string, payload: UpdatePartnerPromoDto) => {
    const { data } = await axiosInstance.put(`/api/promos/${promoId}`, payload);
    return data;
};

export const updateTargetAudiences = async (
    promoId: string | number,
    payload: {
        countries: string[] | string;
        cities: string[] | string;
        businesses: string[] | string;
    }
) => {
    const body = { type: "Airline" as const, ...payload } as any;
    return await axiosInstance.patch(`/api/promos/${promoId}/target-audience`, body);
};

export const updatePromoRules = async (
    promoId: string | number,
    payload: {
        bookingFrom: string;
        bookingTo: string;
        travelFrom: string;
        travelTo: string;
        originCountries: string[] | string;
        originCities: string[] | string;
        destinationCountries: string[] | string;
        destinationCities: string[] | string;
        flightNumbers: string[];
        interlinePartners: boolean;
        codesharePartners: boolean;
        internationalOnly: boolean;
    }
) => {
    const body = { type: "Airline" as const, ...payload } as any;
    return await axiosInstance.patch(`/api/promos/${promoId}/rule`, body);
};

export const getFlights = async (businessId: string) => {
    const res = await axiosInstance.get(`/api/flight-numbers/${businessId}`);
    return res.data;
};

export const updatePromoRewards = async (
    promoId: string,
    payload: ApiIncentivePayload
) => {
    const body = { type: "Airline" as const, ...payload } as any;
    const res = await axiosInstance.patch(`/api/promos/${promoId}/rewards`, body);
    return res.data;
};

// Partner: simple loyalty rewards payload
export const updatePartnerPromoRewards = async (
    promoId: string,
    payload: {
        type: "Partner";
        rewards: Array<{
            status: "Universal" | "Bronze" | "Silver" | "Gold" | "Platinum";
            value: number;
            valueType: "Fixed" | "Percentage";
        }>;
    }
) => {
    const res = await axiosInstance.patch(`/api/promos/${promoId}/rewards`, payload);
    return res.data;
};

export const getBookingSegments = async (
    promoId: string,
    searchQuery?: string,
    bookingFrom?: string,
    bookingTo?: string,
    offset: number = 0,
    limit: number = 100,
    sortBy?: string
) => {
    const params: {
        searchQuery?: string;
        bookingFrom?: string;
        bookingTo?: string;
        offset: number;
        limit: number;
        sortBy?: string;
        type?: string;
    } = {
        searchQuery,
        bookingFrom,
        bookingTo,
        offset,
        limit,
        sortBy,
        type: "Airline",
    };

    const { data } = await axiosInstance.get(`/api/promos/${promoId}/transactions`, { params });
    return data;
};

// Partner-specific transactions (different response shape)
export const getPartnerTransactions = async (
    promoId: string,
    searchQuery?: string,
    bookingFrom?: string,
    bookingTo?: string,
    offset: number = 0,
    limit: number = 100,
    sortBy?: string
) => {
    const params: {
        searchQuery?: string;
        bookingFrom?: string;
        bookingTo?: string;
        offset: number;
        limit: number;
        sortBy?: string;
        type: string;
    } = {
        searchQuery,
        bookingFrom,
        bookingTo,
        offset,
        limit,
        sortBy,
        type: "Partner",
    };

    const { data } = await axiosInstance.get(`/api/promos/${promoId}/transactions`, { params });
    return data;
};

export const deletePromo = async (promoId: string) => {
    await axiosInstance.delete(`/api/promos/${promoId}`);
};

// Update promo status (Airline and Partner)
export type PromoStatus = "Unpublished" | "Active" | "Completed";

export const updatePromoStatus = async (
    promoId: string,
    status: PromoStatus
) => {
    const { data } = await axiosInstance.patch(`/api/promos/${promoId}/status`, { status });
    return data;
};

// Partnership specific functions
export const updatePartnershipPromoRules = async (
    promoId: string | number,
    payload: {
        type: "Partner";
        startDate: string;
        endDate: string;
        targetCountries: string[] | string;
    }
) => {
    return await axiosInstance.patch(`/api/promos/${promoId}/rule`, payload);
};

export const updatePartnershipTargetAudience = async (
    promoId: string | number,
    payload: {
        countries: string[] | string;
        cities: string[] | string;
        businesses: string[] | string;
    }
) => {
    return await axiosInstance.patch(`/api/promos/${promoId}/target-audience`, payload);
};