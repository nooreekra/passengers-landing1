"use client";

import React, { useState, Fragment, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { User, Mail, Phone, QrCode, ChevronDown, ChevronUp, Copy, Maximize2, X, Plane, Lock, ChevronRight, Camera, Star } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import Image from "next/image";
import { motion } from "framer-motion";
import InfoTooltip from "@/shared/ui/InfoTooltip";
import Loader from "@/shared/ui/Loader";
import { getTransactions, TransactionItem, getTierHistories, TierHistory, getTransactionsSummary, TransactionsSummary, getMilesSummary, MilesSummary, getTiers, Tier, getCurrentTier, CurrentTier, getWallet, getWishlists } from "@/shared/api/passenger";
import { useTranslation } from "react-i18next";
import i18n from "@/shared/i18n";
import { Html5Qrcode } from "html5-qrcode";
import { QRCodeSVG } from "qrcode.react";

// Transaction types
interface Transaction {
    id: string;
    date: Date;
    type: "income" | "expense"; // income or expense
    category: string; // Restaurant, Hotel, Trip, etc.
    miles: number; // number of miles
    description?: string; // additional description (e.g., route for trip)
    transactionType?: "TopUp" | "Transfer" | "Spent"; // тип транзакции
    status?: "Pending" | "Paid" | "Cancelled"; // статус транзакции
    transactionId?: string; // sourceId для отображения
    fromWishlistId?: string | null; // ID вишлиста откуда перевод
    toWishlistId?: string | null; // ID вишлиста куда перевод
}

// Circular progress component
const CircularProgress = ({
    label,
    value,
    target,
    unit = "",
    size = 80
}: {
    label: string;
    value: number;
    target: number;
    unit?: string;
    size?: number;
}) => {
    const { t } = useTranslation();
    const percentage = Math.min((value / target) * 100, 100);
    const radius = (size - 10) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const centerX = size / 2;
    const centerY = size / 2;
    const showCheckpoints = target < 30;
    const checkpointLength = 6; // длина чекпойнта
    const checkpointInnerRadius = radius - checkpointLength; // внутренний радиус (внутри круга)
    const checkpointOuterRadius = radius; // внешний радиус (на границе круга, не выходит за него)

    // Для Gym показываем только 1 чекпойнт (подписка на месяц)
    const checkpointCount = label === "Gym" ? 1 : (showCheckpoints ? target : 0);

    // Генерация чекпойнтов
    const checkpoints = checkpointCount > 0 ? Array.from({ length: checkpointCount }, (_, i) => {
        // SVG повернут на -90 градусов, поэтому начинаем с 0 градусов для верхней точки
        const angle = (i * 360 / checkpointCount);
        const angleRad = (angle * Math.PI) / 180;
        // Точки на окружности: обе внутри круга, не выходят за границу
        const x1 = centerX + checkpointInnerRadius * Math.cos(angleRad);
        const y1 = centerY + checkpointInnerRadius * Math.sin(angleRad);
        const x2 = centerX + checkpointOuterRadius * Math.cos(angleRad);
        const y2 = centerY + checkpointOuterRadius * Math.sin(angleRad);
        return { x1, y1, x2, y2 };
    }) : [];

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative bg-white/70 rounded-full" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#E5E7EB"
                        strokeWidth="4"
                        fill="none"
                    />
                    {/* Чекпойнты */}
                    {(showCheckpoints || label === "Gym") && checkpoints.map((checkpoint, index) => (
                        <line
                            key={index}
                            x1={checkpoint.x1}
                            y1={checkpoint.y1}
                            x2={checkpoint.x2}
                            y2={checkpoint.y2}
                            stroke="#9CA3AF"
                            strokeWidth="2"
                        />
                    ))}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#3B82F6"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {label === "Gym" ? (
                        <>
                            <div className="text-xs font-semibold text-brand-blue">{t("passenger.account.active")}</div>
                            <div className="text-[10px] text-brand-blue">{t("passenger.account.subscription")}</div>
                        </>
                    ) : (
                        <>
                            <div className="text-xs font-semibold text-brand-blue">{target}</div>
                            {unit && <div className="text-[10px] text-brand-blue">{unit}</div>}
                        </>
                    )}
                </div>
            </div>
            <div className="text-xs font-medium text-white text-center max-w-[80px]">
                {label}
            </div>
        </div>
    );
};

const AccountPage = () => {
    const { t } = useTranslation();
    const user = useSelector((state: RootState) => state.user.current);
    const [activeTab, setActiveTab] = useState<"details" | "transactions">("details");
    // Some transactions expanded by default
    const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());
    const [isQrExpanded, setIsQrExpanded] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const qrCodeScannerRef = useRef<Html5Qrcode | null>(null);
    const [transactionsData, setTransactionsData] = useState<TransactionItem[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [loadingMoreTransactions, setLoadingMoreTransactions] = useState(false);
    const [transactionsOffset, setTransactionsOffset] = useState(0);
    const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
    const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
    const [tierHistories, setTierHistories] = useState<TierHistory[]>([]);
    const [loadingTierHistories, setLoadingTierHistories] = useState(false);
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [loadingTiers, setLoadingTiers] = useState(false);
    const [currentTierData, setCurrentTierData] = useState<CurrentTier | null>(null);
    const [loadingCurrentTier, setLoadingCurrentTier] = useState(false);
    const [transactionsSummary, setTransactionsSummary] = useState<TransactionsSummary | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [milesSummary, setMilesSummary] = useState<MilesSummary | null>(null);
    const [loadingMilesSummary, setLoadingMilesSummary] = useState(false);
    const [wishlistsMap, setWishlistsMap] = useState<Map<string, string>>(new Map()); // Map для быстрого поиска названий вишлистов по ID
    const [wallet, setWallet] = useState<{ id: string } | null>(null);
    const detailsTabRef = useRef<HTMLButtonElement>(null);
    const transactionsTabRef = useRef<HTMLButtonElement>(null);

    // Mock data
    const mockData = {
        name: "MS Aliya Ismagulova",
        status: "Silver" as "Bronze" | "Silver" | "Gold",
        membershipId: "1M3354885139",
        totalMiles: 50000,
        pendingMiles: 10000,
        currentStatus: "Silver" as "Bronze" | "Silver" | "Gold",
        nextStatus: "Gold" as "Bronze" | "Silver" | "Gold",
        nextStatusDiscount: 25,
        progressToNext: 65, // 65% to next status
        categories: [
            { name: "Hotels", value: 1, target: 3, unit: "nights" },
            { name: "Banks", value: 1500, target: 3000, unit: "Miles" },
            { name: "Coffee Shops", value: 10, target: 15, unit: "visits" },
            { name: "Restaurants", value: 5, target: 10, unit: "visits" },
            { name: "Gas st.", value: 400, target: 800, unit: "Miles" },
            { name: "Gym", value: 1, target: 1, unit: "month subscription" },
        ],
        // Last 3 months for progress bar - будет заполнено из API
        lastThreeMonths: [],
        // Goal achievement data - будет заполнено из API
        trips: {
            current: 0,
            target: 0,
        },
        monthlyActivityGoal: 0,
    };

    // Загрузка списка тиров из справочника
    useEffect(() => {
        const fetchTiers = async () => {
            try {
                setLoadingTiers(true);
                const tiersData = await getTiers();
                setTiers(tiersData);
            } catch (error) {
                console.error('Ошибка при загрузке списка тиров:', error);
            } finally {
                setLoadingTiers(false);
            }
        };

        fetchTiers();
    }, []);

    // Загрузка текущего тира пользователя
    useEffect(() => {
        const fetchCurrentTier = async () => {
            try {
                setLoadingCurrentTier(true);
                const tierData = await getCurrentTier();
                setCurrentTierData(tierData);
            } catch (error) {
                console.error('Ошибка при загрузке текущего тира:', error);
            } finally {
                setLoadingCurrentTier(false);
            }
        };

        fetchCurrentTier();
    }, []);

    // Загрузка истории уровней лояльности
    useEffect(() => {
        const fetchTierHistories = async () => {
            try {
                setLoadingTierHistories(true);
                const histories = await getTierHistories(3);
                setTierHistories(histories);
            } catch (error) {
                console.error('Ошибка при загрузке истории уровней лояльности:', error);
            } finally {
                setLoadingTierHistories(false);
            }
        };

        fetchTierHistories();
    }, []);

    // Загрузка сводки по транзакциям
    useEffect(() => {
        const fetchSummary = async () => {
            try {
                setLoadingSummary(true);
                const summary = await getTransactionsSummary();
                setTransactionsSummary(summary);
            } catch (error) {
                console.error('Ошибка при загрузке сводки по транзакциям:', error);
            } finally {
                setLoadingSummary(false);
            }
        };

        fetchSummary();
    }, []);

    // Загрузка сводки по милям
    useEffect(() => {
        const fetchMilesSummary = async () => {
            try {
                setLoadingMilesSummary(true);
                const summary = await getMilesSummary();
                setMilesSummary(summary);
            } catch (error) {
                console.error('Ошибка при загрузке сводки по милям:', error);
            } finally {
                setLoadingMilesSummary(false);
            }
        };

        fetchMilesSummary();
    }, []);

    // Загрузка транзакций из API
    useEffect(() => {
        const fetchTransactions = async () => {
            if (activeTab === "transactions") {
                try {
                    setLoadingTransactions(true);
                    setTransactionsOffset(0);
                    setHasMoreTransactions(true);
                    const walletData = await getWallet();
                    setWallet(walletData);
                    const response = await getTransactions(walletData.id, 0, 10, true); // excludeTransfers = true
                    setTransactionsData(response.items);
                    setTransactionsOffset(10);
                    // Проверяем, есть ли еще транзакции для загрузки
                    setHasMoreTransactions(response.items.length === 10);
                    
                    // Загружаем вишлисты для отображения названий в Transfer транзакциях
                    try {
                        const wishlists = await getWishlists(walletData.id);
                        const wishlistsMap = new Map<string, string>();
                        wishlists.forEach(w => {
                            wishlistsMap.set(w.id, w.title);
                        });
                        setWishlistsMap(wishlistsMap);
                    } catch (error) {
                        console.error('Ошибка при загрузке вишлистов:', error);
                    }
                    
                    // Разворачиваем первые несколько транзакций по умолчанию
                    if (response.items.length > 0) {
                        const defaultExpanded = new Set(response.items.slice(0, 3).map(item => item.id));
                        setExpandedTransactions(defaultExpanded);
                    }
                } catch (error) {
                    console.error('Ошибка при загрузке транзакций:', error);
                } finally {
                    setLoadingTransactions(false);
                }
            }
        };

        fetchTransactions();
    }, [activeTab]);

    // Функция для загрузки следующих транзакций
    const loadMoreTransactions = useCallback(async () => {
        if (loadingMoreTransactions || !hasMoreTransactions || !wallet?.id) return;
        
        try {
            setLoadingMoreTransactions(true);
            const response = await getTransactions(wallet.id, transactionsOffset, 10, true); // excludeTransfers = true
            
            if (response.items.length > 0) {
                setTransactionsData(prev => [...prev, ...response.items]);
                setTransactionsOffset(prev => prev + response.items.length);
                // Проверяем, есть ли еще транзакции для загрузки
                setHasMoreTransactions(response.items.length === 10);
            } else {
                setHasMoreTransactions(false);
            }
        } catch (error) {
            console.error('Ошибка при загрузке дополнительных транзакций:', error);
            setHasMoreTransactions(false);
        } finally {
            setLoadingMoreTransactions(false);
        }
    }, [loadingMoreTransactions, hasMoreTransactions, wallet?.id, transactionsOffset]);

    // Intersection Observer для автоматической загрузки при прокрутке
    useEffect(() => {
        if (activeTab !== "transactions" || !hasMoreTransactions) return;

        let observer: IntersectionObserver | null = null;

        // Используем setTimeout чтобы дать время DOM обновиться
        const timeoutId = setTimeout(() => {
            const triggerElement = loadMoreTriggerRef.current;
            
            if (!triggerElement) return;

            observer = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && !loadingMoreTransactions) {
                        loadMoreTransactions();
                    }
                },
                { threshold: 0.1 }
            );

            observer.observe(triggerElement);
        }, 300);

        return () => {
            clearTimeout(timeoutId);
            if (observer) {
                observer.disconnect();
            }
        };
    }, [activeTab, hasMoreTransactions, loadingMoreTransactions, loadMoreTransactions, transactionsData.length]);

    // Вспомогательная функция для получения кода/типа тира (поддержка обоих форматов)
    const getTierCode = (tier: any): string => {
        if (!tier) return '';
        // Новый формат с type (приоритет для progressTier)
        if ('type' in tier && tier.type) {
            const typeStr = String(tier.type).toLowerCase().trim();
            // Извлекаем код тира из составных значений типа "Gold Member" -> "gold"
            const tierCodes = ["bronze", "silver", "gold", "platinum"];
            for (const code of tierCodes) {
                if (typeStr.includes(code)) {
                    return code;
                }
            }
            return typeStr;
        }
        // Старый формат с code
        if ('code' in tier && tier.code) {
            return String(tier.code).toLowerCase().trim();
        }
        return '';
    };

    // Преобразование tier histories в формат lastThreeMonths
    const lastThreeMonths = React.useMemo(() => {
        // Всегда возвращаем 3 элемента - последние 3 месяца от текущей даты
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const now = new Date();
        
        // Вычисляем последние 3 месяца (не включая текущий месяц)
        const months: Array<{ year: number; month: number; monthName: string }> = [];
        for (let i = 3; i >= 1; i--) {
            const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                year: targetDate.getFullYear(),
                month: targetDate.getMonth(),
                monthName: monthNames[targetDate.getMonth()]
            });
        }
        
        // Для каждого месяца ищем соответствующий статус в tierHistories
        return months.map(({ year, month, monthName }) => {
            // Ищем историю, которая соответствует этому месяцу и году
            const matchingHistory = tierHistories.find(history => {
                const historyDate = new Date(history.validFrom);
                return historyDate.getFullYear() === year && historyDate.getMonth() === month;
            });
            
            if (matchingHistory && matchingHistory.tier) {
                // Преобразуем code/type tier в статус
                const tierCode = getTierCode(matchingHistory.tier);
                let status: "Bronze" | "Silver" | "Gold" | "Platinum" | "No Status" = "Bronze";
                if (tierCode === "silver") {
                    status = "Silver";
                } else if (tierCode === "gold") {
                    status = "Gold";
                } else if (tierCode === "platinum") {
                    status = "Platinum";
                }
                return { month: monthName, status, tier: matchingHistory.tier };
            } else {
                // Если статус не найден для месяца, показываем "No Status"
                return { month: monthName, status: "No Status" as const, tier: null };
            }
        });
    }, [tierHistories]);

    // Получение текущего тира из API /api/tiers/me или из user.tier (fallback) - для всех мест кроме карт
    const currentTier = React.useMemo(() => {
        // Приоритет: currentTierData из /api/tiers/me
        if (currentTierData) {
            return currentTierData;
        }
        // Fallback на user.tier, если API еще не загрузился
        if (user?.tier) {
            return user.tier;
        }
        return null;
    }, [currentTierData, user]);

    // Получение текущего тира для карт из transactionsSummary.progressTier
    // Всегда используем данные из /api/tiers/me/summary для карт, чтобы цвета совпадали
    const currentTierForCards = React.useMemo(() => {
        // Используем progressTier из /api/tiers/me/summary для карт
        return transactionsSummary?.progressTier || null;
    }, [transactionsSummary?.progressTier]);

    // Получение фона карты в зависимости от статуса (для карт)
    const getCardBackground = (tier: any) => {
        if (!tier) {
            return "/images/membership/bronze.jpg";
        }
        // Получаем код тира (getTierCode уже делает toLowerCase и trim)
        const tierCode = getTierCode(tier);
        const validTiers = ["bronze", "silver", "gold", "platinum"];
        
        // Проверяем, есть ли код тира в списке валидных
        if (tierCode && validTiers.includes(tierCode)) {
            return `/images/membership/${tierCode}.jpg`;
        }
        
        // Если код не найден, пытаемся определить по name
        if (tier.name) {
            const nameLower = tier.name.toLowerCase().trim();
            if (nameLower.includes("gold")) return "/images/membership/gold.jpg";
            if (nameLower.includes("silver")) return "/images/membership/silver.jpg";
            if (nameLower.includes("platinum")) return "/images/membership/platinum.jpg";
            if (nameLower.includes("bronze")) return "/images/membership/bronze.jpg";
        }
        
        // Fallback на бронзу
        return "/images/membership/bronze.jpg";
    };

    // Определение текущего статуса на основе user.tier
    const currentStatus = React.useMemo(() => {
        if (currentTier) {
            const tierCode = getTierCode(currentTier);
            // Преобразуем type/code в статус для обратной совместимости
            if (tierCode === "bronze") return "Bronze";
            if (tierCode === "silver") return "Silver";
            if (tierCode === "gold") return "Gold";
        }
        // Fallback на последний месяц из истории, если нет текущего тира
        if (lastThreeMonths.length > 0) {
            return lastThreeMonths[lastThreeMonths.length - 1].status;
        }
        return "Bronze"; // Дефолтный статус
    }, [currentTier, lastThreeMonths]);

    // Определение следующего тира на основе levelOrder из справочника (для остальных мест)
    const nextTier = React.useMemo(() => {
        if (!currentTier || tiers.length === 0) return null;

        // Сортируем тиры по levelOrder (от меньшего к большему: Bronze=1, Silver=2, Gold=3)
        const sortedTiers = [...tiers].sort((a, b) => a.levelOrder - b.levelOrder);

        // Находим текущий тир в справочнике по id
        const currentIndex = sortedTiers.findIndex(t => t.id === currentTier.id);

        // Если текущий тир не найден в справочнике, пытаемся найти по type/code
        if (currentIndex === -1) {
            const currentTierCode = getTierCode(currentTier);
            const foundByType = sortedTiers.findIndex(t => t.code.toLowerCase() === currentTierCode);
            if (foundByType === -1) {
                // Если не нашли вообще, возвращаем null
                return null;
            }
            // Если нашли по type/code, используем этот индекс
            const actualIndex = foundByType;
            // Если текущий тир - последний, следующий остается тем же
            if (actualIndex >= sortedTiers.length - 1) {
                return currentTier;
            }
            // Возвращаем следующий тир по порядку
            return sortedTiers[actualIndex + 1];
        }

        // Если текущий тир - последний, следующий остается тем же
        if (currentIndex >= sortedTiers.length - 1) {
            return currentTier;
        }

        // Возвращаем следующий тир по порядку (более высокий levelOrder)
        return sortedTiers[currentIndex + 1];
    }, [currentTier, tiers]);

    // Определение следующего тира для карт на основе currentTierForCards
    const nextTierForCards = React.useMemo(() => {
        if (!currentTierForCards || tiers.length === 0) return null;

        // Сортируем тиры по levelOrder (от меньшего к большему: Bronze=1, Silver=2, Gold=3)
        const sortedTiers = [...tiers].sort((a, b) => a.levelOrder - b.levelOrder);

        // Находим текущий тир в справочнике по id
        const currentIndex = sortedTiers.findIndex(t => t.id === currentTierForCards.id);

        // Если текущий тир не найден в справочнике, пытаемся найти по type/code
        if (currentIndex === -1) {
            const currentTierCode = getTierCode(currentTierForCards);
            const foundByType = sortedTiers.findIndex(t => t.code.toLowerCase() === currentTierCode);
            if (foundByType === -1) {
                // Если не нашли вообще, возвращаем null
                return null;
            }
            // Если нашли по type/code, используем этот индекс
            const actualIndex = foundByType;
            // Если текущий тир - последний, следующий остается тем же
            if (actualIndex >= sortedTiers.length - 1) {
                return currentTierForCards;
            }
            // Возвращаем следующий тир по порядку
            return sortedTiers[actualIndex + 1];
        }

        // Если текущий тир - последний, следующий остается тем же
        if (currentIndex >= sortedTiers.length - 1) {
            return currentTierForCards;
        }

        // Возвращаем следующий тир по порядку (более высокий levelOrder)
        return sortedTiers[currentIndex + 1];
    }, [currentTierForCards, tiers]);

    // Определение следующего статуса для обратной совместимости
    const nextStatus = React.useMemo(() => {
        if (nextTier) {
            const tierCode = getTierCode(nextTier);
            if (tierCode === "bronze") return "Bronze";
            if (tierCode === "silver") return "Silver";
            if (tierCode === "gold") return "Gold";
        }
        return "Gold";
    }, [nextTier]);

    // Преобразование summary данных в формат компонента
    const tripsData = React.useMemo(() => {
        if (transactionsSummary?.progressSummary) {
            return {
                current: transactionsSummary.progressSummary.tripsCompleted,
                target: transactionsSummary.progressSummary.tripsRequired,
            };
        }
        return mockData.trips;
    }, [transactionsSummary]);

    const monthlyActivityGoal = React.useMemo(() => {
        return transactionsSummary?.progressSummary?.monthlyActivityRequired || mockData.monthlyActivityGoal;
    }, [transactionsSummary]);

    const categoriesData = React.useMemo(() => {
        if (transactionsSummary?.progressSummary && transactionsSummary.progressSummary.activities) {
            return transactionsSummary.progressSummary.activities.map(activity => {
                // Преобразуем metric в unit для отображения
                let unit = activity.metric;
                if (activity.metric === "miles") {
                    unit = "Miles";
                } else if (activity.metric === "visits") {
                    unit = "visits";
                } else if (activity.metric === "nights") {
                    unit = "nights";
                } else if (activity.metric === "subscription") {
                    unit = "month subscription";
                }

                // Преобразуем название для отображения
                let displayName = activity.name;
                if (activity.name === "Gas Stations") {
                    displayName = "Gas st.";
                }

                return {
                    name: displayName,
                    value: activity.completed,
                    target: activity.required,
                    unit: unit,
                };
            });
        }
        return mockData.categories;
    }, [transactionsSummary]);

    const monthlyActivityCompleted = React.useMemo(() => {
        if (transactionsSummary?.progressSummary) {
            return transactionsSummary.progressSummary.monthlyActivityCompleted;
        }
        return categoriesData.filter(cat => cat.value >= cat.target).length;
    }, [transactionsSummary, categoriesData]);

    // Преобразование данных API в формат компонента для транзакций
    const transactions: Transaction[] = (transactionsData || [])
        .map(item => ({
            id: item.id,
            date: new Date(item.createdAt),
            type: item.type === "TopUp" || item.type === "Transfer" ? "income" : "expense",
            category: item.category,
            miles: Math.abs(item.miles), // Используем абсолютное значение, знак определяется типом
            description: item.description,
            transactionType: item.type, // Сохраняем тип транзакции
            status: item.status, // Сохраняем статус
            transactionId: item.transactionId, // Сохраняем sourceId
            fromWishlistId: item.fromWishlistId, // Сохраняем fromWishlistId
            toWishlistId: item.toWishlistId, // Сохраняем toWishlistId
        }));

    // Group transactions by month
    const groupedTransactions = transactions.reduce((acc, transaction) => {
        const monthKey = `${transaction.date.getFullYear()}-${transaction.date.getMonth()}`;
        if (!acc[monthKey]) {
            acc[monthKey] = [];
        }
        acc[monthKey].push(transaction);
        return acc;
    }, {} as Record<string, Transaction[]>);

    // Sort months in descending order
    const sortedMonths = Object.keys(groupedTransactions).sort((a, b) => {
        const [yearA, monthA] = a.split("-").map(Number);
        const [yearB, monthB] = b.split("-").map(Number);
        if (yearA !== yearB) return yearB - yearA;
        return monthB - monthA;
    });

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

    const formatMonthYear = (monthKey: string) => {
        const [year, month] = monthKey.split("-").map(Number);
        const date = new Date(year, month, 1);
        return date.toLocaleDateString(
            i18n.language === 'ru' ? 'ru-RU' : 
            i18n.language === 'kk' ? 'kk-KZ' : 'en-US',
            { month: "long", year: "numeric" }
        ).toUpperCase();
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString(
            i18n.language === 'ru' ? 'ru-RU' : 
            i18n.language === 'kk' ? 'kk-KZ' : 'en-US',
            {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    // Функция для получения последней части sourceId после последнего дефиса
    const getSourceIdSuffix = (sourceId: string) => {
        const parts = sourceId.split('-');
        return parts[parts.length - 1];
    };

    const handleCopyMembershipId = () => {
        if (user?.imsNumber) {
            navigator.clipboard.writeText(user.imsNumber);
            // Can add toast notification here
        }
    };

    const handleStartScanning = async () => {
        try {
            setIsScanning(true);
            // Небольшая задержка для рендеринга контейнера
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const scanner = new Html5Qrcode("qr-reader");
            qrCodeScannerRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText) => {
                    // QR-код успешно отсканирован
                    console.log("QR Code scanned:", decodedText);
                    handleStopScanning();
                    // Здесь можно добавить логику обработки отсканированного QR-кода
                    // Например, переход на страницу партнера или обработка данных
                },
                (errorMessage) => {
                    // Игнорируем ошибки сканирования (они происходят постоянно, пока не найден QR)
                }
            );
        } catch (error) {
            console.error("Error starting QR scanner:", error);
            setIsScanning(false);
        }
    };

    const handleStopScanning = async () => {
        if (qrCodeScannerRef.current) {
            try {
                await qrCodeScannerRef.current.stop();
                await qrCodeScannerRef.current.clear();
            } catch (error) {
                console.error("Error stopping QR scanner:", error);
            }
            qrCodeScannerRef.current = null;
        }
        setIsScanning(false);
    };

    // Очистка сканера при закрытии модалки или размонтировании компонента
    useEffect(() => {
        return () => {
            if (qrCodeScannerRef.current) {
                const scanner = qrCodeScannerRef.current;
                scanner.stop().catch(() => {}).then(() => {
                    try {
                        scanner.clear();
                    } catch (e) {
                        // Игнорируем ошибки очистки
                    }
                });
            }
        };
    }, []);

    // Функция для получения hex цвета статуса из тира или fallback
    const getStatusColor = (status: string): string => {
        // Сначала пытаемся найти в справочнике тиров
        const tier = tiers.find(t => t.code.toLowerCase() === status.toLowerCase());
        if (tier) {
            return tier.color;
        }
        // Fallback на старые цвета (hex значения)
        const statusColors: Record<string, string> = {
            Bronze: "#CD7F32", // amber-600 equivalent
            Silver: "#9CA3AF", // gray-400 equivalent
            Gold: "#EAB308", // yellow-500 equivalent
        };
        return statusColors[status] || "#9CA3AF";
    };

    // Функция для получения класса цвета для timeline (используем hex в style)
    const getStatusColorClass = (status: string): string => {
        const statusColors: Record<string, string> = {
            Bronze: "bg-amber-600",
            Silver: "bg-gray-400",
            Gold: "bg-yellow-500",
        };
        return statusColors[status] || "bg-gray-400";
    };

    const statusOrder: ("Bronze" | "Silver" | "Gold")[] = ["Bronze", "Silver", "Gold"];
    // Проверяем, что currentStatus входит в statusOrder, иначе используем индекс 0
    const currentIndex = (statusOrder as readonly string[]).includes(currentStatus)
        ? statusOrder.indexOf(currentStatus as "Bronze" | "Silver" | "Gold")
        : 0;
    const nextIndex = currentIndex < statusOrder.length - 1 ? currentIndex + 1 : currentIndex;

    // Проверка загрузки основных данных
    const isLoading = loadingTiers || loadingSummary || loadingMilesSummary || loadingCurrentTier;

    return (
        <div className="relative min-h-screen pb-20">
            {/* Header with logo */}
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
                        ref={detailsTabRef}
                        onClick={() => setActiveTab("details")}
                        className={`flex-1 text-center text-sm font-medium pb-1 ${activeTab === "details"
                                ? "text-blue-600"
                                : "text-gray-500"
                            }`}
                    >
                        {t("passenger.account.accountDetails")}
                    </button>
                    <button
                        ref={transactionsTabRef}
                        onClick={() => setActiveTab("transactions")}
                        className={`flex-1 text-center text-sm font-medium pb-1 ${activeTab === "transactions"
                                ? "text-blue-600"
                                : "text-gray-500"
                            }`}
                    >
                        {t("passenger.account.recentTransactions")}
                    </button>
                    {/* Анимированный индикатор */}
                    <motion.div
                        className="absolute bottom-0 h-0.5 bg-blue-600"
                        initial={false}
                        animate={{
                            left: activeTab === "details"
                                ? detailsTabRef.current?.offsetLeft || 0
                                : transactionsTabRef.current?.offsetLeft || 0,
                            width: activeTab === "details"
                                ? detailsTabRef.current?.offsetWidth || 0
                                : transactionsTabRef.current?.offsetWidth || 0,
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                </div>
            </div>

            {/* Background image */}
            <div className="absolute inset-0 -z-10">
                <Image
                    src="/images/passengersbg.png"
                    alt="Background"
                    fill
                    className="object-cover"
                    priority
                />
                {/* Darkening overlay for readability */}
                <div className="absolute inset-0 bg-black/45" />
            </div>

            <div className="relative px-4 py-6">
                <div className="max-w-[600px] mx-auto">
                    {/* Loader для основных данных */}
                    {isLoading && (
                        <Loader text={t("passenger.account.loading")} textColor="text-label-white" />
                    )}

                    {/* Account Details Tab */}
                    {!isLoading && activeTab === "details" && (
                        <>
                            {/* User Info Section */}
                            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-white/20 mb-6">
                                <div className="p-6">
                                    <div className="flex flex-col items-center mb-4">
                                        <div className="text-center">
                                            <h2 className="text-xl font-semibold mb-2 text-white">
                                                {user ? `${user.firstName} ${user.lastName}` : mockData.name}
                                            </h2>
                                            {currentTier && (
                                                <div className="inline-block relative px-3 py-1 rounded-md text-white text-sm font-medium overflow-hidden">
                                                    {/* Background image */}
                                                    <div className="absolute inset-0">
                                                        <Image
                                                            src={getCardBackground(currentTier)}
                                                            alt={`${currentTier.name} tier background`}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    {/* Overlay for better text readability */}
                                                    <div className="absolute inset-0 bg-black/30" />
                                                    {/* Status text */}
                                                    <span className="relative z-10">{currentTier.name}</span>
                                                </div>
                                            )}
                                            <div className="mt-3">
                                                <p className="text-xs text-gray-200">{t("passenger.account.imsSavvyMember")}</p>
                                                <p className="text-sm font-medium text-white">
                                                    {user?.imsNumber || "—"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Miles Info */}
                                    <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6">
                                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 sm:p-4 border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.1)] flex items-center justify-between gap-1 sm:gap-3">
                                            <div className="flex items-center gap-1">
                                                <p className="text-xs sm:text-sm text-gray-200">{t("passenger.account.totalMiles")}</p>
                                                <InfoTooltip
                                                    text={t("passenger.account.totalMilesTooltip")}
                                                    position="top"
                                                    iconColor="blue"
                                                    tooltipClassName="!w-[200px]"
                                                />
                                            </div>
                                            <p className="text-base sm:text-xl font-bold text-white">
                                                {(milesSummary?.totalMiles ?? mockData.totalMiles).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 sm:p-4 border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.1)] flex items-center justify-between gap-1 sm:gap-3">
                                            <div className="flex items-center gap-1">
                                                <p className="text-xs sm:text-sm text-gray-200">{t("passenger.account.pending")}</p>
                                                <InfoTooltip
                                                    text={t("passenger.account.pendingTooltip")}
                                                    position="left"
                                                    iconColor="blue"
                                                    tooltipClassName="!w-[200px]"
                                                />
                                            </div>
                                            <p className="text-base sm:text-xl font-bold text-white">
                                                {(milesSummary?.unconfirmed ?? mockData.pendingMiles).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* QR Code Section */}
                                    <div className="flex flex-col items-center mb-12">
                                        <div className="relative">
                                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    {user?.imsNumber ? (
                                                        <QRCodeSVG 
                                                            value={user.imsNumber} 
                                                            size={128}
                                                            level="M"
                                                            includeMargin={false}
                                                        />
                                                    ) : (
                                                        <QrCode className="h-16 w-16 text-gray-400" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Resize button */}
                                            <button
                                                onClick={() => setIsQrExpanded(true)}
                                                className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-2 shadow-lg border-2 border-gray-200 hover:border-blue-500 transition-colors"
                                            >
                                                <Maximize2 className="h-5 w-5 text-gray-600" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Digital Card Modal */}
                                    <Transition appear show={isQrExpanded} as={Fragment}>
                                        <Dialog as="div" className="relative z-50" onClose={() => setIsQrExpanded(false)}>
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
                                                <Transition.Child
                                                    as={Fragment}
                                                    enter="ease-out duration-300"
                                                    enterFrom="opacity-0"
                                                    enterTo="opacity-100"
                                                    leave="ease-in duration-200"
                                                    leaveFrom="opacity-100"
                                                    leaveTo="opacity-0"
                                                >
                                                    <Dialog.Panel className="w-full h-full bg-gray-100 flex flex-col overflow-hidden">
                                                        {/* Close button */}
                                                        <div className="flex justify-end p-4 flex-shrink-0">
                                                            <button
                                                                onClick={() => setIsQrExpanded(false)}
                                                                className="text-gray-500 hover:text-gray-700 transition-colors"
                                                            >
                                                                <X className="h-6 w-6" />
                                                            </button>
                                                        </div>

                                                        <div className="flex-1 overflow-y-auto flex flex-col items-center px-6 pb-6 pt-4 gap-6 min-h-0">
                                                            {/* Digital Card */}
                                                            <div className="relative rounded-xl p-6 shadow-lg overflow-hidden flex-shrink-0" style={{ width: '320px', height: '500px' }}>
                                                                {/* Background image based on tier */}
                                                                <div className="absolute inset-0">
                                                                    <Image
                                                                        src={getCardBackground(currentTier)}
                                                                        alt="Membership card background"
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                </div>

                                                                {/* Overlay for better text readability */}
                                                                <div className="absolute inset-0 bg-black/20" />

                                                                {/* Decorative lines */}
                                                                <div className="absolute inset-0 opacity-10">
                                                                    <div className="absolute top-0 left-0 w-full h-full" style={{
                                                                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
                                                                    }} />
                                                                </div>

                                                                <div className="relative z-10 h-full flex flex-col">
                                                                    {/* Logo */}
                                                                    <div className="flex items-start mb-6">
                                                                        <div className="rounded-lg p-2">
                                                                            <Image
                                                                                src="/images/logo.png"
                                                                                alt="IMS Savvy"
                                                                                width={120}
                                                                                height={26}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {/* Name, Membership ID and Status */}
                                                                    <div className="flex items-start justify-between mb-auto mt-4">
                                                                        {/* Left side: Name and Membership ID */}
                                                                        <div className="flex-1">
                                                                            <p className="text-white text-sm font-semibold mb-1">
                                                                                {user ? `${user.firstName} ${user.lastName}`.toUpperCase() : mockData.name.toUpperCase()}
                                                                            </p>
                                                                            <p className="text-white text-xs font-medium">
                                                                                {t("passenger.account.membership")} {user?.imsNumber || "—"}
                                                                            </p>
                                                                        </div>
                                                                        {/* Right side: Status */}
                                                                        {currentTier && (
                                                                            <div className="ml-4">
                                                                                <span
                                                                                    className="text-white text-lg italic font-semibold px-4 py-2 rounded-full shadow-lg inline-block"
                                                                                    style={{
                                                                                        backgroundColor: currentTier.color,
                                                                                        boxShadow: `0 4px 14px 0 ${currentTier.color}40`
                                                                                    }}
                                                                                >
                                                                                    {currentTier.name}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* QR Code */}
                                                            <div className="flex flex-col items-center flex-shrink-0 gap-4">
                                                                <div className="bg-white rounded-lg p-4 shadow-md">
                                                                    <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                                                                        {user?.imsNumber ? (
                                                                            <QRCodeSVG 
                                                                                value={user.imsNumber} 
                                                                                size={256}
                                                                                level="M"
                                                                                includeMargin={false}
                                                                            />
                                                                        ) : (
                                                                            <QrCode className="h-48 w-48 text-gray-400" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Camera button for scanning QR */}
                                                                <button
                                                                    onClick={handleStartScanning}
                                                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md"
                                                                    title={t("passenger.account.scanQRCode") || "Scan QR Code"}
                                                                >
                                                                    <Camera className="h-5 w-5" />
                                                                    <span>{t("passenger.account.scanQRCode") || "Scan QR Code"}</span>
                                                                </button>
                                                            </div>

                                                            {/* Instruction text */}
                                                            <p className="text-sm text-gray-600 text-center">
                                                                {t("passenger.account.completeTicketTransactions")}
                                                            </p>

                                                            {/* Copy to clipboard button */}
                                                            {user?.imsNumber && (
                                                                <button
                                                                    onClick={handleCopyMembershipId}
                                                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                                                                    title={t("passenger.account.copyMembershipId")}
                                                                >
                                                                    <Copy className="h-4 w-4" />
                                                                    <span>{t("passenger.account.copyToClipboard")}</span>
                                                                </button>
                                                            )}

                                                            {/* Membership ID with copy */}
                                                            {user?.imsNumber && (
                                                                <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-blue-500 rounded-lg bg-blue-50">
                                                                    <span className="text-sm font-semibold text-blue-600">
                                                                        {user.imsNumber}
                                                                    </span>
                                                                    <button
                                                                        onClick={handleCopyMembershipId}
                                                                        className="p-1 hover:bg-blue-100 rounded transition-colors"
                                                                        title={t("passenger.account.copyMembershipId")}
                                                                    >
                                                                        <Copy className="h-4 w-4 text-blue-600" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Dialog.Panel>
                                                </Transition.Child>
                                            </div>
                                        </Dialog>
                                    </Transition>

                                    {/* QR Scanner Modal */}
                                    <Transition appear show={isScanning} as={Fragment}>
                                        <Dialog as="div" className="relative z-50" onClose={handleStopScanning}>
                                            <Transition.Child
                                                as={Fragment}
                                                enter="ease-out duration-300"
                                                enterFrom="opacity-0"
                                                enterTo="opacity-100"
                                                leave="ease-in duration-200"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                            >
                                                <div className="fixed inset-0 bg-black/75" />
                                            </Transition.Child>

                                            <div className="fixed inset-0 overflow-y-auto">
                                                <Transition.Child
                                                    as={Fragment}
                                                    enter="ease-out duration-300"
                                                    enterFrom="opacity-0 scale-95"
                                                    enterTo="opacity-100 scale-100"
                                                    leave="ease-in duration-200"
                                                    leaveFrom="opacity-100 scale-100"
                                                    leaveTo="opacity-0 scale-95"
                                                >
                                                    <Dialog.Panel className="w-full h-full bg-gray-900 flex flex-col overflow-hidden">
                                                        {/* Close button */}
                                                        <div className="flex justify-end p-4 flex-shrink-0">
                                                            <button
                                                                onClick={handleStopScanning}
                                                                className="text-white hover:text-gray-300 transition-colors"
                                                            >
                                                                <X className="h-6 w-6" />
                                                            </button>
                                                        </div>

                                                        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 pb-6 pt-4 gap-6 min-h-0">
                                                            <h2 className="text-xl font-semibold text-white text-center">
                                                                {t("passenger.account.scanQRCode") || "Scan QR Code"}
                                                            </h2>
                                                            <p className="text-sm text-gray-400 text-center">
                                                                {t("passenger.account.scanQRCodeInstruction") || "Point your camera at the QR code"}
                                                            </p>
                                                            
                                                            {/* QR Scanner Container */}
                                                            <div className="w-full max-w-md">
                                                                <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>
                                                            </div>
                                                        </div>
                                                    </Dialog.Panel>
                                                </Transition.Child>
                                            </div>
                                        </Dialog>
                                    </Transition>

                                    {/* Status Timeline - Last 3 Months */}
                                    <div className="py-8 mb-6 border-t border-white">
                                        <h2 className="text-lg font-semibold text-white mb-2 text-center">Your progess</h2>

                                        <div className="flex items-center gap-1 mb-2">
                                            <h4 className="text-sm text-white text-left">Last 3 months</h4>
                                            <InfoTooltip
                                                text={t("passenger.account.lastThreeMonthsTooltip") || "Shows your tier status for the last 3 months"}
                                                position="top"
                                                iconColor="blue"
                                                tooltipClassName="!w-[200px]"
                                            />
                                        </div>
                                        <div className="relative">
                                            {loadingTierHistories ? (
                                                <div className="text-center py-4 text-white text-sm">{t("passenger.account.loadingTierHistories")}</div>
                                            ) : lastThreeMonths.length === 0 ? (
                                                <div className="text-center py-4 text-white text-sm">{t("passenger.account.noTierData")}</div>
                                            ) : (
                                                <>
                                                    <div className="h-8 overflow-visible flex gap-1">
                                                        {lastThreeMonths.map((monthData, index) => {
                                                            const isFirst = index === 0;
                                                            const isLast = index === lastThreeMonths.length - 1;
                                                            const hasNoStatus = !monthData.tier;
                                                            
                                                            // Получаем фон из тира
                                                            const getTierBackground = () => {
                                                                if (monthData.tier) {
                                                                    const tierCode = getTierCode(monthData.tier);
                                                                    const validTiers = ["bronze", "silver", "gold", "platinum"];
                                                                    if (validTiers.includes(tierCode)) {
                                                                        return `/images/membership/${tierCode}.jpg`;
                                                                    }
                                                                }
                                                                // Fallback на основе статуса
                                                                const statusCode = monthData.status.toLowerCase();
                                                                if (["bronze", "silver", "gold", "platinum"].includes(statusCode)) {
                                                                    return `/images/membership/${statusCode}.jpg`;
                                                                }
                                                                return "/images/membership/bronze.jpg";
                                                            };
                                                            
                                                            return (
                                                                <div
                                                                    key={index}
                                                                    className={`h-full flex-1 relative overflow-hidden ${isFirst ? 'rounded-l-full' : ''
                                                                        } ${isLast ? 'rounded-r-full' : ''
                                                                        }`}
                                                                >
                                                                    {hasNoStatus ? (
                                                                        // Серый фон для отсутствующего статуса
                                                                        <div className="absolute inset-0 bg-gray-500" />
                                                                    ) : (
                                                                        <>
                                                                            {/* Background image */}
                                                                            <div className="absolute inset-0">
                                                                                <Image
                                                                                    src={getTierBackground()}
                                                                                    alt={`${monthData.status} tier background`}
                                                                                    fill
                                                                                    className="object-cover"
                                                                                />
                                                                            </div>
                                                                            {/* Overlay for better text readability */}
                                                                            <div className="absolute inset-0 bg-black/30 py-3" />
                                                                        </>
                                                                    )}
                                                                    {/* Status label inside segment */}
                                                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                                                        <span className="text-[12px] font-medium text-white">
                                                                            {hasNoStatus ? (t("passenger.account.noStatus") || "No Status") : monthData.status}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Month labels below timeline */}
                                                    <div className="flex mt-1 gap-1">
                                                        {lastThreeMonths.map((monthData, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex flex-col items-center flex-1"
                                                            >
                                                                <span className="text-xs text-white font-medium">{monthData.month}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        {/* Status benefits note */}
                                        <p className="text-xs text-white/80 text-center mt-4">
                                            {t("passenger.account.statusBenefitsNote")}
                                        </p>
                                    </div>
                                </div>




                                {/* Status Progress and Monthly Activity Section */}
                                <div 
                                    className="p-6 relative overflow-hidden"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.3)',
                                        backdropFilter: 'blur(20px)',
                                        WebkitBackdropFilter: 'blur(20px)',
                                        borderTopLeftRadius: '0',
                                        borderTopRightRadius: '0',
                                        borderBottomLeftRadius: '1rem',
                                        borderBottomRightRadius: '1rem',
                                        border: '1px solid rgba(255, 255, 255, 0.4)',
                                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                                    }}
                                >
                                    {/* Status Cards - Current and Next */}
                                    <div className="mb-3">
                                        <h3 className="text-sm text-white text-left">
                                            {(() => {
                                                const currentDate = new Date();
                                                const locale = i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'kk' ? 'kk-KZ' : 'en-US';
                                                const currentMonth = currentDate.toLocaleDateString(locale, { month: 'long' });
                                                return t("passenger.account.progressThisMonth", { month: currentMonth });
                                            })()}
                                        </h3>
                                    </div>
                                    <div className={`flex items-center mb-8 ${getTierCode(currentTierForCards) === 'platinum' ? 'justify-center' : 'justify-between'}`} style={{ gap: 'clamp(8px, 2vw, 16px)' }}>
                                        {/* Current status card on the left */}
                                        <div style={{ width: '40%', flexShrink: 0 }}>
                                            {currentTierForCards ? (
                                                <div className="relative shadow-lg overflow-hidden w-full card-padding" style={{ aspectRatio: '86/54', padding: '0.3rem', maxWidth: '100%', borderRadius: '0.5rem' }}>
                                                    {/* Background image */}
                                                    <div className="absolute inset-0">
                                                        <Image
                                                            src={getCardBackground(currentTierForCards)}
                                                            alt={`${currentStatus} tier background`}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>

                                                    {/* Overlay for better text readability */}
                                                    <div className="absolute inset-0 bg-black/20" />

                                                    {/* Decorative lines */}
                                                    <div className="absolute inset-0 opacity-10">
                                                        <div className="absolute top-0 left-0 w-full h-full" style={{
                                                            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
                                                        }} />
                                                    </div>

                                                    <div className="relative z-10 h-full flex flex-col">
                                                        {/* Logo */}
                                                        <div className="flex items-start card-logo-container">
                                                            <div className="card-logo-wrapper" style={{ padding: '0.125rem', borderRadius: '0.25rem' }}>
                                                                <Image
                                                                    src="/images/logo.png"
                                                                    alt="IMS Savvy"
                                                                    width={120}
                                                                    height={26}
                                                                    className="card-logo"
                                                                    style={{ width: 'clamp(2.5rem, 8vw, 3.75rem)', height: 'auto' }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Discount */}
                                                        <div className="flex-1 flex flex-col justify-center">
                                                            <div className="text-white card-discount-container" style={{ textShadow: '0 0.0625rem 0.125rem rgba(0,0,0,0.5)' }}>
                                                                <span className="font-bold card-discount-percent" style={{ fontSize: 'clamp(.8rem, 2vw, 1.125rem)' }}>{Math.round(currentTierForCards.discountPercent * 100)}%</span>
                                                                <span className="font-medium card-discount-text" style={{ fontSize: 'clamp(0.4rem, 2vw, 0.8875rem)', marginLeft: '0.1875rem' }}>{t("passenger.account.discount")}</span>
                                                            </div>
                                                        </div>

                                                        {/* Membership ID and Name */}
                                                        <div className="flex justify-between items-end mt-auto card-bottom-container" style={{ gap: '0.1875rem' }}>
                                                            <div className="flex-1 min-w-0 card-info-container">
                                                                {/* <p className="text-white font-medium card-ims-number" style={{ fontSize: 'clamp(0.45rem, 1.2vw, 0.5rem)', marginBottom: '0.0625rem', textShadow: '0 0.03125rem 0.0625rem rgba(0,0,0,0.7)' }}>
                                                                    {user?.imsNumber || "—"}
                                                                </p> */}
                                                                <p className="text-white font-semibold card-owner-name leading-[.8]" style={{ fontSize: 'clamp(0.4rem, 2vw, 0.325rem)', textShadow: '0 0.03125rem 0.0625rem rgba(0,0,0,0.7)' }}>
                                                                    {user 
                                                                        ? `${user.firstName}${user.lastName?.[0] ? ` ${user.lastName[0]}.` : ''}`.toUpperCase().trim() 
                                                                        : (() => {
                                                                            const parts = mockData.name.split(' ');
                                                                            return parts[0] + (parts[1] ? ` ${parts[1][0]}.` : '');
                                                                        })().toUpperCase().trim()
                                                                    }
                                                                </p>
                                                            </div>
                                                            <span
                                                                className="text-white italic font-semibold shadow-lg inline-block flex-shrink-0 card-status-badge"
                                                                style={{
                                                                    fontSize: 'clamp(0.45rem, .8vw, 0.3625rem)',
                                                                    padding: '0.125rem 0.275rem',
                                                                    borderRadius: '9999px',
                                                                    backgroundColor: currentTierForCards.color,
                                                                    boxShadow: `0 0.125rem 0.4375rem 0 ${currentTierForCards.color}40`,
                                                                    textShadow: '0 0.03125rem 0.0625rem rgba(0,0,0,0.5)'
                                                                }}
                                                            >
                                                                {currentTierForCards.name.split(' ')[0]}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative rounded-xl shadow-lg overflow-hidden bg-gray-400 w-full card-padding" style={{ aspectRatio: '86/54', padding: '0.3rem', maxWidth: '100%', borderRadius: '0.5rem' }}>
                                                    <div className="absolute inset-0 bg-black/20" />
                                                    <div className="relative z-10 h-full flex flex-col">
                                                        <div className="flex items-start card-logo-container">
                                                            <div className="card-logo-wrapper" style={{ padding: '0.125rem', borderRadius: '0.25rem' }}>
                                                                <Image
                                                                    src="/images/logo.png"
                                                                    alt="IMS Savvy"
                                                                    width={120}
                                                                    height={26}
                                                                    className="card-logo"
                                                                    style={{ width: 'clamp(2.5rem, 8vw, 3.75rem)', height: 'auto' }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 flex flex-col justify-center">
                                                            <div className="text-white card-discount-container" style={{ textShadow: '0 0.0625rem 0.125rem rgba(0,0,0,0.5)' }}>
                                                                <span className="font-bold card-discount-percent" style={{ fontSize: 'clamp(.8rem, 2vw, 1.125rem)' }}>0%</span>
                                                                <span className="font-medium card-discount-text" style={{ fontSize: 'clamp(0.4rem, 2vw, 0.9875rem)', marginLeft: '0.1875rem' }}>{t("passenger.account.discount")}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-end mt-auto card-bottom-container" style={{ gap: '0.1875rem' }}>
                                                            <div className="flex-1 min-w-0 card-info-container">
                                                                {/* <p className="text-white font-medium card-ims-number" style={{ fontSize: 'clamp(0.45rem, 1.2vw, 0.5rem)', marginBottom: '0.0625rem', textShadow: '0 0.03125rem 0.0625rem rgba(0,0,0,0.7)' }}>
                                                                    {user?.imsNumber || "—"}
                                                                </p> */}
                                                                <p className="text-white font-semibold card-owner-name leading-[.8]" style={{ fontSize: 'clamp(0.4rem, 1.5vw, 0.325rem)', textShadow: '0 0.03125rem 0.0625rem rgba(0,0,0,0.7)' }}>
                                                                    {user 
                                                                        ? `${user.firstName}${user.lastName?.[0] ? ` ${user.lastName[0]}.` : ''}`.toUpperCase().trim() 
                                                                        : (() => {
                                                                            const parts = mockData.name.split(' ');
                                                                            return parts[0] + (parts[1] ? ` ${parts[1][0]}.` : '');
                                                                        })().toUpperCase().trim()
                                                                    }
                                                                </p>
                                                            </div>
                                                            <span className="text-white italic font-semibold shadow-lg inline-block flex-shrink-0 bg-gray-500 card-status-badge" style={{ fontSize: 'clamp(0.45rem, .8vw, 0.3625rem)', padding: '0.125rem 0.275rem', borderRadius: '9999px', textShadow: '0 0.03125rem 0.0625rem rgba(0,0,0,0.5)' }}>
                                                                {currentStatus.split(' ')[0]}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Arrow between cards */}
                                        {getTierCode(currentTierForCards) !== 'platinum' && (
                                            <div className="flex items-center justify-center" style={{ width: '12%', flexShrink: 0 }}>
                                                <ChevronRight className="text-blue-600" style={{ width: 'clamp(20px, 4vw, 32px)', height: 'clamp(20px, 4vw, 32px)' }} />
                                                <ChevronRight className="text-blue-600" style={{ width: 'clamp(20px, 4vw, 32px)', height: 'clamp(20px, 4vw, 32px)' }} />
                                                <ChevronRight className="text-blue-600" style={{ width: 'clamp(20px, 4vw, 32px)', height: 'clamp(20px, 4vw, 32px)' }} />
                                            </div>
                                        )}

                                        {/* Next status card on the right */}
                                        {getTierCode(currentTierForCards) !== 'platinum' && (
                                            <div style={{ width: '40%', flexShrink: 0 }}>
                                            {nextTierForCards && nextTierForCards.id !== currentTierForCards?.id ? (
                                                <div className="relative shadow-lg overflow-hidden w-full card-padding" style={{ aspectRatio: '86/54', padding: '0.3rem', maxWidth: '100%', borderRadius: '0.5rem' }}>
                                                    {/* Background image */}
                                                    <div className="absolute inset-0">
                                                        <Image
                                                            src={getCardBackground(nextTierForCards)}
                                                            alt={`${nextStatus} tier background`}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>

                                                    {/* Overlay for better text readability */}
                                                    <div className="absolute inset-0 bg-black/20" />

                                                    {/* Decorative lines */}
                                                    <div className="absolute inset-0 opacity-10">
                                                        <div className="absolute top-0 left-0 w-full h-full" style={{
                                                            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
                                                        }} />
                                                    </div>

                                                    {/* Lock icon overlay */}
                                                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
                                                        <Lock className="text-white/80" style={{ width: 'clamp(40px, 6vw, 64px)', height: 'clamp(40px, 6vw, 64px)' }} />
                                                    </div>

                                                    <div className="relative z-10 h-full flex flex-col opacity-60">
                                                        {/* Logo */}
                                                        <div className="flex items-start card-logo-container">
                                                            <div className="card-logo-wrapper" style={{ padding: '0.125rem', borderRadius: '0.25rem' }}>
                                                                <Image
                                                                    src="/images/logo.png"
                                                                    alt="IMS Savvy"
                                                                    width={120}
                                                                    height={26}
                                                                    className="card-logo"
                                                                    style={{ width: 'clamp(2.5rem, 8vw, 3.75rem)', height: 'auto' }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Discount */}
                                                        <div className="flex-1 flex flex-col justify-center">
                                                            <div className="text-white card-discount-container" style={{ textShadow: '0 0.0625rem 0.125rem rgba(0,0,0,0.5)' }}>
                                                                <span className="font-bold card-discount-percent" style={{ fontSize: 'clamp(.8rem, 2vw, 1.125rem)' }}>{Math.round(nextTierForCards.discountPercent * 100)}%</span>
                                                                <span className="font-medium card-discount-text" style={{ fontSize: 'clamp(0.4rem, 2vw, 0.8875rem)', marginLeft: '0.1875rem' }}>{t("passenger.account.discount")}</span>
                                                            </div>
                                                        </div>

                                                        {/* Membership ID and Name */}
                                                        <div className="flex justify-between items-end mt-auto card-bottom-container" style={{ gap: '0.1875rem' }}>
                                                            <div className="flex-1 min-w-0 card-info-container">
                                                                {/* <p className="text-white font-medium card-ims-number" style={{ fontSize: 'clamp(0.45rem, 1.2vw, 0.5rem)', marginBottom: '0.0625rem', textShadow: '0 0.03125rem 0.0625rem rgba(0,0,0,0.7)' }}>
                                                                    {user?.imsNumber || "—"}
                                                                </p> */}
                                                                <p className="text-white font-semibold card-owner-name leading-[.8]" style={{ fontSize: 'clamp(0.4rem, 1.5vw, 0.325rem)', textShadow: '0 0.03125rem 0.0625rem rgba(0,0,0,0.7)' }}>
                                                                    {user 
                                                                        ? `${user.firstName}${user.lastName?.[0] ? ` ${user.lastName[0]}.` : ''}`.toUpperCase().trim() 
                                                                        : (() => {
                                                                            const parts = mockData.name.split(' ');
                                                                            return parts[0] + (parts[1] ? ` ${parts[1][0]}.` : '');
                                                                        })().toUpperCase().trim()
                                                                    }
                                                                </p>
                                                            </div>
                                                            <span
                                                                className="text-white italic font-semibold shadow-lg inline-block flex-shrink-0 card-status-badge"
                                                                style={{
                                                                    fontSize: 'clamp(0.45rem, .8vw, 0.3625rem)',
                                                                    padding: '0.125rem 0.275rem',
                                                                    borderRadius: '9999px',
                                                                    backgroundColor: nextTierForCards.color,
                                                                    boxShadow: `0 0.125rem 0.4375rem 0 ${nextTierForCards.color}40`,
                                                                    textShadow: '0 0.03125rem 0.0625rem rgba(0,0,0,0.5)'
                                                                }}
                                                            >
                                                                {nextTierForCards.name.split(' ')[0]}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : nextTierForCards ? (
                                                // Если следующий тир равен текущему (максимальный уровень), не показываем
                                                null
                                            ) : (
                                                <div className="relative rounded-xl shadow-lg overflow-hidden bg-yellow-500 w-full card-padding" style={{ aspectRatio: '86/54', padding: '0.3rem', maxWidth: '100%', borderRadius: '0.5rem' }}>
                                                    <div className="absolute inset-0 bg-black/20" />
                                                    <div className="relative z-10 h-full flex flex-col">
                                                        <div className="flex items-start card-logo-container" >
                                                            <div className="card-logo-wrapper" style={{ padding: '0.125rem', borderRadius: '0.25rem' }}>
                                                                <Image
                                                                    src="/images/logo.png"
                                                                    alt="IMS Savvy"
                                                                    width={120}
                                                                    height={26}
                                                                    className="card-logo"
                                                                    style={{ width: 'clamp(2.5rem, 8vw, 3.75rem)', height: 'auto' }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 flex flex-col justify-center">
                                                            <div className="text-white card-discount-container" style={{ textShadow: '0 0.0625rem 0.125rem rgba(0,0,0,0.5)' }}>
                                                                <span className="font-bold card-discount-percent" style={{ fontSize: 'clamp(.8rem, 2vw, 1.125rem)' }}>25%</span>
                                                                <span className="font-medium card-discount-text" style={{ fontSize: 'clamp(0.6rem, 1.5vw, 0.6875rem)', marginLeft: '0.1875rem' }}>{t("passenger.account.discount")}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-end mt-auto card-bottom-container" style={{ gap: '0.1875rem' }}>
                                                            <div className="flex-1 min-w-0 card-info-container">
                                                                {/* <p className="text-white font-medium card-ims-number" style={{ fontSize: 'clamp(0.45rem, 1.2vw, 0.5rem)', marginBottom: '0.0625rem', textShadow: '0 0.03125rem 0.0625rem rgba(0,0,0,0.7)' }}>
                                                                    {user?.imsNumber || "—"}
                                                                </p> */}
                                                                <p className="text-white font-semibold card-owner-name leading-[.8]" style={{ fontSize: 'clamp(0.4rem, 1.5vw, 0.325rem)', textShadow: '0 0.03125rem 0.0625rem rgba(0,0,0,0.7)' }}>
                                                                    {user 
                                                                        ? `${user.firstName}${user.lastName?.[0] ? ` ${user.lastName[0]}.` : ''}`.toUpperCase().trim() 
                                                                        : (() => {
                                                                            const parts = mockData.name.split(' ');
                                                                            return parts[0] + (parts[1] ? ` ${parts[1][0]}.` : '');
                                                                        })().toUpperCase().trim()
                                                                    }
                                                                </p>
                                                            </div>
                                                            <span className="text-white italic font-semibold shadow-lg inline-block flex-shrink-0 bg-yellow-600 card-status-badge" style={{ fontSize: 'clamp(0.45rem, .8vw, 0.3625rem)', padding: '0.125rem 0.275rem', borderRadius: '9999px', textShadow: '0 0.03125rem 0.0625rem rgba(0,0,0,0.5)' }}>
                                                                {nextStatus.split(' ')[0]}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Achieve next status text */}
                                    <div className="flex items-center gap-2 mb-6">
                                        <Star className="h-5 w-5 text-white flex-shrink-0" />
                                        <p className="text-sm text-white">
                                            {t("passenger.account.achieveNextStatus")}
                                        </p>
                                    </div>

                                    {/* Trips Option */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Plane className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-white mb-2">{t("passenger.account.trips")}</h3>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                                    style={{ width: `${tripsData.target > 0 ? Math.min((tripsData.current / tripsData.target) * 100, 100) : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-sm font-semibold text-white">
                                                {tripsData.current}/{tripsData.target}
                                            </span>
                                            <span className="text-sm font-semibold text-white">
                                                {tripsData.target > 0 ? Math.round((tripsData.current / tripsData.target) * 100) : 0}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* OR Divider */}
                                    <div className="flex items-center gap-4 my-6">
                                        <div className="flex-1 h-px bg-gray-300"></div>
                                        <span className="text-sm font-medium text-brand-blue">{t("passenger.account.or")}</span>
                                        <div className="flex-1 h-px bg-gray-300"></div>
                                    </div>

                                    {/* Monthly Activity Option */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 relative flex items-center justify-center">
                                            <svg width={48} height={48} className="transform -rotate-90">
                                                <circle
                                                    cx={24}
                                                    cy={24}
                                                    r={18}
                                                    stroke="#E5E7EB"
                                                    strokeWidth="4"
                                                    fill="none"
                                                />
                                                {/* Чекпойнты для Monthly Activity */}
                                                {Array.from({ length: monthlyActivityGoal }, (_, i) => {
                                                    const angle = (i * 360 / monthlyActivityGoal);
                                                    const angleRad = (angle * Math.PI) / 180;
                                                    const checkpointLength = 4;
                                                    const checkpointInnerRadius = 18 - checkpointLength;
                                                    const checkpointOuterRadius = 18;
                                                    const x1 = 24 + checkpointInnerRadius * Math.cos(angleRad);
                                                    const y1 = 24 + checkpointInnerRadius * Math.sin(angleRad);
                                                    const x2 = 24 + checkpointOuterRadius * Math.cos(angleRad);
                                                    const y2 = 24 + checkpointOuterRadius * Math.sin(angleRad);
                                                    return (
                                                        <line
                                                            key={i}
                                                            x1={x1}
                                                            y1={y1}
                                                            x2={x2}
                                                            y2={y2}
                                                            stroke="#9CA3AF"
                                                            strokeWidth="2"
                                                        />
                                                    );
                                                })}
                                                <circle
                                                    cx={24}
                                                    cy={24}
                                                    r={18}
                                                    stroke="#3B82F6"
                                                    strokeWidth="4"
                                                    fill="none"
                                                    strokeDasharray={2 * Math.PI * 18}
                                                    strokeDashoffset={2 * Math.PI * 18 * (1 - Math.min((monthlyActivityCompleted / monthlyActivityGoal), 1))}
                                                    strokeLinecap="round"
                                                    className="transition-all duration-500"
                                                />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-white mb-2">{t("passenger.account.monthlyActivity")}</h3>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${monthlyActivityGoal > 0 ? Math.min((monthlyActivityCompleted / monthlyActivityGoal) * 100, 100) : 0}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-semibold text-white">
                                                {monthlyActivityCompleted}/{monthlyActivityGoal}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Category Progress Circles */}
                                    <div className="mt-6">
                                        <div className="grid grid-cols-3 gap-6">
                                            {categoriesData.map((category, index) => (
                                                <CircularProgress
                                                    key={index}
                                                    label={category.name}
                                                    value={category.value}
                                                    target={category.target}
                                                    unit={category.unit}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </>
                    )}

                    {/* Recent Transactions Tab */}
                    {!isLoading && activeTab === "transactions" && (
                        <>
                            {loadingTransactions ? (
                                <div className="text-center py-8">
                                    <div className="text-white">{t("passenger.account.loadingTransactions")}</div>
                                </div>
                            ) : transactions.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-white">{t("passenger.account.noTransactions")}</div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {sortedMonths.map((monthKey) => (
                                        <div key={monthKey} className="mb-6">
                                            {/* Month Header */}
                                            <div className="text-sm font-semibold text-white mb-3">
                                                {formatMonthYear(monthKey)}
                                            </div>

                                            {/* Transactions for this month */}
                                            <div className="space-y-3">
                                                {groupedTransactions[monthKey].map((transaction) => {
                                                    const isExpanded = expandedTransactions.has(transaction.id);
                                                    const transactionType = transaction.transactionType || "Spent";
                                                    // Для Transfer проверяем fromWishlistId/toWishlistId, для остальных - description/transactionId
                                                    const hasDetails = transactionType === "Transfer" 
                                                        ? !!(transaction.fromWishlistId || transaction.toWishlistId || transaction.transactionId)
                                                        : !!(transaction.description || transaction.transactionId);
                                                    const status = transaction.status || "Pending";
                                                    
                                                    const typeKey = transactionType.toLowerCase();
                                                    const statusKey = status.toLowerCase();

                                                    // Определяем, положительная ли операция (TopUp и Transfer всегда положительные)
                                                    const isPositive = transactionType === "TopUp" || transactionType === "Transfer";
                                                    
                                                    return (
                                                        <div
                                                            key={transaction.id}
                                                            className={`relative bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10 ${hasDetails ? 'cursor-pointer hover:bg-white/15 transition-all' : ''}`}
                                                            onClick={() => hasDetails && toggleTransaction(transaction.id)}
                                                        >
                                                            {/* Дата сверху */}
                                                            <p className="text-xs text-gray-300 mb-3">
                                                                {formatDate(transaction.date)}
                                                            </p>
                                                            
                                                            {/* Тип • Категория */}
                                                            <div className="mb-2">
                                                                <p className="text-sm font-semibold text-white">
                                                                    {t(`passenger.account.transactionTypes.${typeKey}`, { defaultValue: transactionType })}
                                                                    {transaction.category && (
                                                                        <>
                                                                            {" • "}
                                                                            {transaction.category}
                                                                        </>
                                                                    )}
                                                                </p>
                                                            </div>
                                                            
                                                            {/* Expanded details */}
                                                            {isExpanded && (
                                                                <div className="mt-3 mb-2">
                                                                    {transactionType === "Transfer" ? (
                                                                        <>
                                                                            {/* Для Transfer показываем описание, если есть */}
                                                                            {transaction.description && (
                                                                                <p className="text-sm text-gray-300 mb-2">
                                                                                    {transaction.description}
                                                                                </p>
                                                                            )}
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
                                                                            {/* Для других типов показываем description и sourceId */}
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
                                                            <div>
                                                                <span className={`text-base font-bold ${
                                                                    isPositive 
                                                                        ? "text-green-400" 
                                                                        : "text-red-400"
                                                                }`}>
                                                                    {isPositive ? "+" : "-"}
                                                                    {transaction.miles.toLocaleString()} Miles
                                                                </span>
                                                            </div>

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
                                            </div>
                                        </div>
                                    ))}
                                    {/* Триггер для lazy load - ВАЖНО: вне цикла по месяцам, но внутри основного контейнера */}
                                    {hasMoreTransactions && (
                                        <div ref={loadMoreTriggerRef} className="py-4">
                                            {loadingMoreTransactions && (
                                                <div className="text-center">
                                                    <Loader text={t("passenger.account.loadingMore") || "Загрузка..."} />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountPage;
