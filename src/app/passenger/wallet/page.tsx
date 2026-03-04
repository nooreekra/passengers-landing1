"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wallet, Plus, ArrowRightLeft, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import InfoTooltip from "@/shared/ui/InfoTooltip";
import Loader from "@/shared/ui/Loader";
import { getWallet, getWishlists, getTransactions, type Wishlist as WishlistType, type WalletTransaction, type TransactionItem } from "@/shared/api/passenger";
import { getCountries, getCitiesByCountry } from "@/shared/api/locations";

interface WishlistItem {
    id: string;
    name: string;
    country: string;
    city?: string;
    target: number;
    progress: number;
}

// Circular progress component for wishlist (like monthly activity in My Account)
const CircularProgress = ({ 
    value, 
    target, 
    size = 70 
}: { 
    value: number; 
    target: number; 
    size?: number;
}) => {
    const percentage = Math.min((value / target) * 100, 100);
    const radius = (size - 10) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#E5E7EB"
                    strokeWidth="4"
                    fill="none"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#0062E4"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xs font-semibold text-white text-center leading-tight px-1">
                    {target.toLocaleString()}
                </div>
            </div>
        </div>
    );
};

const WalletPage = () => {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"accounts" | "history">("accounts");
    const [wallet, setWallet] = useState<{ id: string; allTimeBalance: number; availableBalance: number; pendingBalance: number } | null>(null);
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [wishlistsMap, setWishlistsMap] = useState<Map<string, string>>(new Map()); // Map для быстрого поиска названий вишлистов по ID
    const [transactions, setTransactions] = useState<TransactionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [loadingMoreTransactions, setLoadingMoreTransactions] = useState(false);
    const [transactionsOffset, setTransactionsOffset] = useState(0);
    const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
    const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());
    const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
    const accountsTabRef = useRef<HTMLButtonElement>(null);
    const historyTabRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const walletData = await getWallet();
                setWallet({
                    id: walletData.id,
                    allTimeBalance: walletData.allTimeBalance,
                    availableBalance: walletData.availableBalance,
                    pendingBalance: walletData.pendingBalance,
                });

                const wishlists = await getWishlists(walletData.id);
                
                // Загружаем страны для получения названий
                const countries = await getCountries();
                
                // Формируем список wishlist items с названиями стран и городов
                const wishlistItemsWithNames = await Promise.all(
                    wishlists.map(async (w) => {
                        const country = countries.find(c => c.id === w.country);
                        let cityName: string | undefined;
                        
                        if (w.city && w.country) {
                            try {
                                const cities = await getCitiesByCountry(w.country);
                                const city = cities.find(c => c.id === w.city);
                                cityName = city?.name;
                            } catch (error) {
                                console.error("Failed to load city name:", error);
                            }
                        }
                        
                        return {
                            id: w.id,
                            name: w.title,
                            country: country?.name || w.country,
                            city: cityName,
                            target: w.targetAmount,
                            progress: w.currentAmount,
                        };
                    })
                );
                
                setWishlistItems(wishlistItemsWithNames);
                
                // Создаем мапу вишлистов по ID для быстрого поиска
                const wishlistsMap = new Map<string, string>();
                wishlistItemsWithNames.forEach(w => {
                    wishlistsMap.set(w.id, w.name);
                });
                setWishlistsMap(wishlistsMap);
            } catch (error) {
                console.error("Failed to load wallet data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Загрузка транзакций при переключении на вкладку history
    useEffect(() => {
        const loadTransactions = async () => {
            if (activeTab === "history" && wallet?.id) {
                try {
                    setLoadingTransactions(true);
                    setTransactionsOffset(0);
                    setHasMoreTransactions(true);
                    const response = await getTransactions(wallet.id, 0, 10);
                    setTransactions(response.items);
                    setTransactionsOffset(10);
                    setHasMoreTransactions(response.items.length === 10);
                } catch (error) {
                    console.error("Failed to load transactions:", error);
                    setTransactions([]);
                } finally {
                    setLoadingTransactions(false);
                }
            }
        };

        loadTransactions();
    }, [activeTab, wallet?.id]);

    // Функция для загрузки следующих транзакций
    const loadMoreTransactions = useCallback(async () => {
        if (loadingMoreTransactions || !hasMoreTransactions || !wallet?.id) return;
        
        try {
            setLoadingMoreTransactions(true);
            const response = await getTransactions(wallet.id, transactionsOffset, 10);
            
            if (response.items.length > 0) {
                setTransactions(prev => [...prev, ...response.items]);
                setTransactionsOffset(prev => prev + response.items.length);
                setHasMoreTransactions(response.items.length === 10);
            } else {
                setHasMoreTransactions(false);
            }
        } catch (error) {
            console.error("Failed to load more transactions:", error);
        } finally {
            setLoadingMoreTransactions(false);
        }
    }, [loadingMoreTransactions, hasMoreTransactions, wallet?.id, transactionsOffset]);

    // Intersection Observer для автоматической загрузки при прокрутке
    useEffect(() => {
        if (activeTab !== "history" || !hasMoreTransactions) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loadingMoreTransactions) {
                    loadMoreTransactions();
                }
            },
            { threshold: 0.1 }
        );

        const triggerElement = loadMoreTriggerRef.current;
        if (triggerElement) {
            observer.observe(triggerElement);
        }

        return () => {
            if (triggerElement) {
                observer.unobserve(triggerElement);
            }
        };
    }, [activeTab, hasMoreTransactions, loadingMoreTransactions, loadMoreTransactions]);

    const toggleTransaction = (id: string) => {
        setExpandedTransactions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // Функция для получения последней части sourceId после последнего дефиса
    const getSourceIdSuffix = (sourceId: string) => {
        const parts = sourceId.split('-');
        return parts[parts.length - 1];
    };

    const allTimeMiles = wallet?.allTimeBalance ?? 0;
    const availableToRedeem = wallet?.availableBalance ?? 0;
    const pending = wallet?.pendingBalance ?? 0;

    return (
        <div className="relative min-h-screen pb-20">
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

            {/* Tabs - на уровне хедера */}
            <div className="bg-background-dark px-4 py-2">
                <div className="relative flex justify-center gap-4">
                    <button
                        ref={accountsTabRef}
                        onClick={() => setActiveTab("accounts")}
                        className={`flex-1 text-center text-sm font-medium pb-1 ${
                            activeTab === "accounts"
                                ? "text-blue-600"
                                : "text-gray-500"
                        }`}
                    >
                        {t("passenger.wallet.accounts")}
                    </button>
                    <button
                        ref={historyTabRef}
                        onClick={() => setActiveTab("history")}
                        className={`flex-1 text-center text-sm font-medium pb-1 ${
                            activeTab === "history"
                                ? "text-blue-600"
                                : "text-gray-500"
                        }`}
                    >
                        {t("passenger.wallet.history")}
                    </button>
                    {/* Анимированный индикатор */}
                    <motion.div
                        className="absolute bottom-0 h-0.5 bg-blue-600"
                        initial={false}
                        animate={{
                            left: activeTab === "accounts" 
                                ? accountsTabRef.current?.offsetLeft || 0 
                                : historyTabRef.current?.offsetLeft || 0,
                            width: activeTab === "accounts"
                                ? accountsTabRef.current?.offsetWidth || 0
                                : historyTabRef.current?.offsetWidth || 0,
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                </div>
            </div>

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
                    <div className="space-y-4">
                        {/* Accounts Tab Content */}
                        {activeTab === "accounts" && (
                            <>
                                {loading ? (
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] p-6 border border-white/20">
                                        <Loader text={t("passenger.wallet.loading") || "Loading..."} />
                                    </div>
                                ) : (
                                    <>
                                        {/* Miles Accounts Section */}
                                        <div className="space-y-4">
                                            {/* All time Miles, Available to redeem and Pending */}
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* All time Miles - полная ширина, сверху */}
                                                <div className="col-span-2 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.1)] flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-1">
                                                        <p className="text-sm text-gray-200">{t("passenger.wallet.allTimeMiles")}</p>
                                                        <InfoTooltip 
                                                            text={t("passenger.wallet.allTimeMilesTooltip")}
                                                            position="right"
                                                            iconColor="blue"
                                                            tooltipClassName="!w-[200px]"
                                                        />
                                                    </div>
                                                    <p className="text-xl font-bold text-white">
                                                        {allTimeMiles.toLocaleString()}
                                                    </p>
                                                </div>

                                                {/* Available to redeem - снизу, первая колонка */}
                                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.1)] justify-between flex flex-col gap-2">
                                                    <p className="text-sm text-gray-200">{t("passenger.wallet.availableToRedeem")}</p>
                                                    <p className="text-xl font-bold text-white">
                                                        {availableToRedeem.toLocaleString()}
                                                    </p>
                                                </div>

                                                {/* Pending - снизу, вторая колонка */}
                                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.1)] justify-between flex flex-col gap-2">
                                                    <div className="flex items-center gap-1">
                                                        <p className="text-sm text-gray-200">{t("passenger.wallet.pending")}</p>
                                                        <InfoTooltip 
                                                            text={t("passenger.wallet.pendingTooltip")}
                                                            position="left"
                                                            iconColor="blue"
                                                            tooltipClassName="!w-[200px]"
                                                        />
                                                    </div>
                                                    <p className="text-xl font-bold text-white">
                                                        {pending.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Transfer Button */}
                                            <button
                                                onClick={() => router.push("/passenger/wallet/transfer")}
                                                className="bg-brand-blue text-white rounded-xl px-6 py-3 font-semibold hover:bg-[#0056C0] transition-all flex items-center justify-center gap-2 w-fit mx-auto"
                                            >
                                                <ArrowRightLeft className="h-5 w-5" />
                                                {t("passenger.wallet.transfer")}
                                            </button>
                                        </div>

                                        {/* Wishlist Section */}
                                        <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] p-6 border border-white/20">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-semibold text-white">{t("passenger.wallet.wishlist")}</h3>
                                                <button
                                                    onClick={() => router.push("/passenger/wallet/wishlist/new")}
                                                    className="bg-brand-blue text-white rounded-full p-2 hover:bg-[#0056C0] transition-all"
                                                >
                                                    <Plus className="h-5 w-5" />
                                                </button>
                                            </div>
                                            
                                            {wishlistItems.length > 0 ? (
                                                <div className="space-y-3">
                                                    {wishlistItems.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => router.push(`/passenger/wallet/wishlist/${item.id}`)}
                                                            className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-lg cursor-pointer hover:bg-white/15 transition-all border border-white/10"
                                                        >
                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold text-sm text-white">{item.name}</p>
                                                                <p className="text-xs text-gray-200 underline">
                                                                    {item.city ? `${item.country}, ${item.city}` : item.country}
                                                                </p>
                                                            </div>
                                                            
                                                            {/* Circular Progress on the right */}
                                                            <CircularProgress 
                                                                value={item.progress}
                                                                target={item.target}
                                                                size={70}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-200 text-sm text-center py-4">
                                                    {t("passenger.wallet.noWishlistItems")}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {/* History Tab Content */}
                        {activeTab === "history" && (
                            <div className="">
                                {loadingTransactions ? (
                                    <div className="py-8">
                                        <Loader text={t("passenger.wallet.loading") || "Loading..."} />
                                    </div>
                                ) : transactions.length === 0 ? (
                                    <p className="text-white text-sm text-center py-8">
                                        {t("passenger.wallet.noTransactions")}
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {transactions.map((transaction) => {
                                            // Используем тип транзакции напрямую из API
                                            const transactionType = transaction.type;
                                            const transactionStatus = transaction.status;
                                            
                                            const typeKey = transactionType.toLowerCase();
                                            const statusKey = transactionStatus.toLowerCase();
                                            
                                            // Определяем, положительная ли операция (TopUp и Transfer всегда положительные)
                                            const isPositive = transactionType === "TopUp" || transactionType === "Transfer";
                                            
                                            const isExpanded = expandedTransactions.has(transaction.id);
                                            // Для Transfer проверяем fromWishlistId/toWishlistId, для остальных - description/transactionId
                                            const hasDetails = transactionType === "Transfer" 
                                                ? !!(transaction.fromWishlistId || transaction.toWishlistId || transaction.transactionId)
                                                : !!(transaction.description || transaction.transactionId);
                                            
                                            return (
                                                <div
                                                    key={transaction.id}
                                                    className={`relative p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 ${hasDetails ? 'cursor-pointer hover:bg-white/15 transition-all' : ''}`}
                                                    onClick={() => hasDetails && toggleTransaction(transaction.id)}
                                                >
                                                    {/* Дата и Статус на одной строке сверху (статус только для TopUp) */}
                                                    <div className="flex items-center justify-between gap-2 mb-3">
                                                        <p className="text-xs text-gray-300">
                                                            {new Date(transaction.createdAt).toLocaleDateString(
                                                                i18n.language === 'ru' ? 'ru-RU' : 
                                                                i18n.language === 'kk' ? 'kk-KZ' : 'en-US',
                                                                {
                                                                    year: "numeric",
                                                                    month: "long",
                                                                    day: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                }
                                                            )}
                                                        </p>
                                                        {/* Статус справа (только для TopUp) */}
                                                        {transactionType === "TopUp" && (
                                                            <span className={`text-xs font-medium px-2 py-1 rounded flex-shrink-0 ${
                                                                transactionStatus === "Paid"
                                                                    ? "text-green-400 bg-green-400/20"
                                                                    : transactionStatus === "Cancelled"
                                                                    ? "text-red-400 bg-red-400/20"
                                                                    : "text-yellow-400 bg-yellow-400/20"
                                                            }`}>
                                                                {t(`passenger.wallet.transactionStatuses.${statusKey}`, { defaultValue: transactionStatus })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Тип • Категория */}
                                                    <div className="mb-2">
                                                        <p className="text-sm font-semibold text-white">
                                                            {t(`passenger.wallet.transactionTypes.${typeKey}`, { defaultValue: transactionType })}
                                                            {transaction.category && (
                                                                <>
                                                                    {" • "}
                                                                    {(() => {
                                                                        const categoryKey = transaction.category.toLowerCase().replace(/\s+/g, '');
                                                                        const translated = t(`passenger.wallet.transactionCategories.${categoryKey}`, { defaultValue: transaction.category });
                                                                        return translated !== `passenger.wallet.transactionCategories.${categoryKey}` ? translated : transaction.category;
                                                                    })()}
                                                                </>
                                                            )}
                                                        </p>
                                                    </div>
                                                    
                                                    {/* Expanded details */}
                                                    {isExpanded && (
                                                        <div className="mt-3 mb-2">
                                                            {transactionType === "Transfer" ? (
                                                                <>
                                                                    {/* Для Transfer показываем from → to */}
                                                                    <p className="text-sm text-gray-300 mb-2">
                                                                        {transaction.fromWishlistId 
                                                                            ? (wishlistsMap.get(transaction.fromWishlistId) || transaction.fromWishlistId)
                                                                            : t("passenger.wallet.availableToRedeem")
                                                                        } → {transaction.toWishlistId 
                                                                            ? (wishlistsMap.get(transaction.toWishlistId) || transaction.toWishlistId)
                                                                            : t("passenger.wallet.availableToRedeem")
                                                                        }
                                                                    </p>
                                                                    {transaction.transactionId && (
                                                                        <p className="text-xs text-gray-400">
                                                                            {getSourceIdSuffix(transaction.transactionId)}
                                                                        </p>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    {/* Для других типов показываем description и transactionId */}
                                                                    {transaction.description && (
                                                                        <p className="text-sm text-gray-300 mb-2">
                                                                            {transaction.description}
                                                                        </p>
                                                                    )}
                                                                    {transaction.transactionId && (
                                                                        <p className="text-xs text-gray-400">
                                                                            {getSourceIdSuffix(transaction.transactionId)}
                                                                        </p>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Сумма внизу */}
                                                    <p className={`font-bold text-base ${
                                                        isPositive 
                                                            ? "text-green-400" 
                                                            : "text-red-400"
                                                    }`}>
                                                        {isPositive ? "+" : "-"}
                                                        {Math.abs(transaction.miles).toLocaleString()} Miles
                                                    </p>
                                                    
                                                    {/* Chevron icon */}
                                                    {hasDetails && (
                                                        <div className="absolute bottom-4 right-4">
                                                            {isExpanded ? (
                                                                <ChevronUp className="h-5 w-5 text-gray-300" />
                                                            ) : (
                                                                <ChevronDown className="h-5 w-5 text-gray-300" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {/* Триггер для lazy load */}
                                        {hasMoreTransactions && (
                                            <div ref={loadMoreTriggerRef} className="py-4">
                                                {loadingMoreTransactions && (
                                                    <div className="text-center">
                                                        <Loader text={t("passenger.wallet.loadingMore") || "Загрузка..."} />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletPage;



