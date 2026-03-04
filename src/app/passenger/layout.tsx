"use client";

import React, { Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import Image from "next/image";
import HomeIcon from "@/shared/icons/HomeIcon";
import ProfileIcon from "@/shared/icons/ProfileIcon";
import { useAuthGuard } from "@/shared/lib/useAuthGuard";
import { Wallet, Plane, MoreHorizontal, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import AutoAuth from "@/shared/components/AutoAuth";

export default function PassengerMobileLayout({ children }: { children: React.ReactNode }) {
    useAuthGuard();
    const pathname = usePathname();
    const { t } = useTranslation();

    const navItems = [
        { key: "home", label: t("passenger.nav.home"), icon: HomeIcon, href: "/passenger", isCustomIcon: true },
        { key: "wallet", label: t("passenger.nav.wallet"), icon: Wallet, href: "/passenger/wallet", isCustomIcon: false },
        { key: "trips", label: t("passenger.nav.trips"), icon: Plane, href: "/passenger/trips", isPrimary: true },
        { key: "account", label: t("passenger.nav.account"), icon: ProfileIcon, href: "/passenger/account", isCustomIcon: true },
        { key: "more", label: t("passenger.nav.more"), icon: MoreHorizontal, href: "/passenger/more", isCustomIcon: false },
    ];

    const isActive = (href: string) => {
        if (!pathname) return false;
        if (href === "/passenger") {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Suspense fallback={null}>
                <AutoAuth />
            </Suspense>
            {/* Основной контент */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>

            {/* Нижняя навигация для мобильного */}
            <nav className="fixed bottom-0 left-0 right-0 bg-background-dark z-50 shadow-lg">
                <div className="flex justify-around items-center max-w-md mx-auto px-2 py-2">
                    {navItems.map(({ key, label, icon: Icon, href, isPrimary, isCustomIcon }) => {
                        const active = isActive(href);
                        
                        if (isPrimary) {
                            // Кнопка Trips с центральным акцентом
                            return (
                                <Link
                                    key={key}
                                    href={href}
                                    className="flex flex-col items-center justify-center gap-1 relative"
                                >
                                    <div className={clsx(
                                        "rounded-full p-3 shadow-md transition-colors",
                                        active ? "bg-action-primary-active" : "bg-gray-600"
                                    )}>
                                        <Plus className="h-6 w-6 text-white" />
                                    </div>
                                    <span className="text-xs font-medium text-white">{label}</span>
                                </Link>
                            );
                        }
                        
                        return (
                            <Link
                                key={key}
                                href={href}
                                className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-lg transition-colors"
                            >
                                {isCustomIcon ? (
                                    <div className={clsx("p-1.5 rounded-lg", active ? "bg-action-primary-light" : "bg-transparent")}>
                                        <Icon stroke={active ? "#0062E4" : "#FFFFFF"} />
                                    </div>
                                ) : (
                                    <div className={clsx("p-1.5 rounded-lg", active ? "bg-action-primary-light" : "bg-transparent")}>
                                        <Icon 
                                            className="h-5 w-5" 
                                            stroke={active ? "#0062E4" : "#FFFFFF"} 
                                            strokeWidth={2} 
                                        />
                                    </div>
                                )}
                                <span className="text-xs font-medium text-white">{label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
