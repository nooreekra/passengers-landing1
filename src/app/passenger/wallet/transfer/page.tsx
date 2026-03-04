"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ArrowRightLeft } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { getWallet, getWishlists, reserveFunds, releaseFunds, transferFunds } from "@/shared/api/passenger";

const TransferPage = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const [walletId, setWalletId] = useState<string | null>(null);
    const [wishlists, setWishlists] = useState<Array<{ id: string; title: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [transferring, setTransferring] = useState(false);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [amount, setAmount] = useState("");

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const wallet = await getWallet();
                setWalletId(wallet.id);
                
                const wishlistsData = await getWishlists(wallet.id);
                setWishlists(wishlistsData.map(w => ({ id: w.id, title: w.title })));
            } catch (error) {
                console.error("Failed to load wallet data:", error);
                router.push("/passenger/wallet");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [router]);

    const handleFromChange = (value: string) => {
        setFrom(value);
        // Если выбранное значение совпадает с "to", сбрасываем "to"
        if (value === to) {
            setTo("");
        }
    };

    const handleToChange = (value: string) => {
        setTo(value);
        // Если выбранное значение совпадает с "from", сбрасываем "from"
        if (value === from) {
            setFrom("");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!walletId || !amount || !from || !to) {
            return;
        }

        try {
            setTransferring(true);
            const amountNum = parseInt(amount);

            if (from === "available" && to.startsWith("wishlist_")) {
                // Перевод из available в wishlist (reserve)
                const wishlistId = to.replace("wishlist_", "");
                await reserveFunds(walletId, wishlistId, { amount: amountNum });
            } else if (from.startsWith("wishlist_") && to === "available") {
                // Перевод из wishlist в available (release)
                const wishlistId = from.replace("wishlist_", "");
                await releaseFunds(walletId, wishlistId, { amount: amountNum });
            } else if (from.startsWith("wishlist_") && to.startsWith("wishlist_")) {
                // Перевод между wishlists
                const fromWishlistId = from.replace("wishlist_", "");
                const toWishlistId = to.replace("wishlist_", "");
                await transferFunds(walletId, fromWishlistId, { toWishlistId, amount: amountNum });
            }
            
            router.push("/passenger/wallet");
        } catch (error) {
            console.error("Failed to transfer:", error);
            alert(t("passenger.wallet.transferError") || "Failed to transfer miles");
        } finally {
            setTransferring(false);
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
                        <h1 className="text-2xl font-semibold text-white">{t("passenger.wallet.transferMiles")}</h1>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* From Field */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    {t("passenger.wallet.from")}
                                </label>
                                <div className="relative">
                                    <select
                                        value={from}
                                        onChange={(e) => handleFromChange(e.target.value)}
                                        className="w-full bg-white rounded-xl border border-gray-300 px-4 py-3 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-action-primary focus:border-transparent"
                                        required
                                        disabled={loading}
                                    >
                                        <option value="">{t("passenger.wallet.selectSource")}</option>
                                        {to !== "available" && (
                                            <option value="available">{t("passenger.wallet.availableToRedeem")}</option>
                                        )}
                                        {wishlists.map((wishlist) => {
                                            const wishlistValue = `wishlist_${wishlist.id}`;
                                            if (to !== wishlistValue) {
                                                return (
                                                    <option key={wishlist.id} value={wishlistValue}>
                                                        {wishlist.title}
                                                    </option>
                                                );
                                            }
                                            return null;
                                        })}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* To Field */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    {t("passenger.wallet.to")}
                                </label>
                                <div className="relative">
                                    <select
                                        value={to}
                                        onChange={(e) => handleToChange(e.target.value)}
                                        className="w-full bg-white rounded-xl border border-gray-300 px-4 py-3 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-action-primary focus:border-transparent"
                                        required
                                        disabled={loading}
                                    >
                                        <option value="">{t("passenger.wallet.selectDestination")}</option>
                                        {from !== "available" && (
                                            <option value="available">{t("passenger.wallet.availableToRedeem")}</option>
                                        )}
                                        {wishlists.map((wishlist) => {
                                            const wishlistValue = `wishlist_${wishlist.id}`;
                                            if (from !== wishlistValue) {
                                                return (
                                                    <option key={wishlist.id} value={wishlistValue}>
                                                        {wishlist.title}
                                                    </option>
                                                );
                                            }
                                            return null;
                                        })}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Amount Field */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    {t("passenger.wallet.amount")}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-white rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-action-primary focus:border-transparent"
                                    placeholder={t("passenger.wallet.enterAmount")}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-center mt-6">
                                <button
                                    type="submit"
                                    disabled={loading || transferring || !walletId}
                                    className="bg-brand-blue text-white rounded-xl px-8 py-3 font-semibold hover:bg-[#0056C0] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ArrowRightLeft className="h-5 w-5" />
                                    {transferring ? (t("passenger.wallet.transferring") || "Transferring...") : t("passenger.wallet.transfer")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransferPage;

