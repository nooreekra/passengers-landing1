"use client";

import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren } from "react";
import StepWizard from "@/features/promo/components/StepWizard";
import PromoWizardClientProvider from "@/features/promo/components/PromoWizardClientProvider";
import { usePromoWizard } from "@/features/promo/lib/PromoWizardContext";
import {useTranslation} from "react-i18next";

export default function AddPromoLayout({ children }: PropsWithChildren) {
    const {t} = useTranslation();
    const pathname = usePathname();
    const router   = useRouter();

    const steps = [
        { label: t("promo.step_description"),      href: "/dashboard/airline/promos/add/step-1" },
        { label: t("promo.step_target_audience"),  href: "/dashboard/airline/promos/add/step-2" },
        { label: t("promo.step_promo_rules"),      href: "/dashboard/airline/promos/add/step-3" },
        { label: t("promo.step_rewards_and_fees"), href: "/dashboard/airline/promos/add/step-4" },
    ];

    const currentStep = steps.findIndex((s) => pathname?.startsWith(s.href)) + 1 || 1;

    return (
        <PromoWizardClientProvider>
            <AddPromoContent 
                steps={steps} 
                currentStep={currentStep} 
                onBack={() => {
                    localStorage.removeItem('promo-wizard-data');
                    router.push('/dashboard/airline');
                }}
            >
                {children}
            </AddPromoContent>
        </PromoWizardClientProvider>
    );
}

function AddPromoContent({ 
    children, 
    steps, 
    currentStep, 
    onBack 
}: PropsWithChildren<{
    steps: Array<{ label: string; href: string }>;
    currentStep: number;
    onBack: () => void;
}>) {
    const { stepCompletion } = usePromoWizard();

    return (
        <div className="space-y-8">
            <StepWizard 
                steps={steps} 
                currentStep={currentStep} 
                onBack={onBack} 
                stepCompletion={stepCompletion}
                restrictNavigation={true}
            />
            {children}
        </div>
    );
}
