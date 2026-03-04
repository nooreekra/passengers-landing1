"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getCurrentBusiness } from "@/shared/api/business";
import type { UUID } from "@/entities/branches/types";
import type { Branch } from "@/entities/branches/types";
import type { BranchType } from "@/entities/branchTypes/types";
import { getBranches, deleteBranch } from "@/shared/api/branches";
import { getBranchTypes } from "@/shared/api/branchTypes";
import { getCountries, getCitiesByCountry } from "@/shared/api/locations";
import BranchUpsertModal from "@/shared/ui/BranchUpsertModal";
import ConfirmModal from "@/shared/ui/ConfirmModal";
import Button from "@/shared/ui/Button";
import { useTranslation } from "react-i18next";
import i18n from "@/shared/i18n";
import {usePermission} from "@/shared/lib/usePermission";
import { EditIcon, TrashIcon } from "@/shared/icons";

const BranchesPage = () => {
    const canWriteBranches = usePermission("branch:write");
    const { t } = useTranslation();
    const [businessId, setBusinessId] = useState<UUID | null>(null);
    const [items, setItems] = useState<Branch[]>([]);
    const [types, setTypes] = useState<BranchType[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [countryMap, setCountryMap] = useState<Map<string, string>>(new Map());
    const [cityMap, setCityMap] = useState<Map<string, string>>(new Map());

    const [upsertOpen, setUpsertOpen] = useState(false);
    const [editing, setEditing] = useState<Branch | undefined>();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState<Branch | undefined>();
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const b = await getCurrentBusiness();
                setBusinessId(b.id as UUID);
            } catch (e: any) {
                setErr(e?.response?.data?.message || e?.message || t("branches.error.loadBusiness"));
            }
        })();
    }, [t]);

    const load = async (bid: UUID) => {
        setLoading(true);
        setErr(null);
        try {
            const [list, tps, countries] = await Promise.all([
                getBranches(bid),
                getBranchTypes(bid),
                getCountries(),
            ]);

            setItems(list);
            setTypes(tps);
            setCountryMap(new Map(countries.map((c: any) => [c.id, c.name])));

            const uniqCountryIds = Array.from(
                new Set(list.map((b) => b.countryId).filter(Boolean) as string[])
            );
            const citiesChunks = await Promise.all(uniqCountryIds.map((cid) => getCitiesByCountry(cid)));
            const cityPairs: [string, string][] = [];
            citiesChunks.forEach((arr) => arr.forEach((c: any) => cityPairs.push([c.id, c.name])));
            setCityMap(new Map(cityPairs));
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || t("branches.error.loadList"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (businessId) load(businessId);
    }, [businessId]);

    // Перезагружаем данные при смене языка
    useEffect(() => {
        if (businessId) load(businessId);
    }, [i18n.language]);

    const typesMap = useMemo(() => new Map(types.map((t) => [t.id, t.name])), [types]);
    const typesVisibilityMap = useMemo(() => new Map(types.map((t) => [t.id, t.visible])), [types]);

    const openCreate = () => { setEditing(undefined); setUpsertOpen(true); };
    const openEdit = (b: Branch) => { setEditing(b); setUpsertOpen(true); };
    const handleSaved = async () => { if (businessId) await load(businessId); };

    const askDelete = (b: Branch) => { setDeleting(b); setConfirmOpen(true); };
    const doDelete = async () => {
        if (!businessId || !deleting) return;
        setDeleteLoading(true);
        try {
            await deleteBranch(businessId as UUID, deleting.id);
            await load(businessId as UUID);
            setConfirmOpen(false);
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{t("branches.title")}</h2>
                {
                    canWriteBranches && (
                        <Button onClick={openCreate} className="px-4 py-2 rounded-xl bg-black text-white">
                            {t("common.add")}
                        </Button>
                    )
                }
            </div>

            {err && <div className="p-3 mb-4 rounded-md bg-red-50 text-red-700 text-sm">{err}</div>}

            {loading ? (
                <div className="animate-pulse h-40 rounded-xl bg-gray-100" />
            ) : (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                        <tr className="text-left text-gray-500 border-b">
                            <th className="py-2 pr-3 whitespace-nowrap">{t("branches.col.type")}</th>
                            <th className="py-2 pr-3 whitespace-nowrap">{t("branches.col.country")}</th>
                            <th className="py-2 pr-3 whitespace-nowrap">{t("branches.col.city")}</th>
                            {
                                canWriteBranches && (
                                    <th className="py-2 pr-3 w-40 text-right">{t("common.actions")}</th>

                                )
                            }
                        </tr>
                        </thead>
                        <tbody>
                        {items.length === 0 && (
                            <tr>
                                <td className="py-6 text-center text-gray-500" colSpan={4}>
                                    {t("branches.empty")}
                                </td>
                            </tr>
                        )}
                        {items.map((b) => {
                            const isTypeVisible = b.typeId ? typesVisibilityMap.get(b.typeId) : true;
                            return (
                                <tr key={b.id} className="border-b last:border-b-0">
                                    <td className="py-2 pr-3 whitespace-nowrap">{b.typeId ? (typesMap.get(b.typeId) || b.typeId) : "—"}</td>
                                    <td className="py-2 pr-3 whitespace-nowrap">{b.countryId ? countryMap.get(b.countryId) || b.countryId : "—"}</td>
                                    <td className="py-2 pr-3 whitespace-nowrap">{b.cityId ? cityMap.get(b.cityId) || b.cityId : "—"}</td>
                                    {
                                        canWriteBranches && isTypeVisible && (
                                            <td className="py-2 pr-3">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <button 
                                                        onClick={() => openEdit(b)}
                                                        className="p-1 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                                                        title={t("common.edit")}
                                                    >
                                                        <div className="w-4 h-4 flex items-center justify-center">
                                                            <EditIcon stroke="currentColor" />
                                                        </div>
                                                    </button>
                                                    <button
                                                        onClick={() => askDelete(b)}
                                                        className="p-1 rounded-lg text-red-600 hover:bg-red-50 flex items-center justify-center"
                                                        title={t("common.delete")}
                                                    >
                                                        <div className="w-4 h-4 flex items-center justify-center">
                                                            <TrashIcon stroke="currentColor" />
                                                        </div>
                                                    </button>
                                                </div>
                                            </td>
                                        )
                                    }
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}

            {businessId && (
                <BranchUpsertModal
                    open={upsertOpen}
                    onClose={() => setUpsertOpen(false)}
                    businessId={businessId as UUID}
                    initial={editing}
                    branchTypes={types}
                    onSuccess={handleSaved}
                />
            )}

            <ConfirmModal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={doDelete}
                loading={deleteLoading}
                title={t("branches.delete.title")}
                text={
                    deleting
                        ? t("branches.delete.text", { name: deleting.name })
                        : t("branches.delete.textShort")
                }
                confirmText={t("common.delete")}
            />
        </div>
    );
};

export default BranchesPage;
