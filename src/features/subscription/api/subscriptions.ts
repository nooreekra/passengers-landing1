import { getBusinessPlans, getBusinessSubscriptions, subscribeToPlan, unsubscribeFromPlan } from "@/shared/api/subscriptions";
import { SubscriptionPlan, Subscription, SubscribePayload, UnsubscribePayload } from "@/entities/subscription/types";

export const subscriptionApi = {
    getPlans: (businessId: string, language?: string) => getBusinessPlans(businessId, language),
    getSubscriptions: (businessId: string, language?: string) => getBusinessSubscriptions(businessId, language),
    subscribe: (businessId: string, payload: SubscribePayload, language?: string) => subscribeToPlan(businessId, payload, language),
    unsubscribe: (businessId: string, payload: UnsubscribePayload, language?: string) => unsubscribeFromPlan(businessId, payload, language),
};

export type { SubscriptionPlan, Subscription, SubscribePayload, UnsubscribePayload };
