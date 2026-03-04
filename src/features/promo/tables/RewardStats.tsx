import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import BankNoteIcon from "@/shared/icons/BankNoteIcon";
import CheckBrokenIcon from "@/shared/icons/CheckBrokenIcon";
import CurrencyCoinIcon from "@/shared/icons/CurrencyCoinIcon";
import Loader2Icon from "@/shared/icons/Loader2Icon";
import axiosInstance from "@/shared/api/axiosInstance";
import { useTranslation } from "react-i18next";
import { getCurrencies } from "@/shared/api/currencies";

interface StatsResponse {
    total: number;
    confirmed: number;
    unconfirmed: number;
    pending: number;
    paid: number;
    currencyCode: string;
}

const RewardStats = () => {
    const { t, i18n } = useTranslation();
    const [stats, setStats] = useState<StatsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [currencySymbolMap, setCurrencySymbolMap] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [statsRes, cur] = await Promise.all([
                    axiosInstance.get<StatsResponse>("/api/promos/statistics"),
                    getCurrencies(),
                ]);
                setStats(statsRes.data);
                const map: Record<string, string> = {};
                cur.forEach((c) => (map[c.code] = c.symbol || c.code));
                setCurrencySymbolMap(map);
            } finally {
                setLoading(false);
            }
        };
        void fetchAll();
    }, []);

    const locale = i18n.language === "ru" ? "ru-RU" : "en-US";

    if (loading || !stats) {
        return <div className="text-sm text-gray-500">{t("stats.loading")}</div>;
    }

    const sym = currencySymbolMap[stats.currencyCode] ?? stats.currencyCode;

    const items = [
        { label: t("stats.total"), value: stats.total, subtext: t("stats.total_sub"), color: "text-blue-600", icon: <CurrencyCoinIcon />, sym },
        { label: t("stats.unconfirmed"), value: stats.unconfirmed, subtext: t("stats.unconfirmed_sub"), color: "text-gray-700", icon: <Loader2Icon />, sym },
        { label: t("stats.confirmed"), value: stats.confirmed, subtext: t("stats.confirmed_sub"), color: "text-purple-600", icon: <BankNoteIcon />, sym },
        { label: t("stats.pending"), value: stats.pending, subtext: t("stats.pending_sub"), color: "text-gray-700", icon: <Clock className="w-5 h-5 text-gray-500" />, sym },
        { label: t("stats.paid"), value: stats.paid, subtext: t("stats.paid_sub"), color: "text-green-600", icon: <CheckBrokenIcon />, sym },
    ];

    const sizeByDigits = (num: number) => {
        const digits = Math.max(1, Math.floor(Math.abs(num)).toString().replace(/\D/g, "").length);
        if (digits >= 11) return "text-lg";
        if (digits >= 9) return "text-xl";
        if (digits >= 7) return "text-2xl";
        return "text-3xl";
    };

    return (
        <div className="flex flex-wrap gap-4 mb-10">
            {items.map((stat, idx) => {
                const numClass = sizeByDigits(stat.value);
                const formatted = stat.value.toLocaleString(locale, { maximumFractionDigits: 2 });
                return (
                    <div
                        key={idx}
                        className="flex-none basis-full sm:basis-[260px] lg:basis-[240px] 2xl:basis-[220px] bg-white rounded-xl shadow p-4 flex items-center gap-4 min-h-[112px]"
                    >
                        <div className="mt-1 shrink-0">{stat.icon}</div>
                        <div className="flex flex-col min-w-0">
                            <span className={`body-M-bold ${stat.color} truncate`}>{stat.label}</span>
                            <div className={`font-semibold leading-tight tracking-tight ${stat.color} whitespace-nowrap ${numClass}`}>
                                <span className="align-baseline">{stat.sym}</span>{" "}
                                <span className="align-baseline">{formatted}</span>
                            </div>
                            <span className="caption-regular text-label-additional truncate">{stat.subtext}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default RewardStats;
