import axiosInstance from "./axiosInstance";
import { SubscriptionPlan, Subscription, SubscribePayload, UnsubscribePayload } from "@/entities/subscription/types";

const getLanguageHeader = (language: string = 'en') => {
    return language === 'ru' ? 'ru-RU' : 'en-US';
};

export const getBusinessPlans = async (businessId: string, language: string = 'en'): Promise<SubscriptionPlan[]> => {
    const { data } = await axiosInstance.get<SubscriptionPlan[]>(`/api/businesses/${businessId}/plans`, {
        headers: {
            'Accept-Language': getLanguageHeader(language)
        }
    });
    return data;
};

export const getBusinessSubscriptions = async (businessId: string, language: string = 'en'): Promise<Subscription[]> => {
    const { data } = await axiosInstance.get<Subscription[]>(`/api/businesses/${businessId}/subscriptions`, {
        headers: {
            'Accept-Language': getLanguageHeader(language)
        }
    });
    return data;
};

export const subscribeToPlan = async (businessId: string, payload: SubscribePayload, language: string = 'en'): Promise<Subscription> => {
    const { data } = await axiosInstance.post<Subscription>(`/api/businesses/${businessId}/subscribe/${payload.planId}`, {}, {
        headers: {
            'Accept-Language': getLanguageHeader(language)
        }
    });
    return data;
};

export const unsubscribeFromPlan = async (businessId: string, payload: UnsubscribePayload, language: string = 'en'): Promise<Subscription> => {
    const { data } = await axiosInstance.post<Subscription>(`/api/businesses/${businessId}/unsubscribe/${payload.subscriptionId}`, {}, {
        headers: {
            'Accept-Language': getLanguageHeader(language)
        }
    });
    return data;
};
