"use client";

import React, { useState, useEffect } from "react";
import { Subscription } from "@/entities/subscription/types";
import { subscriptionApi } from "../api/subscriptions";
import { Button } from "@/shared/ui/Button";
import Loader from "@/shared/ui/Loader";
import ConfirmModal from "@/shared/ui/ConfirmModal";
import { useTranslation } from "react-i18next";
import { isSubscriptionActive, getSubscriptionStatus, canUnsubscribe } from "@/shared/lib/subscriptionUtils";

interface ActiveSubscriptionsProps {
    businessId: string;
    onSubscriptionChange?: () => void;
}

export const ActiveSubscriptions: React.FC<ActiveSubscriptionsProps> = ({
    businessId,
    onSubscriptionChange,
}) => {
    const { t, i18n } = useTranslation();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [unsubscribing, setUnsubscribing] = useState<string | null>(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [unsubscribingSubscription, setUnsubscribingSubscription] = useState<Subscription | null>(null);

    const loadSubscriptions = async () => {
        try {
            setLoading(true);
            const data = await subscriptionApi.getSubscriptions(businessId, i18n.language);
            setSubscriptions(data);
        } catch (error) {
            console.error("Ошибка загрузки подписок:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubscriptions();
    }, [businessId, i18n.language]);

    const handleUnsubscribeClick = (subscription: Subscription) => {
        setUnsubscribingSubscription(subscription);
        setConfirmModalOpen(true);
    };

    const handleUnsubscribe = async () => {
        if (!unsubscribingSubscription) return;
        
        try {
            setUnsubscribing(unsubscribingSubscription.id);
            await subscriptionApi.unsubscribe(businessId, { subscriptionId: unsubscribingSubscription.id }, i18n.language);
            await loadSubscriptions();
            onSubscriptionChange?.();
            setConfirmModalOpen(false);
            setUnsubscribingSubscription(null);
        } catch (error) {
            console.error("Ошибка отписки:", error);
        } finally {
            setUnsubscribing(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("ru-RU", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat("ru-RU", {
            style: "currency",
            currency: currency,
        }).format(amount);
    };

    if (loading) {
        return <Loader />;
    }

    // Показываем активные подписки и подписки с endDate в будущем (даже если isActive false)
    const activeSubscriptions = subscriptions.filter(sub => {
        if (isSubscriptionActive(sub)) {
            return true;
        }
        // Если есть endDate но isActive false, проверяем что endDate в будущем
        if (sub.endDate !== null && !sub.isActive) {
            const endDate = new Date(sub.endDate);
            const referenceTime = new Date(sub.asOfUtc);
            return endDate > referenceTime;
        }
        return false;
    });

    if (activeSubscriptions.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">{t("subscription.subscriptions.noSubscriptions")}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t("subscription.subscriptions.title")}</h2>
            
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t("subscription.subscriptions.plan")}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t("subscription.subscriptions.baseFee")}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t("subscription.subscriptions.startDate")}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t("subscription.subscriptions.endDate")}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t("subscription.subscriptions.status")}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t("subscription.subscriptions.actions")}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {activeSubscriptions.map((subscription) => (
                                <tr key={subscription.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {subscription.plan.value}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatCurrency(subscription.baseFee, subscription.currencyCode)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(subscription.startDate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {subscription.endDate ? formatDate(subscription.endDate) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {(() => {
                                            const status = getSubscriptionStatus(subscription);
                                            if (status === 'active') {
                                                return (
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                        {t("subscription.subscriptions.active")}
                                                    </span>
                                                );
                                            } else if (status === 'expired') {
                                                return (
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                        {t("subscription.subscriptions.expired")}
                                                    </span>
                                                );
                                            } else {
                                                return (
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                        {t("subscription.subscriptions.inactive")}
                                                    </span>
                                                );
                                            }
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {canUnsubscribe(subscription) ? (
                                            <Button
                                                onClick={() => handleUnsubscribeClick(subscription)}
                                                disabled={unsubscribing === subscription.id}
                                                variant="outline"
                                                className="border-red-500 text-red-600 hover:bg-red-50 text-sm px-4 py-2"
                                            >
                                                {unsubscribing === subscription.id ? t("subscription.plans.unsubscribing") : t("subscription.plans.unsubscribe")}
                                            </Button>
                                        ) : (
                                            <span className="text-gray-400 text-sm">
                                                {t("subscription.subscriptions.noAction")}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal
                open={confirmModalOpen}
                title={t("subscription.unsubscribe.title")}
                text={t("subscription.unsubscribe.message")}
                confirmText={t("subscription.plans.unsubscribe")}
                cancelText={t("common.cancel")}
                loading={unsubscribing === unsubscribingSubscription?.id}
                danger={true}
                onConfirm={handleUnsubscribe}
                onClose={() => {
                    setConfirmModalOpen(false);
                    setUnsubscribingSubscription(null);
                }}
            />
        </div>
    );
};
