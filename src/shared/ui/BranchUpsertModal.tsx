"use client";

import React, { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import type { UUID } from "@/entities/branches/types";
import type { Branch } from "@/entities/branches/types";
import type { BranchType } from "@/entities/branchTypes/types";
import { createBranch, updateBranch } from "@/shared/api/branches";
import { UpsertBranchPayload } from "@/entities/branches/types";
import { getCountries, getCountriesByBusiness, getCitiesByCountry } from "@/shared/api/locations";
import Button from "@/shared/ui/Button";
import { useTranslation } from "react-i18next";
import i18n from "@/shared/i18n";
import { Input } from "@/shared/ui/Input";
import { InfoTooltip } from "@/shared/ui";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

type Props = {
    open: boolean;
    businessId: UUID;
    initial?: Partial<Branch>;
    branchTypes: BranchType[];
    onClose: () => void;
    onSuccess: (saved: Branch) => void;
};

export default function BranchUpsertModal({
                                              open,
                                              businessId,
                                              initial,
                                              branchTypes,
                                              onClose,
                                              onSuccess,
                                          }: Props) {
    const { t } = useTranslation();

    const businessType = useSelector((s: RootState) => s.business.current?.type);
    const isAirline = businessType === "Airline";
    const isTravelAgency = businessType === "TravelAgency";

    const [form, setForm] = useState<UpsertBranchPayload>({
        name: "",
        typeId: "" as UUID,
        countryId: "" as UUID,
        cityId: "" as UUID,
        location: "",
        pseudoCityCode: [],
    });

    const [countries, setCountries] = useState<{ id: string; name: string }[]>([]);
    const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pccText, setPccText] = useState("");

    const parsePcc = (txt: string) =>
        Array.from(
            new Set(
                txt
                    .split(/\r?\n/)
                    .map((s) => s.trim())
                    .filter(Boolean)
            )
        );

    useEffect(() => {
        if (!open) return;
        (async () => {
            const list = isAirline 
                ? await getCountries() 
                : await getCountriesByBusiness(businessId);
            setCountries(list);

            const visibleBranchTypes = branchTypes.filter(t => t.visible);
            const next: UpsertBranchPayload = {
                name: initial?.name || "",
                typeId: (initial?.typeId as UUID) || (visibleBranchTypes[0]?.id as UUID) || ("" as UUID),
                countryId: (initial?.countryId as UUID) || (list[0]?.id as UUID) || ("" as UUID),
                cityId: "" as UUID,
                location: (initial as any)?.location || "",
                pseudoCityCode: (initial as any)?.pseudoCityCode ?? [],
            };
            setForm(next);
            setPccText((next.pseudoCityCode ?? []).join("\n"));
        })().catch(() => setCountries([]));
        setError(null);
    }, [open, initial, branchTypes, i18n.language]);

    useEffect(() => {
        if (!form.countryId) {
            setCities([]);
            return;
        }
        setLoadingCities(true);
        getCitiesByCountry(form.countryId)
            .then((arr) => {
                setCities(arr);
                setForm((f) => ({
                    ...f,
                    cityId:
                        (initial?.cityId as UUID) && arr.find((c) => c.id === initial?.cityId)
                            ? (initial?.cityId as UUID)
                            : (arr[0]?.id as UUID) || ("" as UUID),
                }));
            })
            .finally(() => setLoadingCities(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.countryId, i18n.language]);

    const submit = async () => {
        if ((!isAirline && !form.name.trim()) || !form.typeId || !form.countryId || !form.cityId) {
            setError(t("branches.modal.fillAll"));
            return;
        }
        if (isTravelAgency && !form.location?.trim()) {
            setError(t("branches.modal.locationRequired", { defaultValue: "Address is required" }));
            return;
        }

        const base: Partial<UpsertBranchPayload> = {
            typeId: form.typeId || undefined,
            countryId: form.countryId || undefined,
            cityId: form.cityId || undefined,
        };

        if (!isAirline && form.name.trim()) {
            base.name = form.name.trim();
        }
        if (isTravelAgency && form.location?.trim()) {
            base.location = form.location.trim();
        }
        if (isTravelAgency) {
            const pcc = parsePcc(pccText);
            if (pcc.length) base.pseudoCityCode = pcc;
        }

        const cleaned = Object.fromEntries(
            Object.entries(base).filter(([_, v]) => {
                if (v == null) return false;
                if (typeof v === "string" && v.trim() === "") return false;
                return !(Array.isArray(v) && v.length === 0);
            })
        ) as Partial<UpsertBranchPayload>;

        setSaving(true);
        try {
            const saved = initial?.id
                ? await updateBranch(businessId, initial.id as UUID, cleaned as UpsertBranchPayload)
                : await createBranch(businessId, cleaned as UpsertBranchPayload);
            onSuccess(saved);
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || t("branches.modal.saveError"));
        } finally {
            setSaving(false);
        }
    };


    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => !saving && onClose()}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-150"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-150"
                            enterFrom="opacity-0 translate-y-2"
                            enterTo="opacity-100 translate-y-0"
                            leave="ease-in duration-100"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 translate-y-2"
                        >
                            <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow">
                                <Dialog.Title className="text-lg font-semibold mb-4">
                                    {initial?.id ? t("branches.modal.editTitle") : t("branches.modal.addTitle")}
                                </Dialog.Title>

                                <div className="space-y-4">
                                    {!isTravelAgency && (
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">{t("branches.fields.type")}</label>
                                            <select
                                                className="bg-white w-full h-14 rounded-xl border border-border-default px-4 outline-none"
                                                value={form.typeId}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        typeId: e.target.value as UUID,
                                                    }))
                                                }
                                            >
                                                {branchTypes.filter(t => t.visible).map((t) => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">{t("branches.fields.country")}</label>
                                            <select
                                                className="bg-white w-full h-14 rounded-xl border border-border-default px-4 outline-none"
                                                value={form.countryId}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        countryId: e.target.value as UUID,
                                                        cityId: "" as UUID,
                                                    }))
                                                }
                                            >
                                                {countries.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">{t("branches.fields.city")}</label>
                                            <select
                                                className="bg-white w-full h-14 rounded-xl border border-border-default px-4 outline-none"
                                                value={form.cityId}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        cityId: e.target.value as UUID,
                                                    }))
                                                }
                                                disabled={loadingCities || !form.countryId}
                                            >
                                                {cities.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {loadingCities && <div className="mt-1 text-xs text-gray-500">{t("branches.citiesLoading")}</div>}
                                        </div>
                                    </div>

                                    {isTravelAgency && (
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">{t("branches.fields.location", { defaultValue: "Address" })}</label>
                                            <Input
                                                className="w-full rounded-xl border px-3 py-2"
                                                value={form.location || ""}
                                                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                                                placeholder={t("branches.fields.locationPh", { defaultValue: "Street, building, office…" })}
                                            />
                                        </div>
                                    )}

                                    {!isAirline && (
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1 flex items-center gap-2">
                                                {t("branches.fields.officeNickname")}
                                                <InfoTooltip 
                                                    text={t("branches.fields.locationTooltip")}
                                                    position="right"
                                                />
                                            </label>
                                            <Input
                                                className="w-full rounded-xl border px-3 py-2"
                                                value={form.name}
                                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                                placeholder={t("branches.fields.namePh")}
                                            />
                                        </div>
                                    )}

                                    {isTravelAgency && (
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">{t("branches.fields.pseudoCityCode")}</label>
                                            <textarea
                                                rows={4}
                                                className="bg-white w-full rounded-xl border border-border-default px-3 py-2 outline-none"
                                                value={pccText}
                                                onChange={(e) => setPccText(e.target.value)}
                                                placeholder={t("branches.fields.pseudoCityCodePh", { defaultValue: "ABC1\nXYZ2" })}
                                            />
                                            <div className="mt-1 text-xs text-gray-500">{t("branches.fields.pseudoCityCodeHint")}</div>
                                        </div>
                                    )}

                                    {error && <div className="text-sm text-red-600">{error}</div>}
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-2">
                                    <Button onClick={onClose} disabled={saving} className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50">
                                        <p className="text-black">{t("common.cancel")}</p>
                                    </Button>
                                    <Button
                                        onClick={submit}
                                        disabled={saving}
                                        className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-50"
                                    >
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
