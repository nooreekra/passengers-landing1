"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Check } from "lucide-react";
import ChevronLeftIcon from "@/shared/icons/ChevronLeftIcon";
import {useTranslation} from "react-i18next";

export interface StepItem {
    label: string;
    href: string;
}

interface Props {
    steps: StepItem[];
    currentStep: number;
    onBack?: () => void;
    stepCompletion?: boolean[];
    restrictNavigation?: boolean;
}

export default function StepWizard({ steps, currentStep, onBack, stepCompletion, restrictNavigation = false }: Props) {
    const {t} = useTranslation();
    const router = useRouter();

    return (
        <div className="flex flex-col justify-center gap-6">
            <button
                onClick={onBack ?? (() => router.back())}
                className="flex items-center body-M-bold text-brand-black"
            >
                <ChevronLeftIcon />
                {t('promo.back')}
            </button>

            <ol className="flex items-center w-full">
                {steps.map((step, index) => {
                    const stepIndex = index + 1;
                    const isCompleted = stepCompletion?.[index] || false;
                    const isFirstStepCompleted = stepCompletion?.[0] || false;
                    
                    const canNavigate = !restrictNavigation || 
                        stepIndex === 1 || 
                        isFirstStepCompleted || 
                        stepIndex <= currentStep;
                    
                    const state =
                        stepIndex === currentStep
                            ? "active"
                            : isCompleted
                                ? "done"
                                : "future";

                    const circleClass = clsx(
                        "mr-2 flex items-center justify-center h-7 w-7 rounded-full text-sm font-semibold border-2 transition-all duration-300",
                        {
                            "bg-blue-500 text-white border-blue-500": state === "done",
                            "bg-blue-700 text-white border-blue-700 shadow-xl ring-4 ring-blue-300": state === "active",
                            "text-gray-400 border-gray-300 bg-white": state === "future",
                        }
                    );

                    const pillClass = clsx(
                        "flex items-center px-5 py-3 rounded-full border-2 text-sm transition-all duration-200",
                        {
                            "border-blue-400 bg-blue-50 hover:bg-blue-100 cursor-pointer text-blue-600": state === "done" && canNavigate,
                            "border-blue-700 bg-blue-200 font-bold text-blue-900 shadow-lg": state === "active",
                            "border-gray-300 hover:bg-gray-50 cursor-pointer text-gray-600": state === "future" && canNavigate,
                            "border-gray-200 bg-gray-100 cursor-not-allowed text-gray-400": !canNavigate,
                        }
                    );

                    const pill = (
                        <span className={pillClass}>
              <span className={circleClass}>
                {state === "done" ? <Check size={16} /> : stepIndex}
              </span>
                            {step.label}
            </span>
                    );

                    return (
                        <li key={step.href} className="flex items-center w-full">
                            {canNavigate ? (
                                <Link href={step.href}>{pill}</Link>
                            ) : (
                                <span className="cursor-not-allowed">{pill}</span>
                            )}

                            {index < steps.length - 1 && (
                                <div
                                    className={clsx("flex-1 h-0.5", {
                                        "bg-blue-500": state === "done" || state === "active",
                                        "bg-gray-300": state === "future",
                                    })}
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
