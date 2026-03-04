"use client";

import React, { useEffect, useState } from "react";
import { getPromos } from "@/features/promo/api/promos";
import { PromoTable } from "@/features/promo/model/types";
import SearchIcon from "@/shared/icons/SearchIcon";
import { DateRange } from "react-day-picker";
import RewardStats from "@/features/promo/tables/RewardStats";
import PromoAgentTable from "@/features/promo/tables/PromoAgentTable";
import { useTranslation } from "react-i18next";
import i18n from "@/shared/i18n";
import { useDebounce } from "@/shared/lib/useDebounce";
import { usePermission } from "@/shared/lib/usePermission";
import Image from "next/image";
import DateRangePicker from "@/shared/ui/DateRangePicker";
import InfoTooltip from "@/shared/ui/InfoTooltip";

const AgentDashboardPage = () => {
    const [promos, setPromos] = useState<PromoTable[]>([]);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [limit] = useState(10);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const { t } = useTranslation();
    const debouncedSearchTerm = useDebounce(searchTerm, 400);

    const canReadPromo = usePermission("promo:read");

    useEffect(() => {
        if (!canReadPromo) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await getPromos(offset, limit, debouncedSearchTerm, dateRange);
                setPromos(res.items);
                setTotal(res.total);
            } catch (err) {
                console.error("Failed to fetch promos:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData().catch(console.error);
    }, [offset, debouncedSearchTerm, dateRange, limit, canReadPromo, i18n.language]);

    if (!canReadPromo) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-6 h-36 w-36 select-none" aria-hidden>
                        <Image src="/images/error.png" alt="no-access" width={144} height={144} />
                    </div>
                    <h3 className="text-lg font-semibold">
                        {t("promo.no_access.title", { defaultValue: "У вас нет доступа к промо" })}
                    </h3>
                    <p className="mt-1 text-gray-500">
                        {t("promo.no_access.subtitle", {
                            defaultValue: "Попросите администратора выдать права на чтение.",
                        })}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <RewardStats />

            <div className="flex flex-wrap flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-wrap gap-5 w-full md:w-auto">
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
                            <InfoTooltip text={t("promo.search_promo_name_tooltip")} position="bottom" />
                        </div>
                    </div>

                    <DateRangePicker
                        className="w-full md:w-64"
                        buttonClassName="w-full"
                        value={dateRange}
                        onChange={setDateRange}
                        placeholder={t("promo.choose_date")}
                        resetText={t("promo.reset")}
                        applyText={t("common.apply", { defaultValue: "Apply" })}
                        cancelText={t("common.cancel", { defaultValue: "Cancel" })}
                    />
                </div>
            </div>

            {!loading && promos.length === 0 ? (
                <div className="flex min-h-[40vh] items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto mb-6 h-36 w-36 select-none" aria-hidden>
                            <Image src="/images/error.png" alt="empty" width={144} height={144} />
                        </div>
                        <h3 className="text-lg font-semibold">{t("promo.empty.title")}</h3>
                    </div>
                </div>
            ) : (
                <PromoAgentTable
                    promos={promos}
                    loading={loading}
                    offset={offset}
                    limit={limit}
                    total={total}
                    onPageChange={(page) => setOffset((page - 1) * limit)}
                />
            )}
        </div>
    );
};

export default AgentDashboardPage;
