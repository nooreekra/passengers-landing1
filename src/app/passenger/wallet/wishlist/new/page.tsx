"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { getWallet, createWishlist } from "@/shared/api/passenger";
import { getCountries, getCitiesByCountry } from "@/shared/api/locations";
import type { Location } from "@/entities/locations/types";
import SearchableSelect from "@/shared/ui/SearchableSelect";

const NewWishlistPage = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const [walletId, setWalletId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [isCustomName, setIsCustomName] = useState(false);
    const [customName, setCustomName] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [countries, setCountries] = useState<Location[]>([]);
    const [cities, setCities] = useState<Location[]>([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [target, setTarget] = useState("");
    const [rules, setRules] = useState("");
    const [percentage, setPercentage] = useState("");

    useEffect(() => {
        const loadWallet = async () => {
            try {
                const wallet = await getWallet();
                setWalletId(wallet.id);
            } catch (error) {
                console.error("Failed to load wallet:", error);
                router.push("/passenger/wallet");
            }
        };
        loadWallet();
    }, [router]);

    useEffect(() => {
        const loadCountries = async () => {
            try {
                const countriesData = await getCountries();
                setCountries(countriesData);
            } catch (error) {
                console.error("Failed to load countries:", error);
            }
        };
        loadCountries();
    }, []);

    useEffect(() => {
        const loadCities = async () => {
            if (!selectedCountry) {
                setCities([]);
                setSelectedCity("");
                return;
            }

            try {
                setLoadingCities(true);
                const citiesData = await getCitiesByCountry(selectedCountry);
                setCities(citiesData);
                setSelectedCity(""); // Сбрасываем выбор города при смене страны
            } catch (error) {
                console.error("Failed to load cities:", error);
                setCities([]);
            } finally {
                setLoadingCities(false);
            }
        };
        loadCities();
    }, [selectedCountry]);

    // Преобразуем countries в формат для SearchableSelect
    const countryOptions = useMemo(() => {
        return countries.map((country) => ({
            value: country.id,
            label: country.name,
        }));
    }, [countries]);

    // Преобразуем cities в формат для SearchableSelect
    const cityOptions = useMemo(() => {
        return cities.map((city) => ({
            value: city.id,
            label: city.name,
        }));
    }, [cities]);

    const nameOptions = useMemo(() => [
        { value: "dreamHoliday", label: t("passenger.wallet.nameOptions.dreamHoliday") },
        { value: "familyVacation", label: t("passenger.wallet.nameOptions.familyVacation") },
        { value: "friendsTrip", label: t("passenger.wallet.nameOptions.friendsTrip") },
        { value: "weekendEscape", label: t("passenger.wallet.nameOptions.weekendEscape") },
        { value: "chooseYourOwn", label: t("passenger.wallet.nameOptions.chooseYourOwn") }
    ], [t]);

    const rulesOptions = useMemo(() => [
        { value: "no rules set", label: t("passenger.wallet.noRulesSet") || "no rules set" },
        { value: "% of each transaction", label: t("passenger.wallet.percentOfEachTransaction") || "% of each transaction" }
    ], [t]);

    const handleNameChange = (value: string) => {
        setName(value);
        setIsCustomName(value === "chooseYourOwn");
        if (value !== "chooseYourOwn") {
            setCustomName("");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!walletId || !selectedCountry) {
            return;
        }

        try {
            setLoading(true);
            const finalName = isCustomName ? customName : nameOptions.find(opt => opt.value === name)?.label || name;
            
            await createWishlist(walletId, {
                title: finalName,
                country: selectedCountry,
                city: selectedCity || undefined,
                targetAmount: parseInt(target),
                rule: rules === "no rules set" ? "None" : rules === "% of each transaction" ? "Percent" : rules,
                rulePercent: rules === "% of each transaction" ? parseInt(percentage) : 0,
            });
            
            router.push("/passenger/wallet");
        } catch (error) {
            console.error("Failed to create wishlist:", error);
            alert(t("passenger.wallet.createError") || "Failed to create wishlist");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen pb-20">
            {/* Header с логотипом */}
            <header className="bg-background-dark px-4 pt-3 pb-3">
                <div className="flex items-center justify-between">
                    <Link href="/passenger" className="flex items-center gap-2 cursor-pointer">
                        <Image
                            src="/images/logo.png"
                            alt="IMS Savvy"
                            width={135}
                            height={30}
                            priority
                        />
                    </Link>
                    <button
                        onClick={() => router.back()}
                        className="text-white hover:text-gray-300 transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                </div>
            </header>

            {/* Фоновое изображение */}
            <div className="absolute inset-0 -z-10">
                <Image
                    src="/images/passengersbg.png"
                    alt="Background"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/45" />
            </div>

            <div className="relative px-4 pt-4 pb-6">
                <div className="max-w-[600px] mx-auto">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
                        <h1 className="text-2xl font-semibold text-white">{t("passenger.wallet.wishlist")}</h1>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name Field */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    {t("passenger.wallet.name")}
                                </label>
                                <div className="relative">
                                    <select
                                        value={name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        className="w-full bg-white rounded-xl border border-gray-300 px-4 py-3 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-action-primary focus:border-transparent"
                                        required
                                    >
                                        <option value="">{t("passenger.wallet.selectName")}</option>
                                        {nameOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Custom Name Field (appears if "Choose your own" is selected) */}
                            {isCustomName && (
                                <div className="space-y-4 pl-4 border-l-2 border-action-primary">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            {t("passenger.wallet.name")}
                                        </label>
                                        <input
                                            type="text"
                                            value={customName}
                                            onChange={(e) => setCustomName(e.target.value)}
                                            className="w-full bg-white rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-action-primary focus:border-transparent"
                                            placeholder={t("passenger.wallet.typeIn")}
                                            required={isCustomName}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Country Field */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    {t("passenger.wallet.country") || "Country"}
                                </label>
                                <SearchableSelect
                                    value={selectedCountry}
                                    options={countryOptions}
                                    onChange={setSelectedCountry}
                                    placeholder={t("passenger.wallet.selectCountry") || "Select country"}
                                    required
                                />
                            </div>

                            {/* City Field */}
                            {selectedCountry && (
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        {t("passenger.wallet.city") || "City"} <span className="text-xs text-gray-200">({t("passenger.wallet.optional") || "optional"})</span>
                                    </label>
                                    <SearchableSelect
                                        value={selectedCity}
                                        options={cityOptions}
                                        onChange={setSelectedCity}
                                        placeholder={loadingCities ? (t("passenger.wallet.loading") || "Loading...") : (t("passenger.wallet.selectCity") || "Select city")}
                                        disabled={loadingCities}
                                    />
                                </div>
                            )}

                            {/* Target Trip Field */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    {t("passenger.wallet.targetTrip")}
                                    <span className="ml-2 text-xs text-gray-200">
                                        ({t("passenger.wallet.setMilesAmountRequired")})
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={target}
                                    onChange={(e) => setTarget(e.target.value)}
                                    className="w-full bg-white rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-action-primary focus:border-transparent"
                                    placeholder={t("passenger.wallet.typeNumber")}
                                    required
                                />
                            </div>

                            {/* Set Rules Field */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    {t("passenger.wallet.setRules")}
                                    <span className="ml-2 text-xs text-gray-200">
                                        ({t("passenger.wallet.percentOfTransactions")})
                                    </span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={rules}
                                        onChange={(e) => setRules(e.target.value)}
                                        className="w-full bg-white rounded-xl border border-gray-300 px-4 py-3 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-action-primary focus:border-transparent"
                                        required
                                    >
                                        <option value="">{t("passenger.wallet.selectRule")}</option>
                                        {rulesOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Percentage Field (appears if "% of each transaction" is selected) */}
                            {rules === "% of each transaction" && (
                                <div className="space-y-4 pl-4 border-l-2 border-action-primary">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            {t("passenger.wallet.percentOfEachTransaction")}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={percentage}
                                                onChange={(e) => setPercentage(e.target.value)}
                                                className="flex-1 bg-white rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-action-primary focus:border-transparent"
                                                placeholder="10"
                                                required={rules === "% of each transaction"}
                                            />
                                            <span className="text-lg font-semibold text-gray-700">%</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-center mt-6">
                                <button
                                    type="submit"
                                    disabled={loading || !walletId}
                                    className="bg-brand-blue text-white rounded-xl px-8 py-3 font-semibold hover:bg-[#0056C0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (t("passenger.wallet.creating") || "Creating...") : t("passenger.wallet.create")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewWishlistPage;

