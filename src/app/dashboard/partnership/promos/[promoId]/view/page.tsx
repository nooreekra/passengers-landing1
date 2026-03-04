"use client";

import React, { useEffect, useRef, useState, UIEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPartnerTransactions, deletePromo } from "@/features/promo/api/promos";
import Button from "@/shared/ui/Button";
import ChevronLeftIcon from "@/shared/icons/ChevronLeftIcon";
import SearchIcon from "@/shared/icons/SearchIcon";
import clsx from "clsx";
import { format } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import DescIcon from "@/shared/icons/DescIcon";
import LocationIcon from "@/shared/icons/LocationIcon";
import CalendarIcon from "@/shared/icons/CalendarIcon";
import PromoRulesModal from "@/features/promo/components/PromoRulesModal";
import PlaneIcon from "@/shared/icons/PlaneIcon";
import { splitCamelCase } from "@/shared/utils/formatting";
import Loader from "@/shared/ui/Loader";
import { exportAllSegmentsToExcel } from "@/shared/utils/exportToExcel";
import { useTranslation } from "react-i18next";
import { useDebounce } from "@/shared/lib/useDebounce";
import { getCurrencies } from "@/shared/api/currencies";
import DateRangePicker from "@/shared/ui/DateRangePicker";
import EditIcon from "@/shared/icons/EditIcon";
import PlayIcon from "@/shared/icons/PlayIcon";
import PauseIcon from "@/shared/icons/PauseIcon";
import TrashIcon from "@/shared/icons/TrashIcon";
import InfoTooltip from "@/shared/ui/InfoTooltip";
import ConfirmModal from "@/shared/ui/ConfirmModal";
import { updatePromoStatus, PromoStatus } from "@/features/promo/api/promos";
import SortableHeader from "@/shared/ui/SortableHeader";
import { localizeEnum } from "@/shared/lib/enumLocalization";
import { usePermission } from "@/shared/lib/usePermission";

type SegmentPromo = {
    id: string;
    name: string;
    status: string;
    description: string;
    imageUri: string;
    businessId: string;
    rewardsPaidPer?: string[];
    targetAudiences?: string[];
    targetCountries?: string;
    bookingPeriod?: { from: string; to: string };
    travelPeriod?: { from: string; to: string };
    originCountries?: string;
    destinationCountries?: string;
    originCities?: string;
    destinationCities?: string;
    rewards?: Array<{
        status: string;
        value: number;
        valueType: "Percentage" | "Fixed";
        id: string;
        promoId: string;
    }>;
    ruleDescription?: string;
};

export default function PromoViewPage() {
    const params = useParams();
    const promoId = params?.promoId as string | undefined;
    const router = useRouter();
    const { i18n, t } = useTranslation();
    const currentLocale = i18n.language === "ru" ? ru : enUS;
    const canReadImsFees = usePermission("imsfee:read");

    // Функция для локализации статуса промо
    const getLocalizedStatus = (status: string | undefined): string => {
        if (!status) return "";
        const statusKey = `promo.status.${status}`;
        const translated = t(statusKey);
        // Если перевод не найден, возвращаем сам статус
        return translated !== statusKey ? translated : status;
    };

    const [promo, setPromo] = useState<SegmentPromo | null>(null);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [currencyMap, setCurrencyMap] = useState<Record<string, string>>({});
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [sortBy, setSortBy] = useState<string>("");
    const debouncedSearchTerm = useDebounce(searchTerm, 400);
    const debouncedDateRange = useDebounce(dateRange, 400);
    
    // Создаем стабильные значения для зависимостей useEffect
    const debouncedFrom = debouncedDateRange?.from?.toISOString();
    const debouncedTo = debouncedDateRange?.to?.toISOString();

    type PartnerTransaction = {
        $type: "Partner";
        ainNumber: string;
        name: string;
        membershipStatus?: string;
        transactionDate: string;
        transactionAmount: number;
        rewardAmount: number;
        milesAmount: number;
        status: string;
        transactionNumber: string;
        vatAmount: number;
        imsFees: number;
        currencyCode: string;
    };
    const [segments, setSegments] = useState<PartnerTransaction[]>([]);
    const [listLoading, setListLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);

    const limit = 30;
    const offsetRef = useRef(0);
    const loadingRef = useRef(false);
    const hasMoreRef = useRef(true);

    const scrollNodeRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const currencies = await getCurrencies();
                const map: Record<string, string> = {};
                currencies.forEach((c) => (map[c.code] = c.symbol));
                setCurrencyMap(map);
            } finally {
            }
        };
        void fetchCurrencies();
    }, []);

    const afterLoadCheck = () => {
        const node = scrollNodeRef.current;
        if (!node) return;
        requestAnimationFrame(() => {
            if (hasMoreRef.current && !loadingRef.current && node.scrollHeight <= node.clientHeight + 1) {
                void loadMore(false);
            }
        });
    };

    const loadMore = async (isFirst: boolean) => {
        if (!promoId) return;
        if (loadingRef.current) return;
        if (!hasMoreRef.current) return;

        loadingRef.current = true;
        setListLoading(true);
        try {
            const res = await getPartnerTransactions(
                promoId as string,
                debouncedSearchTerm,
                debouncedFrom,
                debouncedTo,
                offsetRef.current,
                limit,
                sortBy
            );

            if (isFirst && res.promo) {
                const promoData = res.promo as SegmentPromo;
                // Добавляем rewards из ответа, если они есть
                if ((res as any).rewards) {
                    promoData.rewards = (res as any).rewards;
                }
                // Добавляем ruleDescription из ответа, если он есть
                if ((res as any).promo?.ruleDescription !== undefined) {
                    promoData.ruleDescription = (res as any).promo.ruleDescription;
                } else if ((res as any).ruleDescription !== undefined) {
                    promoData.ruleDescription = (res as any).ruleDescription;
                }
                setPromo(promoData);
                setLoading(false);
            }

            const page: PartnerTransaction[] = res.items ?? [];
            const got = page.length;

            setSegments((prev) => (isFirst ? page : [...prev, ...page]));

            offsetRef.current += got;

            const noMore = got < limit || (typeof res.total === "number" && offsetRef.current >= res.total);
            hasMoreRef.current = !noMore;
            setHasMore(!noMore);
        } finally {
            loadingRef.current = false;
            setListLoading(false);
            afterLoadCheck();
        }
    };

    useEffect(() => {
        if (!promoId) return;
        setSegments([]);
        setHasMore(true);
        offsetRef.current = 0;
        hasMoreRef.current = true;
        loadingRef.current = false;

        void loadMore(true);
    }, [promoId, debouncedSearchTerm, debouncedFrom, debouncedTo, sortBy]);

    const handleScroll = (e: UIEvent<HTMLDivElement>) => {
        const node = e.currentTarget;
        const nearBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 300;
        if (nearBottom && hasMoreRef.current && !loadingRef.current) void loadMore(false);
    };

    const handleSort = (field: string, order: 'asc' | 'desc') => {
        setSortBy(prev => {
            // Парсим существующую сортировку
            const currentSorts = prev ? prev.split(',').filter(Boolean) : [];
            
            // Удаляем существующую сортировку по этому полю
            const filtered = currentSorts.filter(sort => !sort.startsWith(field + ':'));
            
            // Добавляем новую сортировку в начало
            const newSort = `${field}:${order}`;
            const newSorts = [newSort, ...filtered];
            
            return newSorts.join(',');
        });
    };

    const getSortOrder = (field: string): 'asc' | 'desc' | undefined => {
        if (!sortBy) return undefined;
        const sorts = sortBy.split(',').filter(Boolean);
        const fieldSort = sorts.find(sort => sort.startsWith(field + ':'));
        if (!fieldSort) return undefined;
        return fieldSort.split(':')[1] as 'asc' | 'desc';
    };

    const isFieldSorted = (field: string): boolean => {
        if (!sortBy) return false;
        return sortBy.split(',').some(sort => sort.startsWith(field + ':'));
    };

    const handleDeletePromo = async () => {
        if (!promoId) return;
        
        setDeleteLoading(true);
        try {
            await deletePromo(promoId as string);
            router.push('/dashboard/partnership');
        } catch (error) {
            console.error('Error deleting promo:', error);
            // Здесь можно добавить уведомление об ошибке
        } finally {
            setDeleteLoading(false);
            setDeleteModalOpen(false);
        }
    };

    const getSortByArray = () => {
        if (!sortBy) return [];
        return sortBy.split(',').filter(Boolean).map(sort => {
            const [field, order] = sort.split(':');
            return { field, order: order as 'asc' | 'desc' };
        });
    };

    const handleExport = async () => {
        if (!promoId || !promo) return;
        
        setExportLoading(true);
        try {
            await exportAllSegmentsToExcel(
                promoId as string,
                promo.name || "report",
                true,
                debouncedSearchTerm,
                debouncedFrom,
                debouncedTo,
                sortBy
            );
        } catch (error) {
            console.error('Ошибка при экспорте:', error);
        } finally {
            setExportLoading(false);
        }
    };

    if (loading) return <Loader text={t("promo.loading_promo")} />;
    if (!promo) return <p>{t("promo.promo_not_found")}</p>;

    return (
        <div className="p-6">
            <button onClick={() => router.push('/dashboard')} className="flex items-center body-M-bold text-brand-black mb-8">
                <ChevronLeftIcon />
                {t("promo.back")}
            </button>

            {/* Partnership Layout: Vertical Image + Info Block */}
            <div className="flex gap-6 mb-10">
                {/* Vertical Image */}
                <div className="relative rounded-2xl overflow-hidden shadow-md w-80 h-96 flex-shrink-0">
                    <img 
                        src={promo.imageUri || "/images/main_bg2.webp"} 
                        alt="Promo Banner" 
                        className="object-cover w-full h-full" 
                    />
                </div>

                {/* Info Block */}
                <div className="flex-1 bg-white shadow-md rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div
                            className={`w-32 py-1 px-3 rounded-3xl flex items-center justify-center ${
                                promo.status === "Active" 
                                    ? "bg-decorative-green" 
                                    : promo.status === "Unpublished"
                                    ? "bg-yellow-200"
                                    : "bg-gray-300"
                            }`}
                            >
                            <p className={`caption-bold ${
                                promo.status === "Active" 
                                    ? "text-label-green" 
                                    : promo.status === "Unpublished"
                                    ? "text-yellow-700"
                                    : "text-gray-600"
                            }`}>
                                {t(`promo.status.${promo.status}`)}
                            </p>
                            </div>

                            {/* Toggle status button next to badge */}
                            <button
                                onClick={() => setStatusModalOpen(true)}
                                className="bg-white hover:bg-gray-50 text-gray-800 rounded-full p-2 shadow-sm border transition-all duration-200"
                                title={
                                    promo.status === "Unpublished"
                                        ? t("promo.activate_promo_title", { defaultValue: "Активировать промо" })
                                        : t("promo.unpublish_promo_title", { defaultValue: "Снять с публикации" })
                                }
                            >
                                <div className="w-4 h-4 flex items-center justify-center">
                                    {promo.status === "Unpublished" ? (
                                        <PlayIcon />
                                    ) : (
                                        <PauseIcon />
                                    )}
                                </div>
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => router.push(`/dashboard/partnership/promos/${promoId}/edit/step-1`)}
                                className="bg-white hover:bg-gray-50 text-gray-800 rounded-full p-2 shadow-sm border transition-all duration-200"
                                title={t("promo.edit_promo", { defaultValue: "Редактировать промо" })}
                            >
                                <div className="w-4 h-4 flex items-center justify-center">
                                    <EditIcon stroke="currentColor" />
                                </div>
                            </button>
                            
                            <button
                                onClick={() => setDeleteModalOpen(true)}
                                className="bg-white hover:bg-gray-50 text-red-600 rounded-full p-2 shadow-sm border transition-all duration-200"
                                title={t("promo.delete_promo", { defaultValue: "Удалить промо" })}
                            >
                                <div className="w-4 h-4 flex items-center justify-center">
                                    <TrashIcon stroke="currentColor" />
                                </div>
                            </button>
                        </div>
                    </div>

                    <h1 className="font-bold text-2xl mb-6">{promo.name}</h1>

                    {/* Promo Description */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-2">{t("promo.promo_description")}</h3>
                        <p className="text-gray-600 mb-2">
                            {promo.description || "—"}
                        </p>
                        <button 
                            className="text-sm text-blue-600 hover:text-blue-800" 
                            onClick={() => setModalOpen(true)}
                        >
                            {t("promo.read_promo_rules")}
                        </button>
                    </div>

                    {/* Promo Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold text-sm text-gray-500 mb-1">{t("promo.target_country")}</h4>
                            <p className="text-lg font-bold">{promo.targetCountries || "—"}</p>
                        </div>
                    </div>
                </div>
            </div>


            {/* Индикатор активных сортировок */}
            {sortBy && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-blue-800">
                            {t("promo.active_sorting", { defaultValue: "Активная сортировка" })}:
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {getSortByArray().map((sort, index) => (
                            <div
                                key={`${sort.field}-${index}`}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                            >
                                <span>{sort.field === 'bookingDate' ? t("promo.booking_date") : t("promo.travel_date")}</span>
                                <span className="font-bold">
                                    {sort.order === 'asc' ? '↑' : '↓'}
                                </span>
                                <button
                                    onClick={() => {
                                        const sorts = sortBy.split(',').filter(Boolean);
                                        const newSorts = sorts.filter((_, i) => i !== index);
                                        setSortBy(newSorts.join(','));
                                    }}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => setSortBy("")}
                            className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                            {t("promo.clear_all", { defaultValue: "Очистить все" })}
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <div className="flex gap-6 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder={t("promo.search")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white h-14 w-full border border-border-default outline-none rounded-xl pl-10 pr-10 py-4 text-sm shadow-sm"
                        />
                        <div className="absolute top-4 left-3">
                            <SearchIcon stroke="#4B4B4B" />
                        </div>
                        <div className="absolute top-4 right-3">
                            <InfoTooltip text={t("promo.search_tooltip")} position="bottom" />
                        </div>
                    </div>

                    <DateRangePicker
                        className="relative w-full md:w-64 mr-5"
                        buttonClassName="w-full"
                        value={dateRange}
                        onChange={setDateRange}
                        placeholder={t("promo.choose_date")}
                        resetText={t("promo.reset")}
                        applyText={t("common.apply", { defaultValue: "Apply" })}
                        cancelText={t("common.cancel", { defaultValue: "Cancel" })}
                        locale={currentLocale}
                    />
                </div>

                <div className="relative">
                    <Button 
                        className="w-[190px] flex justify-center" 
                        onClick={handleExport}
                        disabled={exportLoading}
                    >
                        {exportLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span className="whitespace-nowrap">{t("promo.exporting")}</span>
                            </div>
                        ) : (
                            <p className="whitespace-nowrap">{t("promo.download_report")}</p>
                        )}
                    </Button>
                    <div className="absolute top-1/2 -left-8 transform -translate-y-1/2">
                        <InfoTooltip text={t("promo.download_limit_tooltip")} position="left" />
                    </div>
                </div>
            </div>

            <div
                ref={scrollNodeRef}
                onScroll={handleScroll}
                className="bg-white shadow-md w-full overflow-x-auto overflow-y-auto max-h-[90vh]"
            >
                <table className="w-full table-auto text-sm border border-border-default">
                    <thead className="sticky top-0 z-10 bg-gray-100">
                    <tr className="text-label-secondary body-M-semibold">
                        <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.ain_number")}</th>
                        <th className="px-4 py-3 border border-border-default whitespace-nowrap min-w-[150px]">{t("promo.name")}</th>
                        <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.membership_status")}</th>
                        <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.transaction_date")}</th>
                        <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.transaction_amount")}</th>
                        <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.reward_amount")}</th>
                        <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.miles_amount")}</th>
                        <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.status_header")}</th>
                        <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.transaction_number")}</th>
                        <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.vat_amount")}</th>
                        {canReadImsFees && (
                            <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.ims_fees")}</th>
                        )}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {segments.map((item, idx) => {
                        const sym = currencyMap[item.currencyCode] ?? item.currencyCode ?? "";
                        return (
                            <tr key={idx} className="text-label-primary">
                                {/* AIN Number */}
                                <td className="px-4 py-3">
                                    {item.ainNumber || "-"}
                                </td>
                                
                                {/* Name */}
                                <td className="px-4 py-3 min-w-[150px]">{item.name || "-"}</td>
                                
                                {/* Membership Status */}
                                <td className="px-4 py-3">
                                    {item.membershipStatus 
                                        ? t(`membership.status.${item.membershipStatus}`, { defaultValue: item.membershipStatus })
                                        : "-"}
                                </td>
                                
                                {/* Transaction Date */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {item.transactionDate
                                        ? format(new Date(item.transactionDate), "dd.MM.yyyy HH:mm", { locale: currentLocale })
                                        : "-"}
                                </td>
                                
                                {/* Transaction Amount */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {sym} {Number(item.transactionAmount || 0).toLocaleString()}
                                </td>
                                
                                {/* Reward Amount */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {typeof item.rewardAmount === "number" ? (
                                        <div className="text-green-600 font-semibold">{sym} {Number(item.rewardAmount).toLocaleString()}</div>
                                    ) : (
                                        "-"
                                    )}
                                </td>
                                
                                {/* Miles Amount */}
                                <td className="px-4 py-3">{typeof item.milesAmount === "number" ? Number(item.milesAmount).toLocaleString() : "-"}</td>
                                
                                {/* Status */}
                                <td className="px-4 py-3 font-semibold">
                                        {item.status === "Paid" ? t("promo.paid") : t("promo.accrued")}
                                </td>
                                
                                {/* Transaction Number */}
                                <td className="px-4 py-3">{item.transactionNumber || "-"}</td>
                                
                                {/* VAT Amount */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {sym} {Number(item.vatAmount || 0).toLocaleString()}
                                </td>
                                
                                {/* IMS Fees */}
                                {canReadImsFees && (
                                    <td className="px-4 py-3 text-green-600 font-bold whitespace-nowrap">
                                        {sym} {Number(item.imsFees || 0).toLocaleString()}
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {segments.length === 0 && !listLoading && (
                <div className="py-10 text-center text-gray-500">
                    {t("promo.empty.title", { defaultValue: "Nothing found" })}
                </div>
            )}

            {!hasMore && segments.length > 0 && (
                <div className="w-full flex justify-center py-6 text-sm text-gray-500">
                    {t("common.end_of_list", { defaultValue: "You reached the end" })}
                </div>
            )}

            <PromoRulesModal isOpen={modalOpen} onClose={() => setModalOpen(false)} promo={promo as any} />
            
            <ConfirmModal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeletePromo}
                loading={deleteLoading}
                danger={true}
                title={t("promo.delete_promo_title", { defaultValue: "Удалить промо" })}
                text={t("promo.delete_promo_text", { defaultValue: "Вы уверены, что хотите удалить это промо? Это действие нельзя отменить." })}
                confirmText={t("common.delete", { defaultValue: "Удалить" })}
                cancelText={t("common.cancel", { defaultValue: "Отмена" })}
            />

            {/* Status change modal */}
            <ConfirmModal
                open={statusModalOpen}
                onClose={() => setStatusModalOpen(false)}
                onConfirm={async () => {
                    if (!promoId || !promo) return;
                    const nextStatus: PromoStatus = (promo.status === "Unpublished" ? "Active" : "Unpublished");
                    try {
                        await updatePromoStatus(promoId as string, nextStatus);
                        setPromo((p) => (p ? { ...p, status: nextStatus } : p));
                    } finally {
                        setStatusModalOpen(false);
                    }
                }}
                loading={false}
                danger={false}
                title={
                    promo?.status === "Unpublished"
                        ? t("promo.activate_promo_title", { defaultValue: "Активировать промо" })
                        : t("promo.unpublish_promo_title", { defaultValue: "Снять с публикации" })
                }
                text={t("promo.current_status_with_value", { 
                    defaultValue: "Текущий статус: {{status}}",
                    status: getLocalizedStatus(promo?.status)
                })}
                confirmText={t("common.save", { defaultValue: "Сохранить" })}
                cancelText={t("common.cancel", { defaultValue: "Отмена" })}
            />
        </div>
    );
}
