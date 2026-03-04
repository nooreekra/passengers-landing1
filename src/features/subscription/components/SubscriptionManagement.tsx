"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { SubscriptionPlans } from "./SubscriptionPlans";
import { ActiveSubscriptions } from "./ActiveSubscriptions";
import { Button } from "@/shared/ui/Button";
import { useTranslation } from "react-i18next";

interface SubscriptionManagementProps {
    businessId: string;
}

type TabType = "plans" | "subscriptions";

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
    businessId,
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<TabType>("plans");
    const [refreshKey, setRefreshKey] = useState(0);
    const plansTabRef = useRef<HTMLButtonElement>(null);
    const subscriptionsTabRef = useRef<HTMLButtonElement>(null);

    const handleSubscriptionChange = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="space-y-6">
            {/* Табы */}
            <div className="border-b border-gray-200">
                <nav className="relative -mb-px flex space-x-8">
                    <button
                        ref={plansTabRef}
                        onClick={() => setActiveTab("plans")}
                        className={`py-2 px-1 font-medium text-sm ${
                            activeTab === "plans"
                                ? "text-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {t("subscription.plans.title")}
                    </button>
                    <button
                        ref={subscriptionsTabRef}
                        onClick={() => setActiveTab("subscriptions")}
                        className={`py-2 px-1 font-medium text-sm ${
                            activeTab === "subscriptions"
                                ? "text-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {t("subscription.subscriptions.title")}
                    </button>
                    {/* Анимированный индикатор */}
                    <motion.div
                        className="absolute bottom-0 h-0.5 bg-blue-500"
                        initial={false}
                        animate={{
                            left: activeTab === "plans" 
                                ? plansTabRef.current?.offsetLeft || 0 
                                : subscriptionsTabRef.current?.offsetLeft || 0,
                            width: activeTab === "plans"
                                ? plansTabRef.current?.offsetWidth || 0
                                : subscriptionsTabRef.current?.offsetWidth || 0,
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                </nav>
            </div>

            {/* Контент */}
            <div key={refreshKey}>
                {activeTab === "plans" && (
                    <SubscriptionPlans
                        businessId={businessId}
                        onSubscriptionChange={handleSubscriptionChange}
                    />
                )}
                {activeTab === "subscriptions" && (
                    <ActiveSubscriptions
                        businessId={businessId}
                        onSubscriptionChange={handleSubscriptionChange}
                    />
                )}
            </div>
        </div>
    );
};
