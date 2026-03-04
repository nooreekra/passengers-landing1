"use client";

import { usePathname, useRouter, useParams } from "next/navigation";
import { PropsWithChildren } from "react";
import StepWizard from "@/features/promo/components/StepWizard";
import PromoWizardClientProvider from "@/features/promo/components/PromoWizardClientProvider";
import { useTranslation } from "react-i18next";
import Loader from "@/shared/ui/Loader";
import { usePromoWizard } from "@/features/promo/lib/PromoWizardContext";

export default function EditPromoLayout({ children }: PropsWithChildren) {
    const { t } = useTranslation();
    const pathname = usePathname();
    const router = useRouter();
    const params = useParams();
    const promoId = params?.promoId as string | undefined;

    if (!promoId) {
        return null;
    }

    const steps = [
        { label: t("promo.step_description"), href: `/dashboard/airline/promos/${promoId}/edit/step-1` },
        { label: t("promo.step_target_audience"), href: `/dashboard/airline/promos/${promoId}/edit/step-2` },
        { label: t("promo.step_promo_rules"), href: `/dashboard/airline/promos/${promoId}/edit/step-3` },
        { label: t("promo.step_rewards_and_fees"), href: `/dashboard/airline/promos/${promoId}/edit/step-4` },
    ];

    const currentStep = steps.findIndex((s) => pathname === s.href) + 1 || 1;

    return (
        <PromoWizardClientProvider promoId={promoId}>
            <EditPromoContent 
                steps={steps} 
                currentStep={currentStep} 
                onBack={() => {
                    localStorage.removeItem('promo-wizard-data');
                    router.push('/dashboard/airline');
                }}
            >
                {children}
            </EditPromoContent>
        </PromoWizardClientProvider>
    );
}

function EditPromoContent({ 
    children, 
    steps, 
    currentStep, 
    onBack 
}: PropsWithChildren<{
    steps: Array<{ label: string; href: string }>;
    currentStep: number;
    onBack: () => void;
}>) {
    const { loading, error, stepCompletion } = usePromoWizard();

    if (loading) {
        return <Loader text="Загрузка данных промо..." />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="text-red-600 text-center">
                    <h3 className="text-lg font-semibold mb-2">Ошибка загрузки</h3>
                    <p>{error}</p>
                </div>
                <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Попробовать снова
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <StepWizard 
                steps={steps} 
                currentStep={currentStep} 
                onBack={onBack} 
                stepCompletion={stepCompletion}
            />
            {children}
        </div>
    );
}
