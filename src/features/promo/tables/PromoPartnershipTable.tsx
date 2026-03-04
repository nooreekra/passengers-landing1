import React, { useEffect, useState } from "react";
// Partner promo list uses a simplified shape returned by API
import { getCurrencies } from "@/shared/api/currencies";
import Pagination from "@/shared/ui/Pagination";
import PeriodBar from "@/shared/ui/PeriodBar";
import { useRouter } from "next/navigation";
import PlaneIcon from "@/shared/icons/PlaneIcon";
import Loader from "@/shared/ui/Loader";
import { useTranslation } from "react-i18next";
import { usePermission } from "@/shared/lib/usePermission";

interface Props {
    // Using any to be tolerant to backend response shape differences
    promos: any[];
    loading: boolean;
    offset: number;
    limit: number;
    total: number;
    onPageChange: (newOffset: number) => void;
}

const PromoPartnershipTable = ({ promos, loading, offset, limit, total, onPageChange }: Props) => {
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
                        <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.promo_period")}</th>
                        <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.target_audience_country", { defaultValue: "Target Audience Country" })}</th>
                        <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.miles_amount")} / Total</th>
                        <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.transaction_amount")} / Total</th>
                        <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.rewards_total")}</th>
                        {canReadImsFees && (
                            <th className="px-4 py-7 border border-border-default whitespace-nowrap">{t("promo.ims_fees")}</th>
                        )}
                    </tr>
                    </thead>
                    <tbody>
                    {promos?.map((promo, idx) => {
                        return (
                            <tr
                                key={promo.id}
                                className={`cursor-pointer hover:bg-gray-100 border-border-default border-t text-label-primary body-M-regular ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                                onClick={() => router.push(`/dashboard/partnership/promos/${promo.id}/view`)}
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
                                    <PeriodBar from={promo.startDate} to={promo.endDate} />
                                </td>

                                <td className="px-4 py-2 border border-border-default">
                                    {promo.targetCountries || "-"}
                                </td>

                                <td className="border border-border-default whitespace-nowrap">
                                    <div className="flex w-full h-full items-stretch">
                                        <div className="w-1/2 flex items-center justify-end pr-3">
                                            {typeof promo.milesAmount === "number" ? Number(promo.milesAmount).toLocaleString() : "-"}
                                        </div>
                                        <div className="w-1/2 flex items-center pl-3 border-l border-gray-200 font-medium">
                                            {typeof promo.milesTotal === "number" ? Number(promo.milesTotal).toLocaleString() : "-"}
                                        </div>
                                    </div>
                                </td>

                                <td className="border border-border-default whitespace-nowrap">
                                    <div className="flex w-full h-full items-stretch">
                                        <div className="w-1/2 flex items-center justify-end pr-3">
                                            {typeof promo.transactionsAmount === "number"
                                                ? `${(currencyMap[promo.currencyCode] ?? promo.currencyCode)} ${Number(promo.transactionsAmount).toLocaleString()}`
                                                : "-"}
                                        </div>
                                        <div className="w-1/2 flex items-center pl-3 border-l border-gray-200 font-medium">
                                            {typeof promo.transactionsAmountTotal === "number"
                                                ? `${(currencyMap[promo.currencyCode] ?? promo.currencyCode)} ${Number(promo.transactionsAmountTotal).toLocaleString()}`
                                                : "-"}
                                        </div>
                                    </div>
                                </td>

                                <td className="px-4 py-2 border border-border-default whitespace-nowrap">
                                    {(currencyMap[promo.currencyCode] ?? promo.currencyCode)} {Number(promo.rewardTotal ?? 0).toLocaleString()}
                                </td>

                                {canReadImsFees && (
                                    <td className="px-4 py-2 border border-border-default whitespace-nowrap">
                                        {(currencyMap[promo.currencyCode] ?? promo.currencyCode)} {Number(promo.imsFees ?? 0).toLocaleString()}
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

export default PromoPartnershipTable;