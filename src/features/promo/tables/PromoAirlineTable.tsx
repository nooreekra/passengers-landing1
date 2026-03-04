import React, { useEffect, useState } from "react";
import { PromoTable } from "@/features/promo/model/types";
import { getCurrencies } from "@/shared/api/currencies";
import Pagination from "@/shared/ui/Pagination";
import PeriodBar from "@/shared/ui/PeriodBar";
import { useRouter } from "next/navigation";
import PlaneIcon from "@/shared/icons/PlaneIcon";
import Loader from "@/shared/ui/Loader";
import { useTranslation } from "react-i18next";
import { usePermission } from "@/shared/lib/usePermission";

interface Props {
    promos: PromoTable[];
    loading: boolean;
    offset: number;
    limit: number;
    total: number;
    onPageChange: (newOffset: number) => void;
}

const PromoAirlineTable = ({ promos, loading, offset, limit, total, onPageChange }: Props) => {
    const router = useRouter();
    const [currencyMap, setCurrencyMap] = useState<Record<string, string>>({});
    const { t } = useTranslation();
    const canReadImsFees = usePermission("imsfee:read");

    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const currencies = await getCurrencies();
                const map: Record<string, string> = {};
                currencies.forEach((c) => (map[c.code] = c.symbol));
                setCurrencyMap(map);
            } catch {
                /* noop */
            }
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
                        <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.target_audience")}</th>
                        <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.segments")}</th>
                        <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.ancillaries")}</th>
                        <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.target")}</th>
                        <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.rewards_total")}</th>
                        <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.rewards_paid")}</th>
                        {canReadImsFees && (
                            <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.ims_fees")}</th>
                        )}
                    </tr>
                    </thead>
                    <tbody>
                    {promos?.map((promo) => {
                        return (
                            <tr
                                key={promo.id}
                                className="cursor-pointer hover:bg-gray-50 border-border-default border-t text-label-primary body-M-regular"
                                onClick={() => router.push(`/dashboard/airline/promos/${promo.id}/view`)}
                            >
                                <td className="px-4 py-2 border border-border-default whitespace-nowrap">
                                    <div className="flex flex-col space-y-2 min-w-0">
                                        <p
                                            title={promo.name}
                                            className="min-w-0 overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_right,black_85%,transparent)]"
                                        >
                                            {promo.name}
                                        </p>
                                        <div
                                            className={`w-32 py-1 px-3 rounded-3xl flex justify-center ${
                                                promo.status === "Active" 
                                                    ? "bg-decorative-green" 
                                                    : promo.status === "Unpublished"
                                                    ? "bg-yellow-200"
                                                    : "bg-gray-300"
                                            }`}
                                        >
                                            <p
                                                className={`caption-bold ${
                                                    promo.status === "Active" 
                                                        ? "text-label-green" 
                                                        : promo.status === "Unpublished"
                                                        ? "text-yellow-700"
                                                        : "text-gray-600"
                                                }`}
                                            >
                                                {t(`promo.status.${promo.status}`)}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-4 py-2 border border-border-default whitespace-nowrap">
                                    <PeriodBar from={promo.bookingPeriod.from} to={promo.bookingPeriod.to} />
                                </td>

                                <td className="px-4 py-2 border border-border-default">
                                    {promo.targetAudienceCountries?.map((country) => country).join(", ")}
                                </td>

                                <td className="px-4 py-2 border border-border-default whitespace-nowrap">
                                    {promo.originCities?.length && promo.destinationCities?.length ? (
                                        promo.originCities.map((origin, index) => {
                                            const destination = promo.destinationCities[index];
                                            if (!destination) return null;
                                            return (
                                                <div key={`${origin}-${destination}`} className="flex items-center gap-2 mb-1">
                                                    <span>
                                                        {origin === "All countries, All cities" 
                                                            ? `${t("promo.all_countries")}, ${t("promo.all_cities")}`
                                                            : origin
                                                        }
                                                    </span>
                                                    <PlaneIcon />
                                                    <span>
                                                        {destination === "All countries, All cities" 
                                                            ? `${t("promo.all_countries")}, ${t("promo.all_cities")}`
                                                            : destination
                                                        }
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        "-"
                                    )}
                                </td>

                                <td className="px-4 py-2 border border-border-default whitespace-nowrap">
                                    <PeriodBar from={promo.travelPeriod.from} to={promo.travelPeriod.to} />
                                </td>

                                <td className="border border-border-default whitespace-nowrap">
                                    {promo.targetAudiences?.length ? (
                                        <div className="w-full">
                                            {promo.targetAudiences.map((aud, idx) => (
                                                <div key={`${promo.id}-aud-${idx}`} className="flex flex-col w-full">
                                                    <div className="px-4 py-2">{labelForAudience(aud)}</div>
                                                    {idx < promo.targetAudiences.length - 1 && (
                                                        <hr className="my-1 border-t border-gray-300 w-full" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        "-"
                                    )}
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
                                                    {idx < promo.ancillaries.length - 1 && (
                                                        <hr className="border-t border-gray-300 w-full" />
                                                    )}
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

                                {canReadImsFees && (
                                    <td className="border border-border-default">
                                        {promo.imsFees?.length ? (
                                            <div className="w-full">
                                                {promo.imsFees.map((fee, idx) => (
                                                    <div key={`${promo.id}-ims-${idx}`}>
                                                        <div
                                                            className={`px-4 py-2 w-full flex justify-between ${
                                                                idx === 0 ? "text-gray-700" : "text-green-600 font-semibold"
                                                            }`}
                                                        >
                                                            {(currencyMap[promo.currencyCode] ?? promo.currencyCode)}
                                                            {Number(fee).toLocaleString()}
                                                        </div>
                                                        {idx < promo.imsFees.length - 1 && (
                                                            <hr className="border-t border-gray-300 w-full"/>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            "-"
                                        )}
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            <div className="w-full flex justify-end p-4">
                <Pagination total={total} offset={offset} limit={limit} onPageChange={onPageChange} />
            </div>
        </div>
    );
};

export default PromoAirlineTable;
