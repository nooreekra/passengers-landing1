"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";
import DatePicker from "react-datepicker";

import Button from "@/shared/ui/Button";
import { baseSelectStyles } from "@/shared/ui/selectStyles";
import { usePromoWizard } from "@/features/promo/lib/PromoWizardContext";
import { updatePromoRules } from "@/features/promo/api/promos";
import { getCountries, getCitiesByCountry, getLocationById } from "@/shared/api/locations";
import "react-datepicker/dist/react-datepicker.css";
import { Input } from "@/shared/ui/Input";
import { useTranslation } from "react-i18next";
import i18n from "@/shared/i18n";

interface Country {
    id: string;
    name: string;
}


type Option = { value: string; label: string };

export default function EditPromoStep3() {
    const params = useParams();
    const promoId = params?.promoId as string | undefined;
    const router = useRouter();
    const { data, setData } = usePromoWizard();
    const businessId = useSelector((state: RootState) => state.business.current?.id);
    const { t } = useTranslation();
    const [countryOptions, setCountryOptions] = useState<Option[]>([]);
    const [originCityOptions, setOriginCityOptions] = useState<Option[]>([]);
    const [destinationCityOptions, setDestinationCityOptions] = useState<Option[]>([]);
    const [flightNumbersText, setFlightNumbersText] = useState("");
    
    const allOption = { value: "all", label: t("common.all") };

    const option = z.object({ value: z.string(), label: z.string() });

    const dateRange = z
        .object({
            from: z.date({ required_error: t("promo.required") }),
            to: z.date({ required_error: t("promo.required") }),
        })
        .refine(({ from, to }) => from <= to, {
            message: t("promo.from_before_till"),
        });

    const promoRulesSchema = z.object({
        bookingPeriod: dateRange,
        travelPeriod: dateRange,
        originCountries: z.array(option).min(1, t("promo.select_at_least_one_country")),
        originCities: z.array(option),
        destinationCountries: z.array(option).min(1, t("promo.select_at_least_one_country")),
        destinationCities: z.array(option),
        flights: z.string().optional(),
        interline: z.boolean(),
        codeshare: z.boolean(),
        internationalOnly: z.boolean(),
    });

    type FormValues = z.infer<typeof promoRulesSchema>;

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(promoRulesSchema),
        defaultValues: {
            bookingPeriod: {
                from: data.rules ? new Date(data.rules.bookingFrom) : undefined,
                to: data.rules ? new Date(data.rules.bookingTo) : undefined,
            },
            travelPeriod: {
                from: data.rules ? new Date(data.rules.travelFrom) : undefined,
                to: data.rules ? new Date(data.rules.travelTo) : undefined,
            },
            originCountries: [],
            originCities: [],
            destinationCountries: [],
            destinationCities: [],
            flights: data.rules?.flightNumbers?.join("\n") || "",
            interline: data.rules?.interlinePartners || false,
            codeshare: data.rules?.codesharePartners || false,
            internationalOnly: data.rules?.internationalOnly || false,
        },
        mode: "all",
    });

    const originCountries = watch("originCountries");
    const destinationCountries = watch("destinationCountries");

    useEffect(() => {
        if (data.rules) {
            setValue("bookingPeriod", {
                from: new Date(data.rules.bookingFrom),
                to: new Date(data.rules.bookingTo),
            });
            setValue("travelPeriod", {
                from: new Date(data.rules.travelFrom),
                to: new Date(data.rules.travelTo),
            });
            
            if (data.rules?.originCountries === "all" || (Array.isArray(data.rules?.originCountries) && data.rules.originCountries.length === 0)) {
                setValue("originCountries", [{ value: "all", label: t("common.all") }]);
            } else if (Array.isArray(data.rules?.originCountries) && data.rules.originCountries.length > 0) {
                const loadCountryNames = async () => {
                    const countriesWithNames = await Promise.all(
                        (Array.isArray(data.rules!.originCountries) ? data.rules!.originCountries : []).map(async (country: any) => {
                            try {
                                const countryData = await getLocationById(country.value || country);
                                return {
                                    value: country.value || country,
                                    label: countryData.name || country.label || country.value || country
                                };
                            } catch (error) {
                                console.error(`Failed to load country ${country.value || country}:`, error);
                                return {
                                    value: country.value || country,
                                    label: country.label || country.value || country
                                };
                            }
                        })
                    );
                    setValue("originCountries", countriesWithNames);
                };
                loadCountryNames();
            } else {
                setValue("originCountries", []);
            }
            
            if (data.rules?.originCities === "all" || (Array.isArray(data.rules?.originCities) && data.rules.originCities.length === 0)) {
                setValue("originCities", [{ value: "all", label: t("common.all") }]);
            } else if (Array.isArray(data.rules?.originCities) && data.rules.originCities.length > 0) {
                const loadCityNames = async () => {
                    const citiesWithNames = await Promise.all(
                        (Array.isArray(data.rules!.originCities) ? data.rules!.originCities : []).map(async (city: any) => {
                            try {
                                const cityData = await getLocationById(city.value || city);
                                return {
                                    value: city.value || city,
                                    label: cityData.name || city.label || city.value || city
                                };
                            } catch (error) {
                                console.error(`Failed to load city ${city.value || city}:`, error);
                                return {
                                    value: city.value || city,
                                    label: city.label || city.value || city
                                };
                            }
                        })
                    );
                    setValue("originCities", citiesWithNames);
                };
                loadCityNames();
            } else {
                setValue("originCities", []);
            }
            
            if (data.rules?.destinationCountries === "all" || (Array.isArray(data.rules?.destinationCountries) && data.rules.destinationCountries.length === 0)) {
                setValue("destinationCountries", [{ value: "all", label: t("common.all") }]);
            } else if (Array.isArray(data.rules?.destinationCountries) && data.rules.destinationCountries.length > 0) {
                const loadCountryNames = async () => {
                    const countriesWithNames = await Promise.all(
                        (Array.isArray(data.rules!.destinationCountries) ? data.rules!.destinationCountries : []).map(async (country: any) => {
                            try {
                                const countryData = await getLocationById(country.value || country);
                                return {
                                    value: country.value || country,
                                    label: countryData.name || country.label || country.value || country
                                };
                            } catch (error) {
                                console.error(`Failed to load country ${country.value || country}:`, error);
                                return {
                                    value: country.value || country,
                                    label: country.label || country.value || country
                                };
                            }
                        })
                    );
                    setValue("destinationCountries", countriesWithNames);
                };
                loadCountryNames();
            } else {
                setValue("destinationCountries", []);
            }
            
            if (data.rules?.destinationCities === "all" || (Array.isArray(data.rules?.destinationCities) && data.rules.destinationCities.length === 0)) {
                setValue("destinationCities", [{ value: "all", label: t("common.all") }]);
            } else if (Array.isArray(data.rules?.destinationCities) && data.rules.destinationCities.length > 0) {
                const loadCityNames = async () => {
                    const citiesWithNames = await Promise.all(
                        (Array.isArray(data.rules!.destinationCities) ? data.rules!.destinationCities : []).map(async (city: any) => {
                            try {
                                const cityData = await getLocationById(city.value || city);
                                return {
                                    value: city.value || city,
                                    label: cityData.name || city.label || city.value || city
                                };
                            } catch (error) {
                                console.error(`Failed to load city ${city.value || city}:`, error);
                                return {
                                    value: city.value || city,
                                    label: city.label || city.value || city
                                };
                            }
                        })
                    );
                    setValue("destinationCities", citiesWithNames);
                };
                loadCityNames();
            } else {
                setValue("destinationCities", []);
            }
            
            setValue("flights", data.rules?.flightNumbers?.join("\n") || "");
            setValue("interline", data.rules?.interlinePartners || false);
            setValue("codeshare", data.rules?.codesharePartners || false);
            setValue("internationalOnly", data.rules?.internationalOnly || false);
        }
    }, [data.rules, setValue]);

    useEffect(() => {
        getCountries().then((res: Country[]) =>
            setCountryOptions([allOption, ...res.map((c) => ({ value: c.id, label: c.name }))])
        );
    }, [i18n.language]);

    useEffect(() => {
        setFlightNumbersText(data.rules?.flightNumbers?.join("\n") || "");
    }, [data]);

    useEffect(() => {
        const loadCities = async () => {
            if (!originCountries.length) {
                setOriginCityOptions([]);
                return;
            }

            if (originCountries.some(c => c.value === "all")) {
                setOriginCityOptions([allOption]);
                return;
            }

            try {
                const responses = await Promise.all(
                    originCountries.map((c) => getCitiesByCountry(c.value))
                );
                const allCities = responses.flat();
                const uniqueCities = Array.from(new Map(allCities.map((c) => [c.id, c])).values());
                setOriginCityOptions([allOption, ...uniqueCities.map((c) => ({ value: c.id, label: c.name }))]);
            } catch (e) {
                console.error("Failed to load origin cities", e);
            }
        };
        void loadCities();
    }, [originCountries, i18n.language]);

    useEffect(() => {
        const loadCities = async () => {
            if (!destinationCountries.length) {
                setDestinationCityOptions([]);
                return;
            }

            if (destinationCountries.some(c => c.value === "all")) {
                setDestinationCityOptions([allOption]);
                return;
            }

            try {
                const responses = await Promise.all(
                    destinationCountries.map((c) => getCitiesByCountry(c.value))
                );
                const allCities = responses.flat();
                const uniqueCities = Array.from(new Map(allCities.map((c) => [c.id, c])).values());
                setDestinationCityOptions([allOption, ...uniqueCities.map((c) => ({ value: c.id, label: c.name }))]);
            } catch (e) {
                console.error("Failed to load destination cities", e);
            }
        };
        void loadCities();
    }, [destinationCountries, i18n.language]);

    const toStartOfDayZ = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}T00:00:00Z`;
    const toEndOfDayZ = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}T23:59:59Z`;

    const transformFormData = (form: FormValues) => {
        const hasAllOriginCountries = form.originCountries.some(c => c.value === "all");
        const hasAllDestinationCountries = form.destinationCountries.some(c => c.value === "all");
        
        return {
            bookingFrom: toStartOfDayZ(form.bookingPeriod.from),
            bookingTo: toEndOfDayZ(form.bookingPeriod.to),
            travelFrom: toStartOfDayZ(form.travelPeriod.from),
            travelTo: toEndOfDayZ(form.travelPeriod.to),
            originCountries: hasAllOriginCountries ? [] : form.originCountries.filter(c => c.value !== "all").map((o) => o.value),
            originCities: hasAllOriginCountries || form.originCities.some(c => c.value === "all") ? [] : form.originCities.filter(c => c.value !== "all").map((o) => o.value),
            destinationCountries: hasAllDestinationCountries ? [] : form.destinationCountries.filter(c => c.value !== "all").map((o) => o.value),
            destinationCities: hasAllDestinationCountries || form.destinationCities.some(c => c.value === "all") ? [] : form.destinationCities.filter(c => c.value !== "all").map((o) => o.value),
            flightNumbers: form.flights ? form.flights.split("\n").map(s => s.trim()).filter(Boolean) : [],
            interlinePartners: form.interline,
            codesharePartners: form.codeshare,
            internationalOnly: form.internationalOnly,
        };
    };

    const onSubmit = async (form: FormValues) => {
        if (!promoId) return;
        try {
            const transformed = transformFormData({ ...form, flights: flightNumbersText });
            await updatePromoRules(promoId as string, transformed);
            setData((prevData) => ({ ...prevData, rules: transformed }));
            router.push(`/dashboard/airline/promos/${promoId}/edit/step-4`);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } }; message?: string };
            console.error(err);
            alert(err?.response?.data?.message || err?.message || "Failed to submit rule");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 pb-20">
            <section className="shadow rounded-lg bg-white p-7 flex flex-col space-y-9">
                <h5 className="text-label-primary">{t("promo.dates")}</h5>
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <p className="body-M-semibold">{t("promo.booking_period")}</p>
                        <div className="flex">
                            <Controller
                                control={control}
                                name="bookingPeriod.from"
                                render={({ field }) => (
                                    <DatePicker
                                        className="input"
                                        placeholderText={t("promo.from")}
                                        selected={field.value}
                                        onChange={field.onChange}
                                        customInput={<Input/>}
                                    />
                                )}
                            />
                            <Controller
                                control={control}
                                name="bookingPeriod.to"
                                render={({ field }) => (
                                    <DatePicker
                                        className="input"
                                        placeholderText={t("promo.till")}
                                        selected={field.value}
                                        onChange={field.onChange}
                                        customInput={<Input/>}
                                    />
                                )}
                            />
                            {errors.bookingPeriod?.message && (
                                <p className="text-red-500 text-sm">{errors.bookingPeriod.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="body-M-semibold">{t("promo.travel_period")}</p>
                        <div className="flex">
                            <Controller
                                control={control}
                                name="travelPeriod.from"
                                render={({ field }) => (
                                    <DatePicker
                                        customInput={<Input/>}
                                        className="input"
                                        placeholderText={t("promo.from")}
                                        selected={field.value}
                                        onChange={field.onChange} />
                                )}
                            />
                            <Controller
                                control={control}
                                name="travelPeriod.to"
                                render={({ field }) => (
                                    <DatePicker
                                        customInput={<Input/>}
                                        className="input"
                                        placeholderText={t("promo.till")}
                                        selected={field.value}
                                        onChange={field.onChange} />
                                )}
                            />
                            {errors.travelPeriod?.message && (
                                <p className="text-red-500 text-sm">{errors.travelPeriod.message}</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid xl:grid-cols-2 gap-6">
                <div className="bg-white p-7 rounded-xl space-y-4">
                    <h5 className="text-label-primary">{t("promo.origin")}</h5>
                    <Controller
                        control={control}
                        name="originCountries"
                        render={({ field }) => (
                            <Select {...field} isMulti
                                    options={countryOptions}
                                    styles={baseSelectStyles}
                                    placeholder={t("promo.select_country")}
                                    onChange={(selected) => {
                                        const selectedOptions = selected as Option[];
                                        field.onChange(selectedOptions);
                                        
                                        setValue("originCities", []);
                                        
                                        if (selectedOptions?.some(option => option.value === "all")) {
                                            setValue("originCities", [allOption]);
                                        }
                                    }} />
                        )}
                    />
                    <Controller
                        control={control}
                        name="originCities"
                        render={({ field }) => (
                            <Select {...field}
                                    isMulti
                                    options={originCityOptions}
                                    styles={baseSelectStyles}
                                    placeholder={t("promo.select_city")}
                                    onChange={(selected) => {
                                        const selectedOptions = selected as Option[];
                                        field.onChange(selectedOptions);
                                        
                                        if (selectedOptions?.some(option => option.value === "all")) {
                                            field.onChange([allOption]);
                                        }
                                    }} />
                        )}
                    />
                </div>

                <div className="bg-white p-7 rounded-xl space-y-4">
                    <h5 className="text-label-primary">{t("promo.destination")}</h5>
                    <Controller
                        control={control}
                        name="destinationCountries"
                        render={({ field }) => (
                            <Select {...field} isMulti
                                    options={countryOptions}
                                    styles={baseSelectStyles}
                                    placeholder={t("promo.select_country")}
                                    onChange={(selected) => {
                                        const selectedOptions = selected as Option[];
                                        field.onChange(selectedOptions);
                                        
                                        setValue("destinationCities", []);
                                        
                                        if (selectedOptions?.some(option => option.value === "all")) {
                                            setValue("destinationCities", [allOption]);
                                        }
                                    }} />
                        )}
                    />
                    <Controller
                        control={control}
                        name="destinationCities"
                        render={({ field }) => (
                            <Select {...field}
                                    isMulti
                                    options={destinationCityOptions}
                                    styles={baseSelectStyles}
                                    placeholder={t("promo.select_city")}
                                    onChange={(selected) => {
                                        const selectedOptions = selected as Option[];
                                        field.onChange(selectedOptions);
                                        
                                        if (selectedOptions?.some(option => option.value === "all")) {
                                            field.onChange([allOption]);
                                        }
                                    }} />
                        )}
                    />
                </div>
            </section>

            <section className="grid xl:grid-cols-2 gap-6">
                <div className="bg-white p-7 rounded-xl space-y-4">
                    <h5 className="text-label-primary">{t("promo.flight_numbers")}</h5>
                    <textarea
                        rows={3}
                        className="w-full rounded-lg border px-2 py-1.5 text-sm focus:outline-none"
                        value={flightNumbersText}
                        onChange={(e) => setFlightNumbersText(e.target.value)}
                        placeholder={t("promo.flight_numbers_placeholder", { defaultValue: "XX001\nXX002" })}
                    />
                    <div className="mt-1 text-xs text-gray-500">{t("promo.flight_numbers_hint", { defaultValue: "Enter one flight number per line" })}</div>
                </div>

                <div className="bg-white p-7 rounded-xl space-y-4">
                    <h5 className="text-label-primary">{t("promo.partner_carriers")}</h5>
                    <Controller
                        control={control}
                        name="interline"
                        render={({ field }) => (
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                                {t("promo.interline_partners")}
                            </label>
                        )}
                    />
                    <Controller
                        control={control}
                        name="codeshare"
                        render={({ field }) => (
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                                {t("promo.codeshare_partners")}
                            </label>
                        )}
                    />
                </div>
            </section>

            <section className="bg-white p-7 rounded-xl space-y-4">
                <h5 className="text-label-primary">{t("promo.additional_rules")}</h5>
                <Controller
                    control={control}
                    name="internationalOnly"
                    render={({ field }) => (
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                            {t("promo.international_only")}
                        </label>
                    )}
                />
            </section>

            <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => {
                    localStorage.removeItem('promo-wizard-data');
                    router.back();
                }}>
                    {t("promo.back")}
                </Button>
                <Button type="submit">
                    {t("promo.continue")}
                </Button>
            </div>
        </form>
    );
}