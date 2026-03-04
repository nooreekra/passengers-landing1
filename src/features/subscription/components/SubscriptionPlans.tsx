"use client";

import React, { useState, useEffect } from "react";
import { SubscriptionPlan, Subscription } from "@/entities/subscription/types";
import { subscriptionApi } from "../api/subscriptions";
import { Button } from "@/shared/ui/Button";
import Loader from "@/shared/ui/Loader";
import ConfirmModal from "@/shared/ui/ConfirmModal";
import { useTranslation } from "react-i18next";
import { isSubscriptionActive, canUnsubscribe } from "@/shared/lib/subscriptionUtils";

interface SubscriptionPlansProps {
    businessId: string;
    onSubscriptionChange?: () => void;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
    businessId,
    onSubscriptionChange,
}) => {
    const { t, i18n } = useTranslation();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState<string | null>(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [unsubscribingPlan, setUnsubscribingPlan] = useState<Subscription | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const [plansData, subscriptionsData] = await Promise.all([
                subscriptionApi.getPlans(businessId, i18n.language),
                subscriptionApi.getSubscriptions(businessId, i18n.language),
            ]);
            setPlans(plansData);
            setSubscriptions(subscriptionsData);
        } catch (error) {
            console.error("Ошибка загрузки данных подписок:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [businessId, i18n.language]);

    const handleSubscribe = async (planId: string) => {
        try {
            setSubscribing(planId);
            await subscriptionApi.subscribe(businessId, { planId }, i18n.language);
            await loadData();
            onSubscriptionChange?.();
        } catch (error) {
            console.error("Ошибка подписки:", error);
        } finally {
            setSubscribing(null);
        }
    };

    const handleUnsubscribeClick = (subscription: Subscription) => {
        setUnsubscribingPlan(subscription);
        setConfirmModalOpen(true);
    };

    const handleUnsubscribe = async () => {
        if (!unsubscribingPlan) return;
        
        try {
            setSubscribing(unsubscribingPlan.id);
            await subscriptionApi.unsubscribe(businessId, { subscriptionId: unsubscribingPlan.id }, i18n.language);
            await loadData();
            onSubscriptionChange?.();
            setConfirmModalOpen(false);
            setUnsubscribingPlan(null);
        } catch (error) {
            console.error("Ошибка отписки:", error);
        } finally {
            setSubscribing(null);
        }
    };

    const isSubscribed = (planId: string) => {
        return subscriptions.some(sub => sub.plan.id === planId && isSubscriptionActive(sub));
    };

    const getActiveSubscription = (planId: string) => {
        return subscriptions.find(sub => sub.plan.id === planId && isSubscriptionActive(sub));
    };

    const getSubscriptionForPlan = (planId: string) => {
        return subscriptions.find(sub => sub.plan.id === planId);
    };

    // Получает подписку с endDate в будущем (даже если isActive false)
    const getSubscriptionWithEndDate = (planId: string) => {
        return subscriptions.find(sub => {
            if (sub.plan.id !== planId || sub.endDate === null) {
                return false;
            }
            // Проверяем, что endDate в будущем относительно asOfUtc
            const endDate = new Date(sub.endDate);
            const referenceTime = new Date(sub.asOfUtc);
            return endDate > referenceTime;
        });
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t("subscription.plans.title")}</h2>
            
            <div className="flex flex-wrap justify-start gap-6">
                {plans.map((plan) => {
                    const subscribed = isSubscribed(plan.id);
                    const activeSubscription = getActiveSubscription(plan.id);
                    const subscriptionForPlan = getSubscriptionForPlan(plan.id);
                    const subscriptionWithEndDate = getSubscriptionWithEndDate(plan.id);
                    const isProcessing = subscribing === plan.id || subscribing === activeSubscription?.id;

                    return (
                        <div
                            key={plan.id}
                            className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow flex flex-col w-80 h-96"
                        >
                            <div className="flex-1 flex flex-col">
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2 h-12 leading-6 overflow-hidden">
                                        {plan.name}
                                    </h3>
                                    <p className="text-sm text-blue-600 font-bold">
                                        {plan.description}
                                    </p>
                                </div>
                                <div className="space-y-2 flex-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">{t("subscription.plans.baseFee")}:</span>
                                        <span className="font-bold">
                                            {plan.baseFee} {plan.currencyCode}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                {subscribed ? (
                                    <div className="space-y-2">
                                        <div className="text-sm text-green-600 font-medium">
                                            ✓ {t("subscription.plans.subscribed")}
                                        </div>
                                        {activeSubscription && (
                                            <div className="space-y-1">
                                                <div className="text-xs text-gray-500">
                                                    {t("subscription.plans.startDate")}: {new Date(activeSubscription.startDate).toLocaleDateString()}
                                                </div>
                                                {activeSubscription.endDate && (
                                                    <div className="text-xs text-gray-500">
                                                        {t("subscription.plans.endDate")}: {new Date(activeSubscription.endDate).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {canUnsubscribe(activeSubscription!) && (
                                            <Button
                                                onClick={() => handleUnsubscribeClick(activeSubscription!)}
                                                disabled={isProcessing}
                                                variant="outline"
                                                className="w-full border-red-500 text-red-600 hover:bg-red-50 text-sm px-4 py-2"
                                            >
                                                {isProcessing ? t("subscription.plans.unsubscribing") : t("subscription.plans.unsubscribe")}
                                            </Button>
                                        )}
                                    </div>
                                ) : subscriptionWithEndDate && !subscriptionWithEndDate.isActive ? (
                                    // Есть подписка с endDate, но isActive false - подписка еще действует, показываем дату окончания
                                    <div className="space-y-2">
                                        <div className="text-sm text-green-600 font-medium">
                                            ✓ {t("subscription.plans.subscribed")}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-xs text-gray-500">
                                                {t("subscription.plans.startDate")}: {new Date(subscriptionWithEndDate.startDate).toLocaleDateString()}
                                            </div>
                                            {subscriptionWithEndDate.endDate && (
                                                <div className="text-xs text-gray-500">
                                                    {t("subscription.plans.endDate")}: {new Date(subscriptionWithEndDate.endDate).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : subscriptionForPlan ? (
                                    // Есть подписка, но она истекла - можно подписаться заново
                                    <Button
                                        onClick={() => handleSubscribe(plan.id)}
                                        disabled={isProcessing}
                                        className="w-full text-sm px-4 py-2"
                                    >
                                        {isProcessing ? t("subscription.plans.subscribing") : t("subscription.plans.subscribe")}
                                    </Button>
                                ) : (
                                    // Нет подписки - можно подписаться
                                    <Button
                                        onClick={() => handleSubscribe(plan.id)}
                                        disabled={isProcessing}
                                        className="w-full text-sm px-4 py-2"
                                    >
                                        {isProcessing ? t("subscription.plans.subscribing") : t("subscription.plans.subscribe")}
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <ConfirmModal
                open={confirmModalOpen}
                title={t("subscription.unsubscribe.title")}
                text={t("subscription.unsubscribe.message")}
                confirmText={t("subscription.plans.unsubscribe")}
                cancelText={t("common.cancel")}
                loading={subscribing === unsubscribingPlan?.id}
                danger={true}
                onConfirm={handleUnsubscribe}
                onClose={() => {
                    setConfirmModalOpen(false);
                    setUnsubscribingPlan(null);
                }}
            />
        </div>
    );
};
