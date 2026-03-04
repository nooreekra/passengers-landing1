"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";
import Button from "@/shared/ui/Button";
import { usePromoWizard } from "@/features/promo/lib/PromoWizardContext";
import { baseSelectStyles, menuOptionStyles } from "@/shared/ui/selectStyles";
import TrashIcon from "@/shared/icons/TrashIcon";
import { getCountries, getCitiesByCountry, getAgencies } from "@/shared/api/locations";
import { updateTargetAudiences } from "@/features/promo/api/promos";
import {useTranslation} from "react-i18next";
import i18n from "@/shared/i18n";

type Option = { value: string; label: string };

interface Country { id: string; name: string }
interface City { id: string; name: string }
interface Agency { id: string; value: string }

const option = z.object({ value: z.string(), label: z.string() });
const multisel = z.array(option);

const audienceItem = z.object({
    country: option.nullable(),
    cities: multisel,
    agencies: multisel
});
const audienceSchema = z.object({ items: z.array(audienceItem).min(1) });

type FormValues = z.infer<typeof audienceSchema>;

export default function AddPromoStep2() {
    const { t } = useTranslation();
    const router = useRouter();
    const { data, setData } = usePromoWizard();

    useEffect(() => {
        if (!data.name || !data.description || !data.ruleDescription) {
            router.push('/dashboard/airline/promos/add/step-1');
        }
    }, [data, router]);
    const [countries, setCountries] = useState<Option[]>([]);
    const [citiesMap, setCitiesMap] = useState<Record<string, Option[]>>({});
    const [agenciesMap, setAgenciesMap] = useState<Record<number, Option[]>>({});
    
    const allOption = { value: "all", label: t("common.all") };

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isValid }
    } = useForm<FormValues>({
        resolver: zodResolver(audienceSchema),
        defaultValues: { 
            items: data.targetAudiences && data.targetAudiences.length > 0 
                ? data.targetAudiences 
                : [{ country: null, cities: [], agencies: [] }]
        },
        mode: "onChange"
    });

    const { fields, append, remove } = useFieldArray({ control, name: "items" });

    const watchedItems = watch("items");

    useEffect(() => {
        (async () => {
            const countryRes = await getCountries();
            setCountries([allOption, ...countryRes.map((c: Country) => ({ value: c.id, label: c.name }))]);
        })();
    }, [i18n.language]);

    useEffect(() => {
        const fetchAgencies = async () => {
            await Promise.all(
                fields.map(async (field, idx) => {
                    const item = watchedItems?.[idx];
                    const countryId = item?.country?.value;
                    const cityIds = item?.cities?.map(c => c.value) || [];

                    if (countryId === "all") {
                        setAgenciesMap(prev => ({
                            ...prev,
                            [idx]: [allOption]
                        }));
                        return;
                    }

                    if (countryId && cityIds.includes("all")) {
                        const agenciesRes = await getAgencies([countryId], []);
                        setAgenciesMap(prev => ({
                            ...prev,
                            [idx]: [allOption, ...agenciesRes.map((a: Agency) => ({ value: a.id, label: a.value }))]
                        }));
                        return;
                    }

                    if (countryId && cityIds.length > 0 && !cityIds.includes("all")) {
                        const agenciesRes = await getAgencies([countryId], cityIds);
                        setAgenciesMap(prev => ({
                            ...prev,
                            [idx]: [allOption, ...agenciesRes.map((a: Agency) => ({ value: a.id, label: a.value }))]
                        }));
                    }
                })
            );
        };

        void fetchAgencies();
    }, [fields, JSON.stringify(watchedItems)]);

    useEffect(() => {
        if (data.targetAudiences && data.targetAudiences.length > 0) {
            setValue("items", data.targetAudiences);
        } else if (data.targetAudiences && data.targetAudiences.length === 0) {
            setValue("items", [{ country: null, cities: [], agencies: [] }]);
        }
    }, [data.targetAudiences, setValue]);

    const onSubmit = async (form: FormValues) => {
        if (!data.promoId) return;

        const hasAllCountries = form.items.some(item => item.country?.value === "all");
        
        if (hasAllCountries) {
            await updateTargetAudiences(data.promoId, {
                countries: [],
                cities: [],
                businesses: [],
            });
        } else {
            const countriesSet = new Set<string>();
            const cities: string[] = [];
            const businesses: string[] = [];

            for (const item of form.items) {
                if (item.country && item.country.value !== "all") {
                    countriesSet.add(item.country.value);
                }
                item.cities.forEach(c => {
                    if (c.value !== "all") {
                        cities.push(c.value);
                    }
                });
                item.agencies.forEach(a => {
                    if (a.value !== "all") {
                        businesses.push(a.value);
                    }
                });
            }

            await updateTargetAudiences(data.promoId, {
                countries: Array.from(countriesSet),
                cities,
                businesses,
            });
        }

        setData({ ...data, targetAudiences: form.items });
        router.push("/dashboard/airline/promos/add/step-3");
    };

    const hasAllCountries = watchedItems?.some(item => item?.country?.value === "all");

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 pb-20">
            {fields.map((field, idx) => {
                const selectedCountry = watchedItems?.[idx]?.country?.value;
                const selectedCities = watchedItems?.[idx]?.cities || [];
                const cities = selectedCountry === "all" ? [allOption] : (selectedCountry ? citiesMap[selectedCountry] || [] : []);
                const agencies = agenciesMap[idx] || [];

                return (
                    <div key={field.id} className="space-y-5 bg-white shadow p-7 rounded-xl">
                        <div className="flex justify-between">
                            <p className="body-M-semibold">{t("promo.target_country_n", { n: idx + 1 })}</p>
                            {fields.length > 1 && (
                                <button type="button" onClick={() => remove(idx)}>
                                    <TrashIcon stroke="#FF482B" />
                                </button>
                            )}
                        </div>

                        <div className="space-y-5 w-[480px]">
                            <Controller
                                control={control}
                                name={`items.${idx}.country`}
                                render={({ field }) => (
                                    <div className="relative">
                                        <Select
                                            {...field}
                                            styles={{ ...baseSelectStyles, ...menuOptionStyles }}
                                            theme={t => ({
                                                ...t,
                                                colors: { ...t.colors, primary: "#2563EB", primary25: "#F3F4F6" },
                                                borderRadius: 12
                                            })}
                                            options={countries}
                                            placeholder={t("promo.select_country")}
                                            onChange={async (selected) => {
                                                const selectedOption = selected as Option;
                                                field.onChange(selectedOption);

                                                setValue(`items.${idx}.cities`, []);
                                                setValue(`items.${idx}.agencies`, []);

                                                if (selectedOption?.value === "all") {
                                                    setValue(`items.${idx}.cities`, [allOption]);
                                                    setValue(`items.${idx}.agencies`, [allOption]);
                                                } else if (selectedOption?.value && selectedOption.value !== "all") {
                                                    const cityRes = await getCitiesByCountry(selectedOption.value);
                                                    setCitiesMap(prev => ({
                                                        ...prev,
                                                        [selectedOption.value]: [allOption, ...cityRes.map((c: City) => ({
                                                            value: c.id,
                                                            label: c.name
                                                        }))]
                                                    }));
                                                }
                                            }}
                                        />
                                        {errors.items?.[idx]?.country && (
                                            <p className="text-sm text-red-500 absolute -bottom-5">
                                                {errors.items[idx]?.country?.message}
                                            </p>
                                        )}
                                    </div>
                                )}
                            />


                            <Controller
                                control={control}
                                name={`items.${idx}.cities`}
                                render={({ field }) => (
                                    <div className="relative">
                                        <Select
                                            {...field}
                                            isMulti
                                            styles={{ ...baseSelectStyles, ...menuOptionStyles }}
                                            options={cities}
                                            placeholder={t("promo.select_cities")}
                                            onChange={(selected) => {
                                                const selectedOptions = selected as Option[];
                                                field.onChange(selectedOptions);
                                                
                                                setValue(`items.${idx}.agencies`, []);
                                            }}
                                        />
                                        {errors.items?.[idx]?.cities && (
                                            <p className="text-sm text-red-500 absolute -bottom-5">{errors.items[idx]?.cities?.message}</p>
                                        )}
                                    </div>
                                )}
                            />

                            <Controller
                                control={control}
                                name={`items.${idx}.agencies`}
                                render={({ field }) => (
                                    <div className="relative">
                                        <Select
                                            {...field}
                                            isMulti
                                            styles={{ ...baseSelectStyles, ...menuOptionStyles }}
                                            options={agencies}
                                            placeholder={t("promo.select_travel_agencies")}
                                        />
                                        {errors.items?.[idx]?.agencies && (
                                            <p className="text-sm text-red-500 absolute -bottom-5">{errors.items[idx]?.agencies?.message}</p>
                                        )}
                                    </div>
                                )}
                            />
                        </div>
                    </div>
                );
            })}

            {!hasAllCountries && (
                <Button
                    variant="ghost"
                    type="button"
                    onClick={() => append({ country: null, cities: [], agencies: [] })}
                >
                    {t("promo.add_new_target_country")}
                </Button>
            )}

            <div className="flex justify-between gap-4 pt-6">
                <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => router.push('/dashboard/airline')}
                    className="border-red-500 text-red-500 hover:bg-red-50 hover:border-red-600 hover:text-red-600"
                >
                    {t("promo.complete_later")}
                </Button>
                <div className="flex gap-4">
                    <Button variant="outline" type="button" onClick={() => {
                        localStorage.removeItem('promo-wizard-data');
                        router.back();
                    }}>
                        {t("promo.back")}
                    </Button>
                    <Button type="submit" disabled={!isValid}>
                        {t("promo.continue")}
                    </Button>
                </div>
            </div>
        </form>
    );
}
