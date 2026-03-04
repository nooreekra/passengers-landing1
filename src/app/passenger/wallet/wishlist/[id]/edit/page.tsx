"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { getWallet, getWishlists, updateWishlist } from "@/shared/api/passenger";
import { getCountries, getCitiesByCountry } from "@/shared/api/locations";
import type { Location } from "@/entities/locations/types";
import SearchableSelect from "@/shared/ui/SearchableSelect";
import Loader from "@/shared/ui/Loader";

const EditWishlistPage = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const wishlistId = params?.id as string | undefined;
    
    if (!wishlistId) {
        router.push("/passenger/wallet");
        return null;
    }
    
    const [walletId, setWalletId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [countries, setCountries] = useState<Location[]>([]);
    const [cities, setCities] = useState<Location[]>([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [target, setTarget] = useState("");
    const [rules, setRules] = useState("");
    const [percentage, setPercentage] = useState("");
    const [pendingCityId, setPendingCityId] = useState<string | null>(null);

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
        const loadData = async () => {
            try {
                const wallet = await getWallet();
                setWalletId(wallet.id);
                
                const wishlists = await getWishlists(wallet.id);
                const wishlist = wishlists.find(w => w.id === wishlistId);
                
                if (!wishlist) {
                    router.push("/passenger/wallet");
                    return;
                }
                
                setName(wishlist.title);
                setTarget(wishlist.targetAmount.toString());
                
                // Устанавливаем страну и город
                if (wishlist.country) {
                    setSelectedCountry(wishlist.country);
                    // Если есть город, сохраняем его id для установки после загрузки городов
                    if (wishlist.city) {
                        setPendingCityId(wishlist.city);
                    }
                }
                
                // Устанавливаем правила
                if (wishlist.rule === "None" || !wishlist.rule) {
                    setRules("no rules set");
                    setPercentage("");
                } else if (wishlist.rulePercent > 0) {
                    setRules("% of each transaction");
                    setPercentage(wishlist.rulePercent.toString());
                } else {
                    setRules("no rules set");
                    setPercentage("");
                }
            } catch (error) {
                console.error("Failed to load wishlist:", error);
                router.push("/passenger/wallet");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [wishlistId, router]);

    useEffect(() => {
        const loadCities = async () => {
            if (!selectedCountry) {
                setCities([]);
                setSelectedCity("");
                setPendingCityId(null);
                return;
            }

            try {
                setLoadingCities(true);
                const citiesData = await getCitiesByCountry(selectedCountry);
                setCities(citiesData);
                
                // Если есть ожидающий город, устанавливаем его после загрузки
                if (pendingCityId) {
                    const city = citiesData.find(c => c.id === pendingCityId);
                    if (city) {
                        setSelectedCity(pendingCityId);
                        setPendingCityId(null);
                    }
                }
            } catch (error) {
                console.error("Failed to load cities:", error);
                setCities([]);
            } finally {
                setLoadingCities(false);
            }
        };
        loadCities();
    }, [selectedCountry, pendingCityId]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!walletId || !selectedCountry) {
            return;
        }

        try {
            setSaving(true);
            
            await updateWishlist(walletId, wishlistId, {
                title: name,
                country: selectedCountry,
                city: selectedCity || undefined,
                targetAmount: parseInt(target),
                rule: rules === "no rules set" ? "None" : rules === "% of each transaction" ? "Percent" : rules,
                rulePercent: rules === "% of each transaction" ? parseInt(percentage) : 0,
            });
            
            router.push(`/passenger/wallet/wishlist/${wishlistId}`);
        } catch (error) {
            console.error("Failed to update wishlist:", error);
            alert(t("passenger.wallet.updateError") || "Failed to update wishlist");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="relative min-h-screen pb-20">
                <div className="flex items-center justify-center min-h-screen">
                    <Loader text={t("passenger.wallet.loading") || "Loading..."} textColor="text-white" color="#ffffff" />
                </div>
            </div>
        );
    }

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
                        <h1 className="text-2xl font-semibold text-white">{t("passenger.wallet.editWishlist") || "Edit Wishlist"}</h1>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name Field */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    {t("passenger.wallet.name")}
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-white rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-action-primary focus:border-transparent"
                                    placeholder={t("passenger.wallet.typeIn")}
                                    required
                                />
                            </div>

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
                                        <option value="no rules set">{t("passenger.wallet.noRulesSet") || "no rules set"}</option>
                                        <option value="% of each transaction">{t("passenger.wallet.percentOfEachTransaction") || "% of each transaction"}</option>
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
                                    disabled={saving || !walletId}
                                    className="bg-brand-blue text-white rounded-xl px-8 py-3 font-semibold hover:bg-[#0056C0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? (t("passenger.wallet.saving") || "Saving...") : (t("passenger.wallet.save") || "Save")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditWishlistPage;

