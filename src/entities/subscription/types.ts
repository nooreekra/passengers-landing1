export type UUID = string;

export interface SubscriptionPlan {
    id: UUID;
    code: string;
    name: string;
    description: string;
    baseFee: number;
    variableRate: number;
    overrideId: string | null;
    effectiveFrom: string | null;
    effectiveTo: string | null;
    asOfUtc: string;
    currencyCode: string;
}

export interface BusinessReference {
    id: UUID;
    value: string;
}

export interface PlanReference {
    id: UUID;
    value: string;
}

export interface Subscription {
    id: UUID;
    createdAt: string;
    business: BusinessReference;
    plan: PlanReference;
    baseFee: number;
    variableFee: number;
    startDate: string;
    endDate: string | null;
    isActive: boolean;
    asOfUtc: string;
    currencyCode: string;
}

export interface SubscribePayload {
    planId: UUID;
}

export interface UnsubscribePayload {
    subscriptionId: UUID;
}
