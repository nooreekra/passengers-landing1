"use client";

import React, { useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { logout } from "@/shared/api/auth";
import { clearTokens } from "@/store/slices/authSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Settings, HelpCircle, Globe, LogOut, User, X, Check, FileText, MessageCircle, ChevronRight, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Dialog, Transition } from "@headlessui/react";
import { agreementsApi, Agreement } from "@/shared/api/agreements";

const MorePage = () => {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const dispatch = useDispatch();
    const refreshToken = useSelector((state: RootState) => state.auth.refreshToken);
    const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
    const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
    const [isAgreementDetailModalOpen, setIsAgreementDetailModalOpen] = useState(false);
    const [agreements, setAgreements] = useState<Agreement[]>([]);
    const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
    const [loadingAgreements, setLoadingAgreements] = useState(false);

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

    const handleLanguageChange = (langCode: string) => {
        i18n.changeLanguage(langCode);
        setIsLanguageModalOpen(false);
    };

    const handleChatClick = () => {
        const phoneNumber = "+7 702 702 3010";
        const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}`;
        window.open(whatsappUrl, "_blank");
    };

    const handleUserAgreementClick = async () => {
        setIsAgreementModalOpen(true);
        setLoadingAgreements(true);
        try {
            const data = await agreementsApi.getAgreements("User");
            setAgreements(data);
        } catch (error) {
            console.error("Failed to load agreements:", error);
            setAgreements([]);
        } finally {
            setLoadingAgreements(false);
        }
    };

    const handleAgreementItemClick = (agreement: Agreement) => {
        setSelectedAgreement(agreement);
        setIsAgreementDetailModalOpen(true);
    };

    const handleCloseAgreementDetail = () => {
        setIsAgreementDetailModalOpen(false);
        setSelectedAgreement(null);
    };

    const languages = [
        { code: "en", label: "English", nativeLabel: "English" },
        { code: "ru", label: "Русский", nativeLabel: "Русский" },
        { code: "kk", label: "Қазақша", nativeLabel: "Қазақша" },
    ];

    const menuItems = [
        { icon: User, label: t("passenger.more.profile"), href: "/passenger/profile", onClick: null },
        // { icon: Settings, label: t("passenger.more.settings"), href: "/passenger/settings", onClick: null },
        // { icon: HelpCircle, label: t("passenger.more.help"), href: "/passenger/help", onClick: null },
        { icon: Globe, label: t("passenger.more.language"), href: null, onClick: () => setIsLanguageModalOpen(true) },
        { icon: FileText, label: t("passenger.more.userAgreement"), href: null, onClick: handleUserAgreementClick },
        { icon: MessageCircle, label: t("passenger.more.chat"), href: null, onClick: handleChatClick },
    ];

    return (
        <div className="relative min-h-screen">
            {/* Header с логотипом */}
            <header className="bg-background-dark px-4 pt-3 pb-3">
                <div className="flex justify-between items-center">
                    <Link href="/passenger" className="flex items-center gap-2 cursor-pointer">
                        <Image
                            src="/images/logo.png"
                            alt="IMS Savvy"
                            width={135}
                            height={30}
                            priority
                        />
                    </Link>
                </div>
            </header>

            {/* Фоновое изображение */}
            <div className="absolute inset-0 -z-10">
                <Image
                    src="/images/passengersbg.png"
                    alt="Background"
                    fill
                    className="object-cover"
                    priority
                />
                {/* Затемняющий overlay для читаемости */}
                <div className="absolute inset-0 bg-black/45" />
            </div>

            <div className="relative px-4 pt-6 pb-6">
                <div className="max-w-[600px] mx-auto">
                    <div className="space-y-2">
                    {menuItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    if (item.onClick) {
                                        item.onClick();
                                    } else if (item.href) {
                                        router.push(item.href);
                                    }
                                }}
                                className="w-full bg-white/10 backdrop-blur-md rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] p-4 border border-white/20 flex items-center gap-4 hover:bg-white/15 transition-all"
                            >
                                <div className="bg-white/10 rounded-lg p-2 border border-white/20">
                                    <Icon className="h-5 w-5 text-white" />
                                </div>
                                <span className="font-medium flex-1 text-left text-white">{item.label}</span>
                            </button>
                        );
                    })}

                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-500/10 backdrop-blur-md rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] p-4 border border-red-500/20 flex items-center gap-4 hover:bg-red-500/15 transition-all mt-4"
                    >
                        <div className="bg-white/10 rounded-lg p-2 border border-white/20">
                            <LogOut className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-medium flex-1 text-left text-white">{t("passenger.more.logout")}</span>
                    </button>
                </div>
                </div>
            </div>

            {/* Language Selection Modal */}
            <Transition appear show={isLanguageModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsLanguageModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
                                    {/* Header */}
                                    <div className="bg-background-dark px-6 py-4 flex items-center justify-between">
                                        <Dialog.Title className="text-lg font-semibold text-white">
                                            {t("passenger.more.language")}
                                        </Dialog.Title>
                                        <button
                                            onClick={() => setIsLanguageModalOpen(false)}
                                            className="text-white hover:text-gray-200 transition-colors"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {/* Language List */}
                                    <div className="p-4">
                                        <div className="space-y-2">
                                            {languages.map((lang) => {
                                                const isSelected = i18n.language === lang.code;
                                                return (
                                                    <button
                                                        key={lang.code}
                                                        onClick={() => handleLanguageChange(lang.code)}
                                                        className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                                                            isSelected
                                                                ? "border-action-primary bg-action-primary-light"
                                                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Globe className={`h-5 w-5 ${isSelected ? "text-action-primary" : "text-gray-400"}`} />
                                                            <div className="text-left">
                                                                <div className={`font-medium ${isSelected ? "text-action-primary" : "text-gray-900"}`}>
                                                                    {lang.nativeLabel}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {lang.label}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {isSelected && (
                                                            <Check className="h-5 w-5 text-action-primary" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* User Agreement Modal */}
            <Transition appear show={isAgreementModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsAgreementModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-xl transition-all max-h-[90vh] flex flex-col">
                                    {/* Header */}
                                    <div className="bg-background-dark px-6 py-4 flex items-center justify-between">
                                        <Dialog.Title className="text-lg font-semibold text-white">
                                            {t("passenger.more.agreementTitle")}
                                        </Dialog.Title>
                                        <button
                                            onClick={() => setIsAgreementModalOpen(false)}
                                            className="text-white hover:text-gray-200 transition-colors"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 overflow-y-auto p-6">
                                        {loadingAgreements ? (
                                            <div className="text-center py-8">
                                                <div className="text-white">{t("passenger.more.loadingAgreements")}</div>
                                            </div>
                                        ) : agreements.length === 0 ? (
                                            <div className="text-center py-8">
                                                <div className="text-white">{t("passenger.more.noAgreements")}</div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {agreements.map((agreement) => (
                                                    <button
                                                        key={agreement.id}
                                                        onClick={() => handleAgreementItemClick(agreement)}
                                                        className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-action-primary hover:bg-action-primary-light transition-colors flex items-center justify-between group"
                                                    >
                                                        <div className="flex-1">
                                                            <div className="font-semibold text-gray-900 group-hover:text-action-primary transition-colors">
                                                                {agreement.title}
                                                            </div>
                                                            <div className="text-sm text-gray-500 mt-1">
                                                                {t("passenger.more.version")}: {agreement.version} • {t("passenger.more.updatedAt")}: {new Date(agreement.updatedAt).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-action-primary transition-colors ml-4" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Agreement Detail Modal */}
            <Transition appear show={isAgreementDetailModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-[60]" onClose={handleCloseAgreementDetail}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-xl transition-all max-h-[90vh] flex flex-col">
                                    {/* Header */}
                                    <div className="bg-background-dark px-6 py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={handleCloseAgreementDetail}
                                                className="text-white hover:text-gray-200 transition-colors"
                                            >
                                                <ArrowLeft className="h-5 w-5" />
                                            </button>
                                            <Dialog.Title className="text-lg font-semibold text-white">
                                                {selectedAgreement?.title || t("passenger.more.agreementTitle")}
                                            </Dialog.Title>
                                        </div>
                                        <button
                                            onClick={handleCloseAgreementDetail}
                                            className="text-white hover:text-gray-200 transition-colors"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    {selectedAgreement && (
                                        <div className="flex-1 overflow-y-auto p-6">
                                            <div className="mb-4 pb-4 border-b border-gray-200">
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span>
                                                        {t("passenger.more.version")}: <span className="font-medium text-gray-700">{selectedAgreement.version}</span>
                                                    </span>
                                                    <span>
                                                        {t("passenger.more.updatedAt")}: <span className="font-medium text-gray-700">{new Date(selectedAgreement.updatedAt).toLocaleDateString()}</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div 
                                                className="text-gray-700 prose prose-sm max-w-none"
                                                dangerouslySetInnerHTML={{ __html: selectedAgreement.content }}
                                            />
                                        </div>
                                    )}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default MorePage;



