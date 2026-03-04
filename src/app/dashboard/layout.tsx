"use client";

import React, {useEffect, useState, Fragment} from "react";
import {usePathname, useRouter} from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import Image from "next/image";
import HomeIcon from "@/shared/icons/HomeIcon";
import ProfileIcon from "@/shared/icons/ProfileIcon";
import AnalyticsIcon from "@/shared/icons/AnalyticsIcon";
import VideoIcon from "@/shared/icons/VideoIcon";
import SubscriptionIcon from "@/shared/icons/SubscriptionIcon";
import DocumentsIcon from "@/shared/icons/DocumentsIcon";
import SettingsIcon from "@/shared/icons/SettingsIcon";
import FaqIcon from "@/shared/icons/FaqIcon";
import PhoneIcon from "@/shared/icons/PhoneIcon";
import LogoutIcon from "@/shared/icons/LogoutIcon";
import RequisitesIcon from "@/shared/icons/RequisitesIcon";
import {logout} from "@/shared/api/auth";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@/store";
import {clearTokens} from "@/store/slices/authSlice";
import { useTranslation } from "react-i18next";
import { Menu, Transition } from "@headlessui/react";
import {ChevronDown, GlobeIcon} from "lucide-react";
import {useAuthGuard} from "@/shared/lib/useAuthGuard";
import {usePermission} from "@/shared/lib/usePermission";

type NavItem = {
    key: string;
    label: string;
    icon: React.ComponentType<any>;
    href: string;
    permission?: boolean;
    children?: { label: string; href: string; permission: boolean }[];
};

export default function DashboardLayout({children}: { children: React.ReactNode }) {
    useAuthGuard();
    const canReadRoles = usePermission("role:read");
    const canReadStructures = usePermission("branch:read");
    const canReadUsers = usePermission("user:read");
    const canReadBranches = usePermission("branch:read");
    const canReadMembershipRequests = usePermission("membership:read");
    const canReadDocuments = usePermission("document:read");
    const canReadSubscription = usePermission("subscription:read");
    const canReadRequisites = usePermission("requisite:read");

    const { t, i18n } = useTranslation();
    const pathname = usePathname();
    const basePath = pathname ? pathname.split("/").slice(0, 3).join("/") : "";
    const dispatch = useDispatch();
    const router = useRouter();
    const refreshToken = useSelector((state: RootState) => state.auth.refreshToken);
    const user = useSelector((state: RootState) => state.user.current);
    const businessType = useSelector((state: RootState) => state.business.current?.type);

    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const isAirline = user?.role?.type === "Airline";
    const isTravelAgency = user?.role?.type === "TravelAgency";
    const isTravelAgent = user?.role?.type === "TravelAgent";
    const isPartnership = user?.role?.type === "Partnership";
    const isPassenger = user?.role?.type === "Passenger";
    const isTravelBusiness = isTravelAgency || isTravelAgent;

    const navItems: NavItem[] = [
        { key: "home", label: t("nav.home"), icon: HomeIcon, href: "" },
        {
            key: "profile",
            label: t("nav.profile"),
            icon: ProfileIcon,
            href: "profile",
            children: [
                { label: t("profile.branches"), href: "profile/branches", permission: canReadBranches && !isPartnership },
                { label: t("profile.structure"), href: "profile/structures", permission: canReadStructures },
                { label: t("profile.roles"), href: "profile/roles", permission: canReadRoles },
                { label: t("profile.users"), href: "profile/users", permission: canReadUsers },
                { label: t("membership.title"),
                    href: "profile/membership",
                    permission: canReadMembershipRequests && businessType === "TravelAgency" },
            ],
        },
        { key: "analytics", label: t("nav.analytics"), icon: AnalyticsIcon, href: "analytics" },
        { key: "tutorials", label: t("nav.tutorials"), icon: VideoIcon, href: "tutorials" },
        { key: "subscription", label: t("nav.subscription"), icon: SubscriptionIcon, href: "subscription", permission: canReadSubscription },
        { key: "documents", label: t("nav.documents"), icon: DocumentsIcon, href: "documents", permission: canReadDocuments },
        { key: "requisites", label: t("nav.requisites"), icon: RequisitesIcon, href: "requisites", permission: canReadRequisites },
        { key: "settings", label: t("nav.settings"), icon: SettingsIcon, href: "settings" },
        { key: "faq", label: t("nav.faq"), icon: FaqIcon, href: "faq" },
    ];

    const filteredNavItems = navItems.filter(item => {
        // Проверяем разрешения
        const hasPermission = item.permission === undefined || item.permission === true;
        if (!hasPermission) return false;
        
        // Для subscription и documents - показываем только для Airline и Partnership
        if (item.label === t("nav.subscription") || item.label === t("nav.documents")) {
            return isAirline || isPartnership;
        }
        
        // Для остальных элементов - показываем всем ролям
        return true;
    });

    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
    useEffect(() => {
        setOpenMenus(prev => ({
            ...prev,
            profile: pathname ? pathname.startsWith(`${basePath}/profile`) : false
        }));
    }, [pathname, basePath]);

    const toggleMenu = (key: string) =>
        setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));

    const isActivePath = (fullPath: string) => {
        if (!pathname) return false;
        if (fullPath === "/dashboard/airline/documents") {
            // Для documents проверяем, находимся ли мы в любом из подразделов
            return pathname.startsWith("/dashboard/airline/documents");
        }
        if (fullPath === "/dashboard/partnership/documents") {
            // Для documents проверяем, находимся ли мы в любом из подразделов
            return pathname.startsWith("/dashboard/partnership/documents");
        }
        return pathname === fullPath;
    };
    const full = (href: string) => (href === "" ? basePath : `${basePath}/${href}`);

    const profileItem = filteredNavItems.find(i => i.key === "profile");
    let currentTitle: string = t("promo_view");
    const activeTop = filteredNavItems.find(i => isActivePath(full(i.href)));
    if (activeTop) currentTitle = activeTop.label;
    if (profileItem?.children) {
        const activeChild = profileItem.children.find(c => isActivePath(full(c.href)));
        if (activeChild) currentTitle = `${t("nav.profile")} · ${activeChild.label}`;
    }

    const handleLogout = async () => {
        try {
            if (refreshToken) await logout(refreshToken);
            await fetch("/api/logout", { method: "POST" });
        } catch (e) {
            console.warn("Logout failed", e);
        } finally {
            dispatch(clearTokens());
            router.push("/");
        }
    };

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1080;
            setIsMobile(mobile);
            setCollapsed(mobile);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className="flex w-full min-h-screen bg-[#f7f7f9] text-black">
            <aside
                className={clsx(
                    "bg-white border-r border-decorative-gray transition-all duration-300 flex flex-col justify-between",
                    collapsed ? "w-20" : "w-[290px]"
                )}
            >
                <div className="w-full flex flex-col items-center">
                    <div className="h-[90px] w-full flex items-center justify-between px-4 py-4">
                        {!collapsed && (
                            <Image src="/images/logo.png" alt="Logo" width={120} height={40}/>
                        )}
                        {!isMobile && (
                            <button onClick={() => setCollapsed(prev => !prev)} className="ml-auto">
                                <Image
                                    src="/images/chevron_right.svg"
                                    alt="toggle"
                                    width={20}
                                    height={20}
                                    className={clsx("transition-transform", collapsed && "rotate-180")}
                                />
                            </button>
                        )}
                    </div>

                    <nav className="flex flex-col w-full">
                        {filteredNavItems.map(({key, label, icon: Icon, href, children}) => {
                            const parentPath = full(href);
                            const isParentActive = isActivePath(parentPath) || (children && children.some(c => isActivePath(full(c.href))));
                            const hasChildren = !!children?.length;

                            return (
                                <div key={key} className="px-2">
                                    <div className={clsx(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer",
                                        isParentActive && "font-semibold bg-action-primary-light"
                                    )}>
                                        <Link href={parentPath} className="flex items-center flex-1 gap-3">
                                            <div className={clsx("w-10 p-2 rounded-xl", isParentActive ? "bg-action-primary-active" : "bg-background-gray1")}>
                                                <Icon stroke={isParentActive ? "#FFFFFF" : "#0E0A0D"}/>
                                            </div>
                                            {!collapsed && (
                                                <span className="transition-all duration-300 whitespace-nowrap overflow-hidden ml-2">
                          {label}
                        </span>
                                            )}
                                        </Link>

                                        {hasChildren && !collapsed && (
                                            <button onClick={() => toggleMenu(key)} aria-label="toggle submenu" className="p-1 rounded hover:bg-gray-200">
                                                <ChevronDown className={clsx("h-4 w-4 transition-transform", openMenus[key] ? "rotate-180" : "")}/>
                                            </button>
                                        )}
                                    </div>

                                    {hasChildren && !collapsed && openMenus[key] && (
                                        <div className="mt-1 mb-2 ml-[52px] flex flex-col">
                                            {children!.map((child) => {
                                                const childPath = full(child.href);
                                                const isChildActive = isActivePath(childPath);
                                                if (child.permission) {
                                                    return (
                                                        <Link
                                                            key={child.href}
                                                            href={childPath}
                                                            className={clsx(
                                                                "px-3 py-2 rounded-md text-sm hover:bg-gray-100",
                                                                isChildActive ? "font-medium text-action-primary bg-action-primary-light" : "text-gray-700"
                                                            )}
                                                        >
                                                            {child.label}
                                                        </Link>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex flex-col gap-1 px-2 pb-4">
                    <Menu as="div" className="relative">
                        <Menu.Button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 w-full">
                            <div className="p-2 rounded-xl bg-background-gray1">
                                <GlobeIcon stroke="#0E0A0D"/>
                            </div>
                            {!collapsed && (
                                <span className="transition-all duration-300 whitespace-nowrap overflow-hidden ml-2">
                  {i18n.language?.toUpperCase()}
                </span>
                            )}
                        </Menu.Button>

                        <Transition as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 scale-100"
                                    leaveTo="transform opacity-0 scale-95">
                            <Menu.Items className="absolute left-0 z-10 mt-1 w-[120px] origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                {["en", "ru"].map((lang) => (
                                    <Menu.Item key={lang}>
                                        {({active}) => (
                                            <button
                                                onClick={() => i18n.changeLanguage(lang)}
                                                className={clsx(
                                                    "block w-full px-4 py-2 text-sm text-left rounded-md",
                                                    active ? "bg-gray-100" : "",
                                                    i18n.language === lang && "font-semibold text-action-primary"
                                                )}>
                                                {lang.toUpperCase()}
                                            </button>
                                        )}
                                    </Menu.Item>
                                ))}
                            </Menu.Items>
                        </Transition>
                    </Menu>

                    <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100">
                        <div className="p-2 rounded-xl bg-background-gray1">
                            <PhoneIcon stroke="#0E0A0D"/>
                        </div>
                        {!collapsed && (
                            <span className={clsx("transition-all duration-300 whitespace-nowrap overflow-hidden",
                                collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-xs opacity-100 ml-2")}>
                {t('contact')}
              </span>
                        )}
                    </button>

                    <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100">
                        <div className="p-2 rounded-xl bg-background-gray1">
                            <LogoutIcon stroke="#0E0A0D"/>
                        </div>
                        {!collapsed && (
                            <span className={clsx("transition-all duration-300 whitespace-nowrap overflow-hidden",
                                collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-xs opacity-100 ml-2")}>
                                {t('logout')}
                            </span>
                        )}
                    </button>
                </div>
            </aside>

            <main className={clsx("flex-1 flex flex-col", collapsed ? "max-w-[calc(100%-80px)]" : "max-w-[calc(100%-290px)]")}>
                <header className="h-[90px] bg-white border-b border-decorative-gray px-6 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-semibold">{currentTitle}</h1>
                    {user && (
                        <div className="text-right">
                            <div className="font-semibold">{user.firstName} {user.lastName}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                    )}
                </header>

                <div className="flex-1 p-6 overflow-y-auto bg-background-gray1">{children}</div>
            </main>
        </div>
    );
}
