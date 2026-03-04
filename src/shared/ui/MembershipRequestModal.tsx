"use client";

import React, { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import clsx from "clsx";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

import { createMyMembershipRequest } from "@/shared/api/membership";
import { getCountries, getCitiesByCountry, getAgencies, getCitiesByBusiness } from "@/shared/api/locations";
import { getBranches, getBranchesByCity } from "@/shared/api/branches";
import { getRoles } from "@/shared/api/roles";
import { getStructures } from "@/shared/api/structures";

type Props = { open: boolean; onClose: () => void; onSuccess?: () => void };
type Option = { id: string; name: string };

export default function MembershipRequestModal({ open, onClose, onSuccess }: Props) {
    const { t } = useTranslation();
    
    const [countryId, setCountryId] = useState("");
    const [cityId, setCityId] = useState("");
    const [businessId, setBusinessId] = useState("");
    const [branchId, setBranchId] = useState("");
    const [roleId, setRoleId] = useState("");
    const [structureId, setStructureId] = useState("");
    const [comment, setComment] = useState("");

    const [countries, setCountries] = useState<Option[]>([]);
    const [cities, setCities] = useState<Option[]>([]);
    const [agencies, setAgencies] = useState<Option[]>([]);
    const [branches, setBranches] = useState<Option[]>([]);
    const [roles, setRoles] = useState<Option[]>([]);
    const [structures, setStructures] = useState<Option[]>([]);

    const [loading, setLoading] = useState(false);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingAgencies, setLoadingAgencies] = useState(false);
    const [loadingBizDeps, setLoadingBizDeps] = useState(false);

    // === СТИЛИ КАК В RegisterAgentModal ===
    const baseInput =
        "placeholder-label-additional text-label-primary w-full h-10 px-3 py-2 border rounded-lg focus:outline-none text-sm";
    const baseSelect =
        "w-full h-10 px-3 py-2 border rounded-lg focus:outline-none text-sm bg-white";

    useEffect(() => {
        if (!open) return;
        (async () => {
            try {
                setLoadingCountries(true);
                const cs = await getCountries();
                setCountries(cs);
            } catch {
                setCountries([]);
                toast.error(t("common.failedToLoadCountries"));
            } finally {
                setLoadingCountries(false);
            }
        })();
    }, [open]);

    useEffect(() => {
        if (!countryId) {
            setAgencies([]);
            setBusinessId("");
            return;
        }

        (async () => {
            try {
                setLoadingAgencies(true);
                const list = await getAgencies([countryId], []);
                const normalized: Option[] = (list || []).map((x: any) => ({
                    id: x.id,
                    name: x.value ?? x.name ?? "",
                }));
                setAgencies(normalized);
            } catch {
                setAgencies([]);
            } finally {
                setLoadingAgencies(false);
            }
        })();

        setBusinessId("");
        setBranches([]);
        setRoles([]);
        setStructures([]);
        setBranchId("");
        setRoleId("");
        setStructureId("");
    }, [countryId]);

    useEffect(() => {
        if (!businessId) {
            setCities([]);
            setCityId("");
            return;
        }

        (async () => {
            try {
                setLoadingCities(true);
                const ct = await getCitiesByBusiness(businessId);
                const normalized: Option[] = (ct || []).map((x: any) => ({
                    id: x.id,
                    name: x.name ?? "",
                }));
                setCities(normalized);
            } catch {
                setCities([]);
                toast.error(t("common.loadFail") || "Не удалось загрузить города");
            } finally {
                setLoadingCities(false);
            }
        })();
    }, [businessId, t]);

    useEffect(() => {
        if (!businessId) {
            setRoles([]);
            setStructures([]);
            setRoleId("");
            setStructureId("");
            return;
        }
        (async () => {
            try {
                setLoadingBizDeps(true);
                const [rl, st] = await Promise.all([
                    getRoles(businessId),
                    getStructures(businessId),
                ]);
                setRoles((rl || []).map((x: any) => ({ id: x.id, name: x.name ?? x.value ?? "" })));
                setStructures((st || []).map((x: any) => ({ id: x.id, name: x.name ?? x.value ?? "" })));
            } catch {
                setRoles([]);
                setStructures([]);
                toast.error(t("common.failedToLoadBusinessData"));
            } finally {
                setLoadingBizDeps(false);
            }
        })();
    }, [businessId]);

    useEffect(() => {
        if (!businessId || !cityId) {
            setBranches([]);
            setBranchId("");
            return;
        }

        (async () => {
            try {
                setLoadingBizDeps(true);
                const br = await getBranchesByCity(businessId, cityId);
                setBranches((br || []).map((x: any) => ({ id: x.id, name: x.name ?? x.value ?? "" })));
            } catch {
                setBranches([]);
                toast.error(t("common.loadFail") || "Не удалось загрузить филиалы");
            } finally {
                setLoadingBizDeps(false);
            }
        })();
    }, [businessId, cityId, t]);

    const submit = async () => {
        if (!businessId) {
            toast.error(t("common.selectAgencyFirst"));
            return;
        }
        setLoading(true);
        try {
            await createMyMembershipRequest({
                businessId,
                branchId: branchId || undefined,
                roleId: roleId || undefined,
                structureId: structureId || undefined,
                comment: comment.trim() || undefined,
            });
            toast.success(t("common.requestSent"));
            onClose();
            onSuccess?.();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || t("common.failedToSendRequest"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={() => !loading && onClose()} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow">
                    <Dialog.Title className="text-lg font-semibold mb-4">{t("common.sendRequestToAgency")}</Dialog.Title>

                    <div className="space-y-2.5">
                        <select
                            value={countryId}
                            onChange={(e) => setCountryId(e.target.value)}
                            className={clsx(baseSelect, loadingCountries ? "opacity-70" : "border-border-default")}
                            disabled={loadingCountries}
                        >
                            <option value="">{t("common.selectCountry")}</option>
                            {countries.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={businessId}
                            onChange={(e) => setBusinessId(e.target.value)}
                            className={clsx(baseSelect, loadingAgencies ? "opacity-70" : "border-border-default")}
                            disabled={!countryId || loadingAgencies}
                        >
                            <option value="">{t("common.selectAgency")}</option>
                            {agencies.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={cityId}
                            onChange={(e) => setCityId(e.target.value)}
                            className={clsx(baseSelect, loadingCities ? "opacity-70" : "border-border-default")}
                            disabled={!businessId || loadingCities}
                        >
                            <option value="">{t("common.selectCity")}</option>
                            {cities.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={structureId}
                            onChange={(e) => setStructureId(e.target.value)}
                            className={clsx(baseSelect, loadingBizDeps ? "opacity-70" : "border-border-default")}
                            disabled={!businessId || loadingBizDeps}
                        >
                            <option value="">{t("common.selectStructure")}</option>
                            {structures.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                            className={clsx(baseSelect, loadingBizDeps ? "opacity-70" : "border-border-default")}
                            disabled={!businessId || !cityId || loadingBizDeps}
                        >
                            <option value="">{t("common.selectBranch")}</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={roleId}
                            onChange={(e) => setRoleId(e.target.value)}
                            className={clsx(baseSelect, loadingBizDeps ? "opacity-70" : "border-border-default")}
                            disabled={!businessId || loadingBizDeps}
                        >
                            <option value="">{t("common.selectJobTitle")}</option>
                            {roles.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.name}
                                </option>
                            ))}
                        </select>

                        <textarea
                            rows={3}
                            className={clsx(baseInput, "border-border-default h-auto")}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={t("common.messageForAgency")}
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <button
                            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
                            onClick={onClose}
                            disabled={loading}
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            className="px-4 py-2 rounded-lg bg-label-blue text-white disabled:opacity-50"
                            onClick={submit}
                            disabled={loading}
                        >
                            {loading ? t("common.sending") : t("common.send")}
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
