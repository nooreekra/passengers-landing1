"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";
import Button from "@/shared/ui/Button";
import { baseSelectStyles } from "@/shared/ui/selectStyles";
import { useTranslation } from "react-i18next";
import { getCountries } from "@/shared/api/locations";
import { updatePartnershipPromoRules } from "@/features/promo/api/promos";
import { Input } from "@/shared/ui/Input";

type Option = { value: string; label: string };

const schema = z.object({
    startDate: z.string().min(1, "required"),
    endDate: z.string().min(1, "required"),
    countries: z.array(z.string()).min(1, "required"),
});
type FormValues = z.infer<typeof schema>;

export default function EditPromoStep2() {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const promoId = params?.promoId as string | undefined;
    const [countries, setCountries] = useState<Option[]>([]);

    const { control, handleSubmit } = useForm<FormValues>({
        resolver: zodResolver(schema),
        mode: "onChange",
        defaultValues: { startDate: "", endDate: "", countries: [] },
    });

    useEffect(() => {
        getCountries().then((res: any[]) => setCountries(res.map(c => ({ value: c.id, label: c.name }))));
    }, []);

    const onSubmit = async (form: FormValues) => {
        if (!promoId) return;
        const startIso = `${form.startDate}T00:00:00Z`;
        const endIso = `${form.endDate}T23:59:59Z`;
        await updatePartnershipPromoRules(String(promoId), {
            type: "Partner",
            startDate: startIso,
            endDate: endIso,
            targetCountries: form.countries,
        });
        router.push(`/dashboard/partnership/promos/${promoId}/edit/step-3`);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-20">
            <div className="space-y-6 bg-white shadow p-7 rounded-xl">
                <p className="body-L-semibold">{t("promo.promo_rules")}</p>
                <div className="grid lg:grid-cols-2 gap-6">
                    <Controller name="startDate" control={control} render={({ field }) => (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t("promo.start_date")} *</label>
                            <Input type="date" value={field.value} onChange={field.onChange} />
                        </div>
                    )} />
                    <Controller name="endDate" control={control} render={({ field }) => (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t("promo.end_date")} *</label>
                            <Input type="date" value={field.value} onChange={field.onChange} />
                        </div>
                    )} />
                </div>
            </div>

            <div className="space-y-6 bg-white shadow p-7 rounded-xl">
                <p className="body-L-semibold">{t("promo.target_countries")}</p>
                <Controller name="countries" control={control} render={({ field }) => (
                    <Select isMulti options={countries} value={countries.filter(c => field.value.includes(c.value))}
                            onChange={(selected) => field.onChange(selected ? (selected as Option[]).map(o => o.value) : [])}
                            styles={baseSelectStyles as any} placeholder={t("promo.choose_countries")} />
                )} />
            </div>

            <div className="flex justify-end gap-4 pt-6">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                    {t("promo.back")}
                </Button>
                <Button type="submit">{t("promo.continue")}</Button>
            </div>
        </form>
    );
}