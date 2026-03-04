"use client";

import { X } from "lucide-react";
import { Fragment } from "react";
import { Promo } from "@/features/promo/model/types";
import { Dialog } from "@headlessui/react";
import {useTranslation} from "react-i18next";

interface ThresholdRewardsTableProps {
    thresholdReward: {
        id: string;
        promoRewardId: string;
        targetBusinessId: string;
        targetBusinessName: string;
        baselineSegments: number;
        value: number;
        valueType: "Fixed" | "Percentage";
        steps: Array<{
            id: string;
            promoThresholdRewardId: string;
            fromSegments: number;
            toSegments: number | null;
            value: number;
            valueType: "Fixed" | "Percentage";
        }>;
    };
}

function ThresholdRewardsTable({ thresholdReward }: ThresholdRewardsTableProps) {
    const { t } = useTranslation();
    
    // Сортируем шаги по fromSegments для правильного отображения
    const sortedSteps = [...thresholdReward.steps].sort((a, b) => a.fromSegments - b.fromSegments);
    
    return (
        <div className="flex-shrink-0">
            <div className="mb-2 text-xs text-gray-600">
                <strong>{t('promo.travel_agency')}:</strong> <span className="font-bold text-blue-600">{thresholdReward.targetBusinessName}</span>
            </div>
            <table className="w-[250px] border-collapse border border-gray-300 text-xs">
                <thead>
                    <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-2 py-1 text-left font-medium text-xs">
                            {t('promo.from')}
                        </th>
                        <th className="border border-gray-300 px-2 py-1 text-left font-medium text-xs">
                            {t('promo.to')}
                        </th>
                        <th className="border border-gray-300 px-2 py-1 text-left font-medium text-xs">
                            {t('promo.rewards')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {/* Baseline row */}
                    <tr>
                        <td className="border border-gray-300 px-2 py-1 text-xs font-medium">
                            {t('promo.baseline')}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 font-medium text-xs">
                            {thresholdReward.baselineSegments}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-xs">
                            {thresholdReward.value}%
                        </td>
                    </tr>
                    
                    {/* Threshold steps */}
                    {sortedSteps.map((step, index) => (
                        <tr key={step.id}>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-xs">
                                {step.fromSegments}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 font-medium text-xs">
                                {step.toSegments === null ? '∞' : step.toSegments}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-xs">
                                {step.value}%
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    promo: Promo;
}

export default function PromoRulesModal({ promo, isOpen, onClose }: Props) {
    const {t} = useTranslation();

    return (
        <Dialog open={isOpen} onClose={onClose} as={Fragment}>
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4 rounded-xl">
                <Dialog.Panel className="bg-white rounded-xl p-6 w-full max-w-3xl relative max-h-[70vh] overflow-y-auto">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-500">
                        <X className="w-5 h-5" />
                    </button>

                    <Dialog.Title className="text-xl font-semibold text-center mb-6">
                        {t('promo.promo_rules')}
                    </Dialog.Title>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium mb-3">{t('promo.promo_rules')}</h3>
                            <p>{promo.ruleDescription}</p>
                        </div>
                        
                        {promo.thresholdRewards && promo.thresholdRewards.length > 0 && (
                            <div>
                                <h3 className="text-lg font-medium mb-3">{t('promo.rewards_description')}</h3>
                                <div className="flex flex-wrap gap-4">
                                    {promo.thresholdRewards.map((thresholdReward) => (
                                        <ThresholdRewardsTable key={thresholdReward.id} thresholdReward={thresholdReward} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Partner rewards - simple rewards display */}
                        {(promo as any).rewards && Array.isArray((promo as any).rewards) && (promo as any).rewards.length > 0 && (
                            <div>
                                <h3 className="text-lg font-medium mb-3">{t('promo.rewards_description')}</h3>
                                <div className="flex space-x-3">
                                    {(promo as any).rewards.map((reward: any) => (
                                        <div key={reward.id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-sm mb-1">
                                                        {t(`membership.status.${reward.status}`, { defaultValue: reward.status })}
                                                    </p>
                                                    <p className="text-lg font-bold text-green-600">
                                                        {reward.value}{reward.valueType === "Percentage" ? "%" : ""}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
