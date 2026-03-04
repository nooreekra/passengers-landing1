"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { User, Mail, Phone, ArrowLeft, IdCard, Globe } from "lucide-react";
import Image from "next/image";
import { getMe } from "@/shared/api/auth";
import { MeUser } from "@/entities/auth/types";
import Loader from "@/shared/ui/Loader";
import { useTranslation } from "react-i18next";

const ProfilePage = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const userFromStore = useSelector((state: RootState) => state.user.current);
    const [user, setUser] = useState<MeUser | null>(userFromStore);
    const [loading, setLoading] = useState(!userFromStore);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            if (userFromStore) {
                setUser(userFromStore);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const userData = await getMe();
                setUser(userData);
            } catch (err) {
                console.error("Failed to fetch user data:", err);
                setError(t("passenger.profile.failedToLoad"));
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [userFromStore]);

    const formatValue = (value: string | undefined | null) => {
        return value && value.trim() ? value : "—";
    };

    if (loading) {
        return (
            <div className="relative min-h-screen flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="relative min-h-screen">
                <header className="bg-background-dark px-4 pt-3 pb-3">
                    <div className="flex justify-between items-center">
                        <Link href="/passenger/more" className="flex items-center gap-2 cursor-pointer">
                            <ArrowLeft className="h-5 w-5 text-white" />
                        </Link>
                    </div>
                </header>
                <div className="flex items-center justify-center min-h-[60vh] px-4">
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">{error || t("passenger.profile.userNotFound")}</p>
                        <button
                            onClick={() => router.push("/passenger/more")}
                            className="px-4 py-2 bg-action-primary text-white rounded-lg"
                        >
                            {t("passenger.profile.goBack")}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen">
            {/* Header */}
            <header className="bg-background-dark px-4 pt-3 pb-3">
                <div className="flex justify-between items-center">
                    <div></div>
                    <Link href="/passenger/more" className="flex items-center gap-2 cursor-pointer">
                        <ArrowLeft className="h-5 w-5 text-white" />
                    </Link>
                </div>
            </header>

            {/* Background Image */}
            <div className="absolute inset-0 -z-10">
                <Image
                    src="/images/passengersbg.png"
                    alt="Background"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/45" />
            </div>

            <div className="relative px-4 pt-4 pb-6">
                <div className="max-w-[600px] mx-auto">
                    {/* Header Card */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
                        <h1 className="text-2xl font-semibold text-white">{t("passenger.profile.title")}</h1>
                        <p className="text-gray-200 text-sm">{t("passenger.profile.subtitle")}</p>
                    </div>

                    {/* Personal Information Card */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-4 border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                            <User className="h-5 w-5 text-white" />
                            {t("passenger.profile.personalInformation")}
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="bg-white/10 rounded-lg p-2 mt-0.5 border border-white/20">
                                    <IdCard className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-200 mb-1">{t("passenger.profile.fullName")}</p>
                                    <p className="text-sm font-medium text-white">
                                        {formatValue(`${user.firstName} ${user.lastName}`)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-white/10 rounded-lg p-2 mt-0.5 border border-white/20">
                                    <Mail className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-200 mb-1">{t("passenger.profile.email")}</p>
                                    <p className="text-sm font-medium text-white">{formatValue(user.email)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-white/10 rounded-lg p-2 mt-0.5 border border-white/20">
                                    <Phone className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-200 mb-1">{t("passenger.profile.phone")}</p>
                                    <p className="text-sm font-medium text-white">{formatValue(user.phoneNumber)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-white/10 rounded-lg p-2 mt-0.5 border border-white/20">
                                    <Globe className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-200 mb-1">{t("passenger.profile.country")}</p>
                                    <p className="text-sm font-medium text-white">{formatValue(user.country?.name)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-white/10 rounded-lg p-2 mt-0.5 border border-white/20">
                                    <IdCard className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-200 mb-1">{t("passenger.profile.imsNumber")}</p>
                                    <p className="text-sm font-medium text-white">{formatValue(user.imsNumber)}</p>
                                </div>
                            </div>
                            {user.extensionPhoneNumber && (
                                <div className="flex items-start gap-3">
                                    <div className="bg-white/10 rounded-lg p-2 mt-0.5 border border-white/20">
                                        <Phone className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-200 mb-1">{t("passenger.profile.extensionPhoneNumber")}</p>
                                        <p className="text-sm font-medium text-white">{formatValue(user.extensionPhoneNumber)}</p>
                                    </div>
                                </div>
                            )}
                            {user.ain && (
                                <div className="flex items-start gap-3">
                                    <div className="bg-white/10 rounded-lg p-2 mt-0.5 border border-white/20">
                                        <IdCard className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-200 mb-1">{t("passenger.profile.userId")}</p>
                                        <p className="text-sm font-medium text-white">{formatValue(user.ain)}</p>
                                    </div>
                                </div>
                            )}
                            {/* <div className="flex items-start gap-3">
                                <div className="bg-white/10 rounded-lg p-2 mt-0.5 border border-white/20">
                                    <IdCard className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-200 mb-1">{t("passenger.profile.userId")}</p>
                                    <p className="text-sm font-medium text-xs break-all text-white">{formatValue(user.id)}</p>
                                </div>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;

