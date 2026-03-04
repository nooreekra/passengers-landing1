"use client";

import { PromoWizardProvider } from "@/features/promo/lib/PromoWizardContext";

export default function PromoWizardClientProvider({ 
    children, 
    promoId 
}: { 
    children: React.ReactNode;
    promoId?: string;
}) {
    return <PromoWizardProvider promoId={promoId}>{children}</PromoWizardProvider>;
}
