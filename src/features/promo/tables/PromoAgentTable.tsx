"use client"

import React, { useEffect, useState } from "react";
import { PromoTable } from "@/features/promo/model/types";
import Pagination from "@/shared/ui/Pagination";
import PeriodBar from "@/shared/ui/PeriodBar";
import { getCurrencies } from "@/shared/api/currencies";
import { useRouter } from "next/navigation";
import PlaneIcon from "@/shared/icons/PlaneIcon";
import Loader from "@/shared/ui/Loader";
import { useTranslation } from "react-i18next";

interface PromoTableProps {
    promos: PromoTable[];
    loading: boolean;
    offset: number;
    limit: number;
    total: number;
    onPageChange: (newOffset: number) => void;
}

const PromoAgentTable = ({ promos, loading, offset, limit, total, onPageChange }: PromoTableProps) => {
    const router = useRouter();
    const [currencyMap, setCurrencyMap] = useState<Record<string, string>>({});
    const { t } = useTranslation();

    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const currencies = await getCurrencies();
                const map: Record<string, string> = {};
                currencies.forEach((c) => (map[c.code] = c.symbol));
                setCurrencyMap(map);
            } catch {}
        };
        void fetchCurrencies();
    }, []);

    if (loading) return <Loader text={t("promo.loading_promos")} />;

    const labelForAudience = (a: string) =>
        a === "TravelAgency" ? t("promo.travel_agency") : a === "TravelAgent" ? t("promo.travel_agent") : a;

    return (
        <div className="rounded-lg w-full">
            <div className="bg-white w-full overflow-x-auto">
                <table className="w-full bg-white shadow-md table-auto text-sm border border-border-default">
                    <thead className="bg-gray-100 text-left border-b border-border-default">
                    <tr className="text-label-secondary body-M-semibold">
                        <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.promo_list")}</th>
                        <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.booking_period")}</th>
                        <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.target_countries")}</th>
                        <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.origin_destination")}</th>
                        <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.travel_period")}</th>
                        <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.segments")}</th>
                        <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.ancillaries")}</th>
                        <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.target")}</th>
                        <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.rewards_total")}</th>
                        <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.rewards_paid")}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {promos.filter(promo => promo.status !== "Unpublished").map((promo) => (
                        <tr
                            key={promo.id}
                            className="cursor-pointer hover:bg-gray-50 border-t border-border-default text-label-primary body-M-regular"
                            onClick={() => router.push(`/dashboard/agent/promos/${promo.id}/view`)}
                        >
                            <td className="px-4 py-2 border border-border-default whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                    {promo.businessLogoUri && promo.businessLogoUri.includes("http") && (
                                        <img
                                            src={promo.businessLogoUri}
                                            alt={promo.businessTradingName}
                                            className="w-8 h-8 object-cover rounded shrink-0"
                                        />
                                    )}
                                    <div className="flex flex-col min-w-0">
                                        <span
                                            title={promo.name}
                                            className="font-medium min-w-0 overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_right,black_85%,transparent)]"
                                        >
                                            {promo.name}
                                        </span>
                                                            <span
                                                                title={promo.businessTradingName}
                                                                className="text-xs text-gray-500 min-w-0 overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_right,black_85%,transparent)]"
                                                            >
                                            {promo.businessTradingName}
                                        </span>
                                        <div
                                            className={`mt-1 w-32 px-3 py-1 text-xs rounded-2xl font-semibold flex justify-center ${
                                                promo.status === "Active" 
                                                    ? "bg-decorative-green text-label-green" 
                                                    : promo.status === "Unpublished"
                                                    ? "bg-yellow-200 text-yellow-700"
                                                    : "bg-gray-200 text-gray-700"
                                            }`}
                                        >
                                            {t(`promo.status.${promo.status}`)}
                                        </div>
                                    </div>
                                </div>
                            </td>

                            <td className="px-4 py-4 border border-border-default whitespace-nowrap">
                                <PeriodBar from={promo.bookingPeriod.from} to={promo.bookingPeriod.to} />
                            </td>

                            <td className="px-4 py-2 border border-border-default">
                                {promo.originCountries?.map((c) => c).join(", ")}
                            </td>

                            <td className="px-4 py-2 border border-border-default whitespace-nowrap">
                                {promo.originCities?.length && promo.destinationCities?.length ? (
                                    <div className="flex items-center gap-2">
                                        <span>
                                            {promo.originCities[0] === "All countries, All cities" 
                                                ? `${t("promo.all_countries")}, ${t("promo.all_cities")}`
                                                : promo.originCities[0]
                                            }
                                        </span>
                                        <PlaneIcon />
                                        <span>
                                            {promo.destinationCities[0] === "All countries, All cities" 
                                                ? `${t("promo.all_countries")}, ${t("promo.all_cities")}`
                                                : promo.destinationCities[0]
                                            }
                                        </span>
                                    </div>
                                ) : (
                                    "-"
                                )}
                            </td>

                            <td className="px-4 py-4 border border-border-default whitespace-nowrap">
                                <PeriodBar from={promo.travelPeriod.from} to={promo.travelPeriod.to} />
                            </td>

                            <td className="px-4 py-2 border border-border-default whitespace-nowrap">
                                {promo.segments?.booked} {t("promo.booked")}
                                <br />
                                {promo.segments?.flown} {t("promo.flown")}
                            </td>

                            <td className="border border-border-default">
                                {promo.ancillaries?.length ? (
                                    <div className="w-full">
                                        {promo.ancillaries.map((a, idx) => (
                                            <div key={`${promo.id}-anc-${idx}`} className="w-full">
                                                <div className="px-4 py-2">{a.values?.length ? a.values.join(", ") : "-"}</div>
                                                {idx < promo.ancillaries.length - 1 && <hr className="border-t border-gray-300 w-full" />}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    "-"
                                )}
                            </td>

                            <td className="px-4 py-2 border border-border-default">{promo.totalTarget ?? "-"}</td>

                            <td className="border border-border-default">
                                {promo.rewardsTotal?.length ? (
                                    <div className="w-full">
                                        {promo.rewardsTotal.map((r, idx) => (
                                            <div key={`${promo.id}-rt-${idx}`}>
                                                <div
                                                    className={`px-4 py-2 w-full ${
                                                        r.isConfirmed ? "text-green-600 font-semibold" : "text-gray-400"
                                                    }`}
                                                >
                                                    {(currencyMap[promo.currencyCode] ?? promo.currencyCode)}{" "}
                                                    {Number(r.value).toLocaleString()}
                                                </div>
                                                {idx < promo.rewardsTotal.length - 1 && (
                                                    <hr className="border-t border-gray-300 w-full"/>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    "-"
                                )}
                            </td>

                            <td className="border border-border-default">
                                {promo.rewardsPaid?.length ? (
                                    <div className="w-full">
                                        {promo.rewardsPaid.map((r, idx) => (
                                            <div key={`${promo.id}-rp-${idx}`}>
                                                <div
                                                    className={`px-4 py-2 w-full ${
                                                        r.isConfirmed ? "text-green-600 font-semibold" : "text-gray-400"
                                                    }`}
                                                >
                                                    {(currencyMap[promo.currencyCode] ?? promo.currencyCode)}{" "}
                                                    {Number(r.value).toLocaleString()}
                                                </div>
                                                {idx < promo.rewardsPaid.length - 1 && (
                                                    <hr className="border-t border-gray-300 w-full"/>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    "-"
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="w-full flex justify-end p-4">
                <Pagination total={total} offset={offset} limit={limit} onPageChange={onPageChange}/>
            </div>
        </div>
    );
};

export default PromoAgentTable;
