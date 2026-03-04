"use client";

import React, { useEffect, useState } from "react";
import { getCurrentBusiness } from "@/shared/api/business";
import type { UUID } from "@/entities/branchTypes/types";
import type { BranchType } from "@/entities/branchTypes/types";
import { getBranchTypes, deleteBranchType } from "@/shared/api/branchTypes";
import BranchTypeUpsertModal from "@/shared/ui/BranchTypeUpsertModal";
import ConfirmModal from "@/shared/ui/ConfirmModal";
import Button from "@/shared/ui/Button";
import { useTranslation } from "react-i18next";
import {usePermission} from "@/shared/lib/usePermission";
import { EditIcon, TrashIcon } from "@/shared/icons";

const BranchTypesPage = () => {
    const canWriteBranches = usePermission("branch:write");
    const { t } = useTranslation();
    const [businessId, setBusinessId] = useState<UUID | null>(null);
    const [items, setItems] = useState<BranchType[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [upsertOpen, setUpsertOpen] = useState(false);
    const [editing, setEditing] = useState<BranchType | undefined>();

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState<BranchType | undefined>();
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const b = await getCurrentBusiness();
                setBusinessId(b.id as UUID);
            } catch (e: any) {
                setErr(e?.response?.data?.message || e?.message || t("branchTypes.error.loadBusiness"));
            }
        })();
    }, [t]);

    const load = async (bid: UUID) => {
        setLoading(true);
        setErr(null);
        try {
            const data = await getBranchTypes(bid);
            setItems(data);
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || t("branchTypes.error.loadList"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (businessId) load(businessId);
    }, [businessId]);

    const openCreate = () => { setEditing(undefined); setUpsertOpen(true); };
    const openEdit = (t: BranchType) => { setEditing(t); setUpsertOpen(true); };

    const handleSaved = async () => { if (businessId) await load(businessId); };

    const askDelete = (t: BranchType) => { setDeleting(t); setConfirmOpen(true); };
    const doDelete = async () => {
        if (!businessId || !deleting) return;
        setDeleteLoading(true);
        try {
            await deleteBranchType(businessId, deleting.id);
            await load(businessId);
            setConfirmOpen(false);
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{t("branchTypes.title")}</h2>
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
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                        <tr className="text-left text-gray-500 border-b">
                            <th className="py-2 pr-3">{t("branchTypes.col.name")}</th>
                            <th className="py-2 pr-3 w-40 text-right">{t("common.actions")}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {items.length === 0 && (
                            <tr>
                                <td className="py-6 text-center text-gray-500" colSpan={2}>
                                    {t("branchTypes.empty")}
                                </td>
                            </tr>
                        )}
                        {items.map((item) => (
                            <tr key={item.id} className="border-b last:border-b-0">
                                <td className="py-2 pr-3 font-medium">{item.name}</td>
                                {
                                    canWriteBranches && (
                                        <td className="py-2 pr-3">
                                            <div className="flex items-center gap-2 justify-end">
                                                <button 
                                                    onClick={() => openEdit(item)}
                                                    className="p-1 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                                                    title={t("common.edit")}
                                                >
                                                    <div className="w-4 h-4 flex items-center justify-center">
                                                        <EditIcon stroke="currentColor" />
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => askDelete(item)}
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
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {businessId && (
                <BranchTypeUpsertModal
                    open={upsertOpen}
                    onClose={() => setUpsertOpen(false)}
                    businessId={businessId as UUID}
                    initial={editing}
                    onSuccess={handleSaved}
                />
            )}

            <ConfirmModal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={doDelete}
                loading={deleteLoading}
                title={t("branchTypes.delete.title")}
                text={
                    deleting
                        ? t("branchTypes.delete.text", { name: deleting.name })
                        : t("branchTypes.delete.textShort")
                }
                confirmText={t("common.delete")}
            />
        </div>
    );
};

export default BranchTypesPage;
