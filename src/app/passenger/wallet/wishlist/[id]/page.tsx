"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { getWallet, getWishlists, deleteWishlist, releaseFunds, reserveFunds, transferFunds } from "@/shared/api/passenger";
import { getCountries, getCitiesByCountry } from "@/shared/api/locations";
import Loader from "@/shared/ui/Loader";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

const WishlistProgressPage = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const wishlistId = params?.id as string | undefined;
    
    if (!wishlistId) {
        router.push("/passenger/wallet");
        return null;
    }
    const user = useSelector((state: RootState) => state.user.current);
    const [wishlistData, setWishlistData] = useState<{
        id: string;
        name: string;
        country: string;
        city?: string;
        target: number;
        progress: number;
        rules: string;
    } | null>(null);
    const [countryName, setCountryName] = useState<string>("");
    const [cityName, setCityName] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [walletId, setWalletId] = useState<string | null>(null);
    const [allWishlists, setAllWishlists] = useState<Array<{ id: string; title: string }>>([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [transferTo, setTransferTo] = useState("");
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const loadWishlist = async () => {
            try {
                const wallet = await getWallet();
                setWalletId(wallet.id);
                const wishlists = await getWishlists(wallet.id);
                
                // Сохраняем все wishlists для модалки перевода
                setAllWishlists(wishlists.map(w => ({ id: w.id, title: w.title })));
                
                const wishlist = wishlists.find(w => w.id === wishlistId);
                
                if (!wishlist) {
                    router.push("/passenger/wallet");
                    return;
                }
                
                const rulesText = wishlist.rule === "None" 
                    ? t("passenger.wallet.noRulesSet") || "No rules set"
                    : wishlist.rulePercent > 0
                    ? `${wishlist.rulePercent}% ${t("passenger.wallet.percentOfEachTransaction") || "of each transaction"}`
                    : wishlist.rule;

                setWishlistData({
                    id: wishlist.id,
                    name: wishlist.title,
                    country: wishlist.country,
                    city: wishlist.city,
                    target: wishlist.targetAmount,
                    progress: wishlist.currentAmount,
                    rules: rulesText,
                });

                // Загружаем названия страны и города
                if (wishlist.country) {
                    try {
                        const countries = await getCountries();
                        const country = countries.find(c => c.id === wishlist.country);
                        if (country) {
                            setCountryName(country.name);
                        }
                    } catch (error) {
                        console.error("Failed to load country name:", error);
                    }
                }

                if (wishlist.city && wishlist.country) {
                    try {
                        const cities = await getCitiesByCountry(wishlist.country);
                        const city = cities.find(c => c.id === wishlist.city);
                        if (city) {
                            setCityName(city.name);
                        }
                    } catch (error) {
                        console.error("Failed to load city name:", error);
                    }
                }
            } catch (error) {
                console.error("Failed to load wishlist:", error);
                router.push("/passenger/wallet");
            } finally {
                setLoading(false);
            }
        };
        loadWishlist();
    }, [wishlistId, router, t]);

    // Получение текущего тира
    const currentTier = React.useMemo(() => {
        if (user?.tier) {
            return user.tier;
        }
        return null;
    }, [user]);

    // Вспомогательная функция для получения кода/типа тира (поддержка обоих форматов)
    const getTierCode = (tier: any): string => {
        if (!tier) return '';
        // Новый формат с type
        if ('type' in tier && tier.type) {
            return tier.type.toLowerCase();
        }
        // Старый формат с code
        if ('code' in tier && tier.code) {
            return tier.code.toLowerCase();
        }
        return '';
    };

    if (loading || !wishlistData) {
        return (
            <div className="relative min-h-screen pb-20">
                <div className="flex items-center justify-center min-h-screen">
                    <Loader text={t("passenger.wallet.loading") || "Loading..."} textColor="text-white" color="#ffffff" />
                </div>
            </div>
        );
    }

    const progressPercentage = (wishlistData.progress / wishlistData.target) * 100;

    // Получение фона карты в зависимости от статуса
    const getCardBackground = () => {
        if (!currentTier) {
            return "/images/membership/bronze.jpg";
        }
        const tierCode = getTierCode(currentTier);
        const validTiers = ["bronze", "silver", "gold", "platinum"];
        if (validTiers.includes(tierCode)) {
            return `/images/membership/${tierCode}.jpg`;
        }
        return "/images/membership/bronze.jpg";
    };

    // Mock data для имени
    const mockData = {
        name: "Mark Robert",
    };

    const handleDelete = () => {
        if (!wishlistData) return;
        // Всегда показываем модалку подтверждения
        setShowDeleteModal(true);
    };

    const performDelete = async () => {
        if (!walletId || !wishlistData) return;

        try {
            setDeleting(true);
            
            // Если есть сумма и выбрано место для перевода
            if (wishlistData.progress > 0 && transferTo) {
                if (transferTo === "available") {
                    // Освобождаем средства в available
                    await releaseFunds(walletId, wishlistData.id, { amount: wishlistData.progress });
                } else if (transferTo.startsWith("wishlist_")) {
                    // Переводим в другой wishlist
                    const targetWishlistId = transferTo.replace("wishlist_", "");
                    await transferFunds(walletId, wishlistData.id, { toWishlistId: targetWishlistId, amount: wishlistData.progress });
                }
            }
            
            // Удаляем wishlist
            await deleteWishlist(walletId, wishlistData.id);
            router.push("/passenger/wallet");
        } catch (error) {
            console.error("Failed to delete wishlist:", error);
            alert(t("passenger.wallet.deleteError") || "Failed to delete wishlist");
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    return (
        <div className="relative min-h-screen pb-20">
            {/* Header с логотипом */}
            <header className="bg-background-dark px-4 pt-3 pb-3">
                <div className="flex items-center justify-between">
                    <Link href="/passenger" className="flex items-center gap-2 cursor-pointer">
                        <Image
                            src="/images/logo.png"
                            alt="IMS Savvy"
                            width={135}
                            height={30}
                            priority
                        />
                    </Link>
                    <button
                        onClick={() => router.back()}
                        className="text-white hover:text-gray-300 transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
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
                <div className="absolute inset-0 bg-black/45" />
            </div>

            <div className="relative px-4 pt-4 pb-6">
                <div className="max-w-[600px] mx-auto space-y-4">
                    {/* Wishlist Title with Edit and Delete Buttons and Progress */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-semibold text-white">{wishlistData.name}</h1>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => router.push(`/passenger/wallet/wishlist/${wishlistId}/edit`)}
                                    className="text-action-primary hover:text-action-primary/80 transition-colors"
                                >
                                    <Edit className="h-5 w-5 text-brand-blue" />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="text-red-600 hover:text-red-700 transition-colors"
                                    disabled={deleting}
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Progress and Target */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-sm text-gray-200 mb-1">{t("passenger.wallet.progress")}</p>
                                <p className="text-2xl font-bold text-white">
                                    {wishlistData.progress.toLocaleString()} Miles
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-200 mb-1">{t("passenger.wallet.target")}</p>
                                <p className="text-2xl font-bold text-white">
                                    {wishlistData.target.toLocaleString()} Miles
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                            <div
                                className="bg-brand-blue h-3 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-200 text-center">
                            {progressPercentage.toFixed(1)}% {t("passenger.wallet.complete")}
                        </p>
                    </div>

                    {/* Rules Set */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
                        <h3 className="text-lg font-semibold text-white">{t("passenger.wallet.rulesSet")}</h3>
                        <p className="text-sm text-gray-200">{wishlistData.rules}</p>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            <Transition appear show={showDeleteModal} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setShowDeleteModal(false)}>
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
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <Dialog.Title className="text-lg font-semibold">
                                                {wishlistData && wishlistData.progress > 0
                                                    ? (t("passenger.wallet.transferBeforeDelete") || "Transfer funds before deleting")
                                                    : (t("passenger.wallet.confirmDelete") || "Confirm deletion")
                                                }
                                            </Dialog.Title>
                                            <button
                                                onClick={() => setShowDeleteModal(false)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>

                                        {wishlistData && wishlistData.progress > 0 ? (
                                            <>
                                                <p className="text-sm text-gray-600 mb-4">
                                                    {t("passenger.wallet.transferFundsMessage") || 
                                                    `This wishlist has ${wishlistData.progress.toLocaleString()} miles. Where would you like to transfer them?`}
                                                </p>

                                                <div className="mb-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        {t("passenger.wallet.transferTo") || "Transfer to"}
                                                    </label>
                                                    <select
                                                        value={transferTo}
                                                        onChange={(e) => setTransferTo(e.target.value)}
                                                        className="w-full bg-white rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-action-primary focus:border-transparent"
                                                        required
                                                    >
                                                        <option value="">{t("passenger.wallet.selectDestination")}</option>
                                                        <option value="available">{t("passenger.wallet.availableToRedeem")}</option>
                                                        {allWishlists
                                                            .filter(w => w.id !== wishlistId)
                                                            .map((wishlist) => (
                                                                <option key={wishlist.id} value={`wishlist_${wishlist.id}`}>
                                                                    {wishlist.title}
                                                                </option>
                                                            ))}
                                                    </select>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-sm text-gray-600 mb-4">
                                                {t("passenger.wallet.confirmDeleteMessage") || "Are you sure you want to delete this wishlist? This action cannot be undone."}
                                            </p>
                                        )}

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setShowDeleteModal(false)}
                                                className="flex-1 bg-gray-200 text-gray-700 rounded-xl px-4 py-2 font-medium hover:bg-gray-300 transition-colors"
                                            >
                                                {t("passenger.wallet.cancel") || "Cancel"}
                                            </button>
                                            <button
                                                onClick={performDelete}
                                                disabled={(wishlistData && wishlistData.progress > 0 && !transferTo) || deleting}
                                                className="flex-1 bg-red-600 text-white rounded-xl px-4 py-2 font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {deleting ? (t("passenger.wallet.deleting") || "Deleting...") : (t("passenger.wallet.delete") || "Delete")}
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default WishlistProgressPage;

