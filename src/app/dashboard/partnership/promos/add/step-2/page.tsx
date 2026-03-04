"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";

import { Input } from "@/shared/ui/Input";
import Button from "@/shared/ui/Button";
import { baseSelectStyles, menuOptionStyles } from "@/shared/ui/selectStyles";

import { usePromoWizard } from "@/features/promo/lib/PromoWizardContext";
import { updatePartnershipPromoRules, updatePartnershipTargetAudience } from "@/features/promo/api/promos";
import { getCountries, getCitiesByCountry } from "@/shared/api/locations";

import { useTranslation } from "react-i18next";

interface Option {
    value: string;
    label: string;
}

export default function AddPromoStep2() {
    const { t } = useTranslation();
    const REQ = t("promo.required");
    const router = useRouter();
    const searchParams = useSearchParams();
    const promoId = searchParams?.get("promoId") || undefined;

    const schema = z.object({
        startDate: z.string().min(1, REQ),
        endDate: z.string().min(1, REQ),
        countries: z.array(z.string()).min(1, REQ),
    });

    type FormValues = z.infer<typeof schema>;
    const { data, setData } = usePromoWizard();

    const [countries, setCountries] = useState<Option[]>([]);
    const [loading, setLoading] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        mode: "onChange",
        defaultValues: {
            startDate: "",
            endDate: "",
            countries: [],
        },
    });

    const selectedCountries = watch("countries");

    useEffect(() => {
        const loadCountries = async () => {
            try {
                const countriesData = await getCountries();
                const options = countriesData.map((country) => ({
                    value: country.id,
                    label: country.name,
                }));
                setCountries(options);
            } catch (error) {
                console.error("Failed to load countries:", error);
            }
        };

        loadCountries();
    }, []);

    const onSubmit = async (form: FormValues) => {
        if (!promoId) return;

        setLoading(true);
        try {
            const startIso = `${form.startDate}T00:00:00Z`;
            const endIso = `${form.endDate}T23:59:59Z`;
            // Обновляем promo rules с ISO-датами
            await updatePartnershipPromoRules(promoId, {
                type: "Partner",
                startDate: startIso,
                endDate: endIso,
                targetCountries: form.countries,
            });

            router.push(`/dashboard/partnership/promos/add/step-3?promoId=${promoId}`);
        } catch (error: any) {
            console.error("Failed to update promo rules:", error);
            alert(error?.response?.data?.message || error?.message || t("promo.update_failed"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-20">
            <div className="space-y-6 bg-white shadow p-7 rounded-xl">
                <p className="body-L-semibold">{t("promo.promo_rules")}</p>

                <div className="grid lg:grid-cols-2 gap-6">
                    <Controller
                        name="startDate"
                        control={control}
                        render={({ field, fieldState }) => (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t("promo.start_date")} *
                                </label>
                                <Input
                                    type="date"
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    error={fieldState.error?.message}
                                />
                            </div>
                        )}
                    />

                    <Controller
                        name="endDate"
                        control={control}
                        render={({ field, fieldState }) => (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t("promo.end_date")} *
                                </label>
                                <Input
                                    type="date"
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    error={fieldState.error?.message}
                                />
                            </div>
                        )}
                    />
                </div>
            </div>

            <div className="space-y-6 bg-white shadow p-7 rounded-xl">
                <p className="body-L-semibold">{t("promo.target_countries")}</p>

                <Controller
                    name="countries"
                    control={control}
                    render={({ field, fieldState }) => (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t("promo.select_countries")} *
                            </label>
                            <Select
                                isMulti
                                options={countries}
                                value={countries.filter((country) =>
                                    field.value.includes(country.value)
                                )}
                                onChange={(selected) => {
                                    const values = selected
                                        ? selected.map((option) => option.value)
                                        : [];
                                    field.onChange(values);
                                }}
                                onBlur={field.onBlur}
                                styles={baseSelectStyles as any}
                                placeholder={t("promo.choose_countries")}
                                noOptionsMessage={() => t("promo.no_countries_found")}
                            />
                            {fieldState.error && (
                                <p className="mt-1 text-sm text-red-600">
                                    {fieldState.error.message}
                                </p>
                            )}
                        </div>
                    )}
                />
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                    {loading ? t("promo.saving") : t("promo.continue")}
                </Button>
            </div>
        </form>
    );
}