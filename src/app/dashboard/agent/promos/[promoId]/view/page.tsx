"use client";

import React, { useEffect, useRef, useState, UIEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBookingSegments } from "@/features/promo/api/promos";
import { BookingSegment } from "@/features/promo/model/types";
import SortableHeader from "@/shared/ui/SortableHeader";
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
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Business } from "@/entities/business/types";
import InfoTooltip from "@/shared/ui/InfoTooltip";
import { localizeEnum } from "@/shared/lib/enumLocalization";

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
};

export default function PromoViewPage() {
    const params = useParams();
    const promoId = params?.promoId as string | undefined;
    const router = useRouter();
    const { i18n, t } = useTranslation();
    const currentLocale = i18n.language === "ru" ? ru : enUS;

    const [promo, setPromo] = useState<SegmentPromo | null>(null);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [currencyMap, setCurrencyMap] = useState<Record<string, string>>({});
    const currentBusiness = useSelector((state: RootState) => state.business.current) as Business | null;

    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [sortBy, setSortBy] = useState<string>("");
    const debouncedSearchTerm = useDebounce(searchTerm, 400);
    const debouncedDateRange = useDebounce(dateRange, 400);

    const [segments, setSegments] = useState<BookingSegment[]>([]);
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
            const res = await getBookingSegments(
                promoId as string,
                debouncedSearchTerm,
                debouncedDateRange?.from?.toISOString(),
                debouncedDateRange?.to?.toISOString(),
                offsetRef.current,
                limit,
                sortBy
            );

            if (isFirst && res.promo) {
                setPromo(res.promo as SegmentPromo);
                setLoading(false);
            }

            const page: BookingSegment[] = res.items ?? [];
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
    }, [promoId, debouncedSearchTerm, debouncedDateRange, sortBy]);

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
                false,
                debouncedSearchTerm,
                debouncedDateRange?.from?.toISOString(),
                debouncedDateRange?.to?.toISOString(),
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

            <div className="relative rounded-2xl overflow-hidden shadow-md mb-10 h-[240px] w-full">
                <img src={promo.imageUri || "/images/main_bg2.webp"} alt="Promo Banner" className="object-cover w-full" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/50 to-transparent text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <div
                            className={`w-32 py-1 px-3 rounded-3xl flex justify-center ${
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
                    </div>
                    <h1 className="font-bold text-white mb-8">{promo.name}</h1>

                    <div className="flex flex-wrap items-center space-x-4 text-sm mb-2">
                        <p className="body-L-bold">{t("promo.reward_paid_per")}</p>
                        {(promo.rewardsPaidPer ?? []).map((type, idx) => (
                            <div key={idx} className="px-3 py-1 rounded-full bg-[#F2F4F7] text-[#344054] text-xs font-medium">
                                {t(`promo.${type}`)}
                            </div>
                        ))}
                    </div>


                    <div className="flex flex-wrap items-center space-x-4 text-sm">
                        <p className="body-L-bold">{t("promo.target_countries")}</p>
                        {(promo.targetCountries?.split(' ').filter(country => country.trim()) ?? []).map((country: string, idx: number) => (
                            <div key={idx} className="px-3 py-1 rounded-full bg-[#F2F4F7] text-[#344054] text-xs font-medium">
                                {country}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-6 mb-11">
                <div className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] min-w-[20rem] bg-white shadow p-6 rounded-xl space-y-4 min-h-[220px] overflow-hidden">
                    <div className="flex items-center gap-3">
                        <DescIcon />
                        <h3 className="font-semibold text-lg">{t("promo.promo_description")}</h3>
                    </div>
                    <p className="min-w-0 overflow-hidden [mask-image:linear-gradient(to_right,black_85%,transparent)]">
                        {promo.description || "—"}
                    </p>
                    <button className="text-sm text-blue-600" onClick={() => setModalOpen(true)}>
                        {t("promo.read_promo_rules")}
                    </button>
                </div>

                <div className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] min-w-[20rem] bg-white shadow p-6 rounded-xl space-y-3 min-h-[220px] overflow-hidden">
                    <div className="flex items-center gap-3">
                        <LocationIcon />
                        <h3 className="font-semibold text-lg">{t("promo.origin_destination")}</h3>
                    </div>

                    <div className="grid items-center gap-x-2 gap-y-2 [grid-template-columns:max-content_1fr_max-content_1fr]">
                        <strong className="shrink-0 text-sm">{t("promo.countries")}:</strong>
                        <span className="min-w-0 overflow-hidden [mask-image:linear-gradient(to_right,black_85%,transparent)] text-xs">
                            {promo.originCountries === "All countries" 
                                ? t("promo.all_countries") 
                                : promo.originCountries || "-"}
                        </span>
                        <div className="flex justify-center">
                            <PlaneIcon />
                        </div>
                        <span className="min-w-0 overflow-hidden [mask-image:linear-gradient(to_right,black_85%,transparent)] text-xs">
                            {promo.destinationCountries === "All countries" 
                                ? t("promo.all_countries") 
                                : promo.destinationCountries || "-"}
                        </span>

                        <strong className="shrink-0 text-sm">{t("promo.cities")}:</strong>
                        <span className="min-w-0 overflow-hidden [mask-image:linear-gradient(to_right,black_85%,transparent)] text-xs">
                            {promo.originCities === "All cities" 
                                ? t("promo.all_cities") 
                                : promo.originCities || "-"}
                        </span>
                        <div className="flex justify-center">
                            <PlaneIcon />
                        </div>
                        <span className="min-w-0 overflow-hidden [mask-image:linear-gradient(to_right,black_85%,transparent)] text-xs">
                            {promo.destinationCities === "All cities" 
                                ? t("promo.all_cities") 
                                : promo.destinationCities || "-"}
                        </span>
                    </div>
                </div>

                <div className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] min-w-[20rem] bg-white shadow p-6 rounded-xl space-y-2 min-h-[220px] overflow-hidden">
                    <div className="flex items-center gap-3">
                        <CalendarIcon />
                        <h3 className="font-semibold text-lg">{t("promo.time_periods")}</h3>
                    </div>

                    <div className="space-y-2">
                        {promo.bookingPeriod?.from && promo.bookingPeriod?.to && (
                            <div className="flex items-center">
                                <strong className="w-28 text-sm flex-shrink-0">{t("promo.booking")}:</strong>
                                <span className="text-xs ml-3">
                                    {format(new Date(promo.bookingPeriod.from), "MMM dd, yyyy", { locale: currentLocale })} –{" "}
                                    {format(new Date(promo.bookingPeriod.to), "MMM dd, yyyy", { locale: currentLocale })}
                                </span>
                            </div>
                        )}

                        {promo.travelPeriod?.from && promo.travelPeriod?.to && (
                            <div className="flex items-center">
                                <strong className="w-28 text-sm flex-shrink-0">{t("promo.travel")}:</strong>
                                <span className="text-xs ml-3">
                                    {format(new Date(promo.travelPeriod.from), "MMM dd, yyyy", { locale: currentLocale })} –{" "}
                                    {format(new Date(promo.travelPeriod.to), "MMM dd, yyyy", { locale: currentLocale })}
                                </span>
                            </div>
                        )}
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
                            <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.ain_numbers")}</th>
                            <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.travel_agent_name")}</th>
                            <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.travel_agency")}</th>
                            <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.subagent")}</th>
                            <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.iata_validator")}</th>
                            <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.passenger_name")}</th>
                            <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.pnr_number")}</th>
                            <SortableHeader
                                field="bookingDate"
                                currentSortOrder={getSortOrder("bookingDate")}
                                isSorted={isFieldSorted("bookingDate")}
                                onSort={handleSort}
                            >
                                {t("promo.booking_date")}
                            </SortableHeader>
                            <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.airline_code")}</th>
                            <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.flight_number")}</th>
                            <SortableHeader
                                field="travelDate"
                                currentSortOrder={getSortOrder("travelDate")}
                                isSorted={isFieldSorted("travelDate")}
                                onSort={handleSort}
                            >
                                {t("promo.travel_date")}
                            </SortableHeader>
                            <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.origin_destination")}</th>
                            <th className="px-4 py-3 border border-border-default">{t("promo.status_header")}</th>
                            <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.booking_class")}</th>
                            <th className="px-4 py-3 border border-border-default">{t("promo.rbd")}</th>
                            <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.fare_family")}</th>
                            <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.iata_number")}</th>
                            <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.ticket_number")}</th>
                            <th className="px-4 py-3 border border-border-default">{t("promo.fare")}</th>
                            <th className="px-4 py-3 border border-border-default">{t("promo.taxes")}</th>
                            <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.ancillary_type")}</th>
                            <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.ancillary_revenue")}</th>
                            <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.reward_type")}</th>
                            <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.reward_amount")}</th>
                            <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.segments_total")}</th>
                            <th className="px-4 py-3 border border-border-default whitespace-nowrap">{t("promo.individual_target")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {segments.map((item, idx) => {
                            const sym = currencyMap[item.currencyCode] ?? item.currencyCode ?? "";
                            return (
                                <tr key={idx} className="text-label-primary">
                                    <td className="px-4 py-3">{item.ainNumbers?.map((ain, i) => <div key={i}>{ain.value}</div>) ?? "-"}</td>
                                    <td className="px-4 py-3">{item.travelAgentName}</td>
                                    <td className="px-4 py-3">{item.travelAgency}</td>
                                    <td className="px-4 py-3">-</td>
                                    <td className="px-4 py-3">{item.iataValidator}</td>
                                    <td className="px-4 py-3">{item.passengerName}</td>
                                    <td className="px-4 py-3">{item.pnrNumber}</td>
                                    <td className="px-4 py-3">
                                        {format(new Date(item.bookingDate), "MMM dd, yyyy", { locale: currentLocale })}
                                    </td>
                                    <td className="px-4 py-3">{item.airlineCode}</td>
                                    <td className="px-4 py-3">{item.flightNumber}</td>
                                    <td className="px-4 py-3">
                                        {format(new Date(item.travelDate), "MMM dd, yyyy", { locale: currentLocale })}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {item.origin} – {item.destination}
                                    </td>
                                    <td className="px-4 py-3 font-semibold">
                                        {localizeEnum('tripStatus', item.status, t)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {localizeEnum('bookingClass', item.bookingClass, t)}
                                    </td>
                                    <td className="px-4 py-3">{item.rbd}</td>
                                    <td className="px-4 py-3">{item.fareFamily}</td>
                                    <td className="px-4 py-3">{item.iataNumber}</td>
                                    <td className="px-4 py-3">{item.ticketNumber}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {sym} {Number(item.fare).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {sym} {Number(item.taxes).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">-</td>
                                    <td className="px-4 py-3">-</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {item.rewardTypes?.length
                                            ? item.rewardTypes.map((type, i) => (
                                                <div key={i}>
                                                    {localizeEnum('rewardTriggerType', type.rewardType, t)}
                                                </div>
                                            ))
                                            : "-"}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {item.rewardAmounts?.length
                                            ? item.rewardAmounts.map((reward, i) => (
                                                <div
                                                    key={i}
                                                    className={clsx(reward.isConfirmed ? "text-green-600 font-semibold" : "text-gray-400")}
                                                >
                                                    {sym} {Number(reward.value).toLocaleString()}
                                                </div>
                                            ))
                                            : "-"}
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.segments?.booked} booked
                                        <br />
                                        {item.segments?.flown} flown
                                    </td>
                                    <td className="px-4 py-3">{item.individualTarget ?? "-"}</td>
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
        </div>
    );
}
