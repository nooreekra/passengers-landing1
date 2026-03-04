"use client";

import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Business, UpdateBusinessPayload } from "@/entities/business/types";
import { updateBusiness } from "@/shared/api/business";
import { uploadToStorage } from "@/shared/api/storage";
import Dropzone from "@/shared/ui/Dropzone";
import { useTranslation } from "react-i18next";
import i18n from "@/shared/i18n";
import { Input } from "@/shared/ui/Input";
import Button from "@/shared/ui/Button";
import { getCountries, getCitiesByCountry } from "@/shared/api/locations";
import { Location } from "@/entities/locations/types";
import SelectOne from "@/shared/ui/SelectOne";
import InfoTooltip from "@/shared/ui/InfoTooltip";

type Props = {
    open: boolean;
    data: Business;
    onClose: () => void;
    onSaved: (next: Business) => void;
};

export default function BusinessEditModal({ open, data, onClose, onSaved }: Props) {
    const { t } = useTranslation();

    const userType = data.type;

    const [form, setForm] = useState<UpdateBusinessPayload>({
        ...data,
        pseudoCityCode: data.pseudoCityCode || [],
        sameAsRegisteredAddress: data.sameAsRegisteredAddress !== false
    });
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>("");
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pccText, setPccText] = useState("");
    const [iataValidatorText, setIataValidatorText] = useState("");
    const [officeIdsText, setOfficeIdsText] = useState("");
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [countries, setCountries] = useState<Location[]>([]);
    const [cities, setCities] = useState<Location[]>([]);
    const [countriesLoading, setCountriesLoading] = useState(false);
    const [citiesLoading, setCitiesLoading] = useState(false);
    const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
    const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
    
    const [headOfficeCountries, setHeadOfficeCountries] = useState<Location[]>([]);
    const [headOfficeCities, setHeadOfficeCities] = useState<Location[]>([]);
    const [headOfficeCountriesLoading, setHeadOfficeCountriesLoading] = useState(false);
    const [headOfficeCitiesLoading, setHeadOfficeCitiesLoading] = useState(false);
    const [selectedHeadOfficeCountryId, setSelectedHeadOfficeCountryId] = useState<string | null>(null);
    const [selectedHeadOfficeCityId, setSelectedHeadOfficeCityId] = useState<string | null>(null);

    const currentPreview = useMemo(() => preview || form.logoUri || "", [preview, form.logoUri]);

    useEffect(() => {
        const headquartersMatchesRegistered = 
            data.headquartersAddress === data.legalAddress &&
            data.headquartersFirstAddressLine === data.firstAddressLine &&
            data.headquartersSecondAddressLine === data.secondAddressLine &&
            data.headquartersPostIndex === data.postIndex &&
            data.headquartersCountryId === data.countryId &&
            data.headquartersCityId === data.cityId;
        
        const isSameAsRegistered = data.sameAsRegisteredAddress !== false && headquartersMatchesRegistered;
        
        setForm({ 
            ...data, 
            sameAsRegisteredAddress: isSameAsRegistered,
            ...(isSameAsRegistered ? {
                headquartersAddress: data.legalAddress,
                headquartersFirstAddressLine: data.firstAddressLine,
                headquartersSecondAddressLine: data.secondAddressLine,
                headquartersPostIndex: data.postIndex,
                headquartersCountryId: data.countryId,
                headquartersCityId: data.cityId
            } : {})
        });
        setFile(null);
        setPreview("");
        setError(null);
        setPccText((data.pseudoCityCode || []).join("\n"));
        setIataValidatorText((data.iataValidator || []).join("\n"));
        setOfficeIdsText((data.officeIds || []).join("\n"));
        setSelectedCountryId(data.countryId || null);
        setSelectedCityId(data.cityId || null);
        setSelectedHeadOfficeCountryId(data.headquartersCountryId || null);
        setSelectedHeadOfficeCityId(data.headquartersCityId || null);
    }, [data, open]);

    useEffect(() => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const loadCities = async (countryId: string) => {
        if (!countryId) {
            setCities([]);
            return;
        }
        setCitiesLoading(true);
        try {
            const citiesData = await getCitiesByCountry(countryId);
            setCities(citiesData);
        } catch (error) {
            console.error("Failed to load cities:", error);
            setCities([]);
        } finally {
            setCitiesLoading(false);
        }
    };

    const loadHeadOfficeCities = async (countryId: string) => {
        if (!countryId) {
            setHeadOfficeCities([]);
            return;
        }
        setHeadOfficeCitiesLoading(true);
        try {
            const citiesData = await getCitiesByCountry(countryId);
            setHeadOfficeCities(citiesData);
        } catch (error) {
            console.error("Failed to load head office cities:", error);
            setHeadOfficeCities([]);
        } finally {
            setHeadOfficeCitiesLoading(false);
        }
    };

    useEffect(() => {
        const loadCountries = async () => {
            setCountriesLoading(true);
            setHeadOfficeCountriesLoading(true);
            try {
                const countriesData = await getCountries();
                setCountries(countriesData);
                setHeadOfficeCountries(countriesData);
            } catch (error) {
                console.error("Failed to load countries:", error);
            } finally {
                setCountriesLoading(false);
                setHeadOfficeCountriesLoading(false);
            }
        };

        if (open) {
            loadCountries();
        }
    }, [open, i18n.language]);

    useEffect(() => {
        if (selectedCountryId) {
            loadCities(selectedCountryId);
        } else {
            setCities([]);
        }
    }, [selectedCountryId, i18n.language]);

    useEffect(() => {
        if (selectedHeadOfficeCountryId) {
            loadHeadOfficeCities(selectedHeadOfficeCountryId);
        } else {
            setHeadOfficeCities([]);
        }
    }, [selectedHeadOfficeCountryId, i18n.language]);

    useEffect(() => {
        if (data.countryId && countries.length > 0) {
            const country = countries.find(c => c.id === data.countryId);
            if (country) {
                setForm(f => ({ ...f, countryOfIncorporation: country.name }));
            }
        }
    }, [data.countryId, countries]);

    useEffect(() => {
        if (data.cityId && cities.length > 0) {
            const city = cities.find(c => c.id === data.cityId);
            if (city) {
                setForm(f => ({ ...f, city: city.name }));
            }
        }
    }, [data.cityId, cities]);

    useEffect(() => {
        if (form.sameAsRegisteredAddress) {
            setForm(f => ({
                ...f,
                headquartersAddress: f.legalAddress,
                headquartersFirstAddressLine: f.firstAddressLine,
                headquartersSecondAddressLine: f.secondAddressLine,
                headquartersPostIndex: f.postIndex,
                headquartersCountryId: f.countryId,
                headquartersCityId: f.cityId
            }));
            
            setSelectedHeadOfficeCountryId(selectedCountryId);
            setSelectedHeadOfficeCityId(selectedCityId);
        }
    }, [
        form.legalAddress,
        form.firstAddressLine,
        form.secondAddressLine,
        form.postIndex,
        form.countryOfIncorporation,
        form.countryId,
        form.cityId,
        form.sameAsRegisteredAddress,
        selectedCountryId,
        selectedCityId
    ]);


    const setField =
        (k: keyof UpdateBusinessPayload) =>
            (e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((f) => ({ ...f, [k]: e.target.value }));

    const validateLatinOnly = (value: string): boolean => {
        return /^[a-zA-Z\s]*$/.test(value);
    };

    const validateLatinAndNumbers = (value: string): boolean => {
        return /^[a-zA-Z0-9\s]*$/.test(value);
    };

    const setFieldWithLatinValidation =
        (k: keyof UpdateBusinessPayload) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                setForm((f) => ({ ...f, [k]: value }));
                
                if (value && !validateLatinOnly(value)) {
                    setValidationErrors(prev => ({ ...prev, [k]: t("business.validation.latinOnly", "Только латинские буквы разрешены") }));
                } else {
                    setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[k];
                        return newErrors;
                    });
                }
            };

    const setFieldWithAddressValidation =
        (k: keyof UpdateBusinessPayload) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                setForm((f) => ({ ...f, [k]: value }));
                
                if (value && !validateLatinAndNumbers(value)) {
                    setValidationErrors(prev => ({ ...prev, [k]: t("business.validation.address", "Только латинские буквы, цифры и пробелы разрешены") }));
                } else {
                    setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[k];
                        return newErrors;
                    });
                }
            };

    const setFieldWithCompanyNameValidation =
        (k: keyof UpdateBusinessPayload) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                setForm((f) => ({ ...f, [k]: value }));
                
                if (value && !validateLatinAndNumbers(value)) {
                    setValidationErrors(prev => ({ ...prev, [k]: t("business.validation.companyName", "Только латинские буквы, цифры и пробелы разрешены") }));
                } else {
                    setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[k];
                        return newErrors;
                    });
                }
            };

    const setPccTextWithValidation = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setPccText(value);
        
        if (value && !validateLatinAndNumbers(value)) {
            setValidationErrors(prev => ({ ...prev, pccText: t("business.validation.latinAndNumbers", "Только латинские буквы и цифры разрешены") }));
        } else {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.pccText;
                return newErrors;
            });
        }
    };

    const setIataValidatorTextWithValidation = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setIataValidatorText(value);
        
        if (value && !validateLatinAndNumbers(value)) {
            setValidationErrors(prev => ({ ...prev, iataValidatorText: t("business.validation.latinAndNumbers", "Только латинские буквы и цифры разрешены") }));
        } else {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.iataValidatorText;
                return newErrors;
            });
        }
    };

    const setOfficeIdsTextWithValidation = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setOfficeIdsText(value);
        
        if (value && !validateLatinAndNumbers(value)) {
            setValidationErrors(prev => ({ ...prev, officeIdsText: t("business.validation.latinAndNumbers", "Только латинские буквы и цифры разрешены") }));
        } else {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.officeIdsText;
                return newErrors;
            });
        }
    };

    const parseArray = (txt: string) =>
        Array.from(
            new Set(
                txt
                    .split(/\r?\n/)
                    .map((s) => s.trim())
                    .filter(Boolean)
            )
        );

    const countryOptions = useMemo(() =>
        countries.map(country => ({
            value: country.name,
            label: country.name
        })), [countries]
    );

    const cityOptions = useMemo(() =>
        cities.map(city => ({
            value: city.name,
            label: city.name
        })), [cities]
    );

    const headOfficeCountryOptions = useMemo(() =>
        headOfficeCountries.map(country => ({
            value: country.name,
            label: country.name
        })), [headOfficeCountries]
    );

    const headOfficeCityOptions = useMemo(() =>
        headOfficeCities.map(city => ({
            value: city.name,
            label: city.name
        })), [headOfficeCities]
    );

    const uploadLogoIfNeeded = async (): Promise<string | null> => {
        if (!file) return null;
        setUploading(true);
        try {
            return await uploadToStorage(file);
        } finally {
            setUploading(false);
        }
    };

    const submit = async () => {
        if (!form.tradingName?.trim() || !form.legalName?.trim()) {
            setError(t("business.modal.fillNames"));
            return;
        }
        if (form.corporateEmail && !/^\S+@\S+\.\S+$/.test(form.corporateEmail)) {
            setError(t("business.modal.badEmail"));
            return;
        }

        setSaving(true);
        try {
            const uploadedUrl = await uploadLogoIfNeeded();
            const { sameAsRegisteredAddress, ...formWithoutSameAs } = form;
            
            const legalAddress = [form.firstAddressLine, form.secondAddressLine]
                .filter(Boolean)
                .join(', ');
            
            const headquartersAddress = [form.headquartersFirstAddressLine, form.headquartersSecondAddressLine]
                .filter(Boolean)
                .join(', ');
            
            const payload: UpdateBusinessPayload = {
                ...formWithoutSameAs,
                legalAddress,
                headquartersAddress,
                logoUri: uploadedUrl ?? form.logoUri ?? null,
                countryId: selectedCountryId,
                cityId: selectedCityId,
                headquartersCountryId: selectedHeadOfficeCountryId,
                headquartersCityId: selectedHeadOfficeCityId,
                iataNumericCode:
                    form.iataNumericCode === null ||
                        form.iataNumericCode === undefined ||
                        (form.iataNumericCode as any) === ""
                        ? null
                        : Number(form.iataNumericCode),
                pseudoCityCode: parseArray(pccText),
                iataValidator: parseArray(iataValidatorText),
                officeIds: parseArray(officeIdsText),
            };

            const saved = await updateBusiness((data as Business).id, payload);
            onSaved(saved);
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || t("business.modal.saveError"));
        } finally {
            setSaving(false);
        }
    };

    const clearLogo = () => {
        setFile(null);
        setPreview("");
        setForm((f) => ({ ...f, logoUri: null }));
    };

    const input = "w-full rounded-lg border px-2 py-1.5 text-sm";

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => !saving && onClose()}>
                <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0 translate-y-2" enterTo="opacity-100 translate-y-0" leave="ease-in duration-100" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-2">
                            <Dialog.Panel className="w-full max-w-2xl h-[80vh] rounded-2xl bg-white p-4 shadow flex flex-col">
                                <Dialog.Title className="text-lg font-semibold mb-3 flex-shrink-0 flex items-center gap-2">
                                    {t("business.modal.title")}
                                    <InfoTooltip 
                                        text={t("business.modal.latinInfo", "Вся информация должна быть заполнена латинскими буквами")} 
                                        position="right" 
                                    />
                                </Dialog.Title>

                                <div className="flex-1 overflow-y-auto">
                                    <div className="grid gap-3 mb-4 md:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t("business.fields.tradingName")}</label>
                                            <Input className={input} value={form.tradingName || ""} onChange={setFieldWithCompanyNameValidation("tradingName")} />
                                        {validationErrors.tradingName && (
                                            <div className="mt-1 text-sm text-red-600">{validationErrors.tradingName}</div>
                                        )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t("business.fields.legalName")}</label>
                                            <Input className={input} value={form.legalName || ""} onChange={setFieldWithCompanyNameValidation("legalName")} />
                                            {validationErrors.legalName && (
                                                <div className="mt-1 text-sm text-red-600">{validationErrors.legalName}</div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t("business.fields.corporateEmail")}</label>
                                            <Input className={input} value={form.corporateEmail || ""} onChange={setField("corporateEmail")} />
                                        </div>
                                    </div>

                                    {/* Registered Address Section */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">{t("business.fields.registeredAddress", { defaultValue: "Registered Address" })}</h3>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t("business.fields.firstAddressLine")}</label>
                                                <Input className={input} value={form.firstAddressLine || ""} onChange={setFieldWithAddressValidation("firstAddressLine")} />
                                                {validationErrors.firstAddressLine && (
                                                    <div className="mt-1 text-sm text-red-600">{validationErrors.firstAddressLine}</div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t("business.fields.secondAddressLine")}</label>
                                                <Input className={input} value={form.secondAddressLine || ""} onChange={setFieldWithAddressValidation("secondAddressLine")} />
                                                {validationErrors.secondAddressLine && (
                                                    <div className="mt-1 text-sm text-red-600">{validationErrors.secondAddressLine}</div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t("business.fields.countryOfIncorporation")}</label>
                                                <SelectOne
                                                    value={form.countryId ? countries.find(c => c.id === form.countryId)?.name || "" : ""}
                                                    opts={countryOptions}
                                                    onChange={(value) => {
                                                        const selectedCountry = countries.find(c => c.name === value);
                                                        setSelectedCountryId(selectedCountry?.id || null);
                                                        setSelectedCityId(null);
                                                        setForm(f => ({ 
                                                            ...f, 
                                                            countryOfIncorporation: value, 
                                                            city: "",
                                                            countryId: selectedCountry?.id || null,
                                                            cityId: null
                                                        }));
                                                    }}
                                                    placeholder={countriesLoading ? t("common.loading", { defaultValue: "Loading..." }) : t("common.selectCountry", { defaultValue: "Select country" })}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t("business.fields.city")}</label>
                                                <SelectOne
                                                    value={form.cityId ? cities.find(c => c.id === form.cityId)?.name || "" : ""}
                                                    opts={cityOptions}
                                                    onChange={(value) => {
                                                        const selectedCity = cities.find(c => c.name === value);
                                                        setSelectedCityId(selectedCity?.id || null);
                                                        setForm(f => ({ 
                                                            ...f, 
                                                            city: value,
                                                            cityId: selectedCity?.id || null
                                                        }));
                                                    }}
                                                    placeholder={citiesLoading ? t("common.loading", { defaultValue: "Loading..." }) : t("common.selectCity", { defaultValue: "Select city" })}
                                                    disabled={!selectedCountryId}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t("business.fields.postIndex")}</label>
                                                <Input className={input} value={form.postIndex || ""} onChange={setField("postIndex")} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Head Office Address Section */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            <h3 className="text-lg font-medium text-gray-900">{t("business.fields.headOfficeAddress", { defaultValue: "Head Office Address" })}</h3>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="sameAsRegistered"
                                                    checked={form.sameAsRegisteredAddress !== false}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setForm(f => ({ 
                                                        ...f, 
                                                        sameAsRegisteredAddress: checked,
                                                        headquartersAddress: checked ? f.legalAddress : f.headquartersAddress,
                                                        headquartersFirstAddressLine: checked ? f.firstAddressLine : f.headquartersFirstAddressLine,
                                                        headquartersSecondAddressLine: checked ? f.secondAddressLine : f.headquartersSecondAddressLine,
                                                        headquartersPostIndex: checked ? f.postIndex : f.headquartersPostIndex,
                                                        headquartersCountryId: checked ? f.countryId : f.headquartersCountryId,
                                                        headquartersCityId: checked ? f.cityId : f.headquartersCityId
                                                    }));
                                                    
                                                    if (checked) {
                                                        setSelectedHeadOfficeCountryId(selectedCountryId);
                                                        setSelectedHeadOfficeCityId(selectedCityId);
                                                    }
                                                }}
                                                    className="rounded border-gray-300"
                                                />
                                                <label htmlFor="sameAsRegistered" className="text-sm font-medium text-gray-700">
                                                    {t("business.fields.sameAsRegistered", { defaultValue: "Same as registered address" })}
                                                </label>
                                            </div>
                                        </div>

                                        {!form.sameAsRegisteredAddress && (
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("business.fields.firstAddressLine")}</label>
                                                    <Input className={input} value={form.headquartersFirstAddressLine || ""} onChange={setFieldWithAddressValidation("headquartersFirstAddressLine")} />
                                                    {validationErrors.headquartersFirstAddressLine && (
                                                        <div className="mt-1 text-sm text-red-600">{validationErrors.headquartersFirstAddressLine}</div>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("business.fields.secondAddressLine")}</label>
                                                    <Input className={input} value={form.headquartersSecondAddressLine || ""} onChange={setFieldWithAddressValidation("headquartersSecondAddressLine")} />
                                                    {validationErrors.headquartersSecondAddressLine && (
                                                        <div className="mt-1 text-sm text-red-600">{validationErrors.headquartersSecondAddressLine}</div>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("business.fields.countryOfIncorporation")}</label>
                                                    <SelectOne
                                                        value={form.headquartersCountryId ? headOfficeCountries.find(c => c.id === form.headquartersCountryId)?.name || "" : ""}
                                                        opts={headOfficeCountryOptions}
                                                        onChange={(value) => {
                                                            const selectedCountry = headOfficeCountries.find(c => c.name === value);
                                                            setSelectedHeadOfficeCountryId(selectedCountry?.id || null);
                                                            setSelectedHeadOfficeCityId(null);
                                                            setForm(f => ({ 
                                                                ...f, 
                                                                headquartersCountryId: selectedCountry?.id || null,
                                                                headquartersCityId: null
                                                            }));
                                                        }}
                                                        placeholder={headOfficeCountriesLoading ? t("common.loading", { defaultValue: "Loading..." }) : t("common.selectCountry", { defaultValue: "Select country" })}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("business.fields.city")}</label>
                                                    <SelectOne
                                                        value={form.headquartersCityId ? headOfficeCities.find(c => c.id === form.headquartersCityId)?.name || "" : ""}
                                                        opts={headOfficeCityOptions}
                                                        onChange={(value) => {
                                                            const selectedCity = headOfficeCities.find(c => c.name === value);
                                                            setSelectedHeadOfficeCityId(selectedCity?.id || null);
                                                            setForm(f => ({ 
                                                                ...f, 
                                                                headquartersCityId: selectedCity?.id || null
                                                            }));
                                                        }}
                                                        placeholder={headOfficeCitiesLoading ? t("common.loading", { defaultValue: "Loading..." }) : t("common.selectCity", { defaultValue: "Select city" })}
                                                        disabled={!selectedHeadOfficeCountryId}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("business.fields.postIndex")}</label>
                                                    <Input className={input} value={form.headquartersPostIndex || ""} onChange={setField("headquartersPostIndex")} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* IATA fields - show only for airlines (not TravelAgency) */}
                                    {userType !== "TravelAgency" && (
                                        <div className="grid gap-3 mb-4 md:grid-cols-2">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.iataDesignator")}</label>
                                                <Input className={input} value={form.iataDesignator || ""} onChange={setFieldWithLatinValidation("iataDesignator")} />
                                                {validationErrors.iataDesignator && (
                                                    <div className="mt-1 text-sm text-red-600">{validationErrors.iataDesignator}</div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.iataNumericCode")}</label>
                                                <Input className={input} value={(form.iataNumericCode as any) ?? ""} onChange={setField("iataNumericCode" as any)} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t("business.fields.icao")}</label>
                                                <Input className={input} value={form.icaoCode || ""} onChange={setFieldWithLatinValidation("icaoCode")} />
                                                {validationErrors.icaoCode && (
                                                    <div className="mt-1 text-sm text-red-600">{validationErrors.icaoCode}</div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Array fields - show for TravelAgency */}
                                    {userType === "TravelAgency" && (
                                        <div className="space-y-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                                    {t("business.fields.pseudoCityCode")}
                                                    <InfoTooltip text={t("business.fields.pseudoCityCodeTooltip")} position="right" />
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    className="w-full rounded-lg border px-2 py-1.5 text-sm"
                                                    value={pccText}
                                                    onChange={setPccTextWithValidation}
                                                    placeholder={t("business.fields.pseudoCityCodePh", { defaultValue: "ABC1\nXYZ2" })}
                                                />
                                                {validationErrors.pccText && (
                                                    <div className="mt-1 text-sm text-red-600">{validationErrors.pccText}</div>
                                                )}
                                                <div className="mt-1 text-xs text-gray-500">{t("business.fields.pseudoCityCodeHint", { defaultValue: "Enter one code per line" })}</div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                                    {t("business.fields.iataValidator")}
                                                    <InfoTooltip text={t("business.fields.iataValidatorTooltip")} position="right" />
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    className="w-full rounded-lg border px-2 py-1.5 text-sm"
                                                    value={iataValidatorText}
                                                    onChange={setIataValidatorTextWithValidation}
                                                    placeholder={t("business.fields.iataValidatorPh", { defaultValue: "Validator1\nValidator2" })}
                                                />
                                                {validationErrors.iataValidatorText && (
                                                    <div className="mt-1 text-sm text-red-600">{validationErrors.iataValidatorText}</div>
                                                )}
                                                <div className="mt-1 text-xs text-gray-500">{t("business.fields.iataValidatorHint", { defaultValue: "Enter one validator per line" })}</div>
                                            </div>

                                            {data.ticketingAuthority === false && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                                        {t("business.fields.officeIds")}
                                                        <InfoTooltip text={t("business.fields.officeIdsTooltip")} position="right" />
                                                    </label>
                                                    <textarea
                                                        rows={3}
                                                        className="w-full rounded-lg border px-2 py-1.5 text-sm"
                                                        value={officeIdsText}
                                                        onChange={setOfficeIdsTextWithValidation}
                                                        placeholder={t("business.fields.officeIdsPh", { defaultValue: "Office1\nOffice2" })}
                                                    />
                                                    {validationErrors.officeIdsText && (
                                                        <div className="mt-1 text-sm text-red-600">{validationErrors.officeIdsText}</div>
                                                    )}
                                                    <div className="mt-1 text-xs text-gray-500">{t("business.fields.officeIdsHint", { defaultValue: "Enter one office ID per line" })}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            {t("business.logo.label")}
                                            <InfoTooltip text={t("business.logo.tooltip", { defaultValue: "Загрузите квадратное изображение для логотипа" })} position="right" />
                                        </label>
                                        <Dropzone onSelect={(f) => setFile(f)} preview={currentPreview || undefined} />
                                        <div className="mt-2 flex gap-2">
                                            <Input
                                                className={input + " flex-1"}
                                                placeholder={t("business.logo.placeholder")}
                                                value={form.logoUri || ""}
                                                onChange={setField("logoUri")}
                                            />
                                            <button type="button" onClick={clearLogo} className="px-2 py-1.5 rounded-lg border text-sm">
                                                {t("business.logo.clear")}
                                            </button>
                                        </div>
                                        {(uploading || saving) && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {uploading ? t("business.logo.uploading") : ""}
                                            </div>
                                        )}
                                    </div>

                                    {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
                                </div>

                                <div className="mt-4 flex justify-end gap-2 flex-shrink-0">
                                    <Button onClick={onClose} disabled={saving || uploading} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm">
                                        <p className="text-black">{t("common.cancel")}</p>
                                    </Button>
                                    <Button onClick={submit} disabled={saving || uploading} className="px-3 py-1.5 rounded-lg bg-black text-white disabled:opacity-50 text-sm">
                                        {saving ? t("common.saving") : t("common.save")}
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
