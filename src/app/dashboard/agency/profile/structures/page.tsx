"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getCurrentBusiness } from "@/shared/api/business";
import { UUID, Structure } from "@/entities/structures/types";
import { getStructures, deleteStructure } from "@/shared/api/structures";
import StructureUpsertModal from "@/shared/ui/StructureUpsertModal";
import ConfirmModal from "@/shared/ui/ConfirmModal";
import Button from "@/shared/ui/Button";
import { useTranslation } from "react-i18next";
import {usePermission} from "@/shared/lib/usePermission";
import { EditIcon, TrashIcon } from "@/shared/icons";
import { isDepartmentType } from "@/shared/constants/structureTypes";

const StructuresPage = () => {
    const canWriteStructures = usePermission("branch:write");
    const { t } = useTranslation();
    const [businessId, setBusinessId] = useState<UUID | null>(null);
    const [items, setItems] = useState<Structure[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [upsertOpen, setUpsertOpen] = useState(false);
    const [editing, setEditing] = useState<Structure | undefined>();

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState<Structure | undefined>();
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const b = await getCurrentBusiness();
                setBusinessId(b.id as UUID);
            } catch (e: any) {
                setErr(e?.response?.data?.message || e?.message || t("structures.error.loadBusiness"));
            }
        })();
    }, [t]);

    const load = async (bid: UUID) => {
        setLoading(true);
        setErr(null);
        try {
            const data = await getStructures(bid);
            setItems(data);
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || t("structures.error.loadList"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (businessId) load(businessId);
    }, [businessId]);

    const mapById = useMemo(() => {
        return new Map<UUID, Structure>(items.map((i) => [i.id as UUID, i]));
    }, [items]);

    const openCreate = () => {
        setEditing(undefined);
        setUpsertOpen(true);
    };
    const openEdit = (s: Structure) => {
        setEditing(s);
        setUpsertOpen(true);
    };

    const handleSaved = async () => {
        if (businessId) await load(businessId);
    };

    const askDelete = (s: Structure) => {
        setDeleting(s);
        setConfirmOpen(true);
    };
    const doDelete = async () => {
        if (!businessId || !deleting) return;
        setDeleteLoading(true);
        try {
            await deleteStructure(businessId, deleting.id);
            await load(businessId);
            setConfirmOpen(false);
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{t("structures.title")}</h2>
                {
                    canWriteStructures && (
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
                            <th className="py-2 pr-3">{t("structures.col.department")}</th>
                            {/* <th className="py-2 pr-3">{t("structures.col.team")}</th> */}
                            {
                                canWriteStructures && (
                                    <th className="py-2 pr-3 w-40 text-right">{t("structures.col.actions")}</th>
                                )
                            }
                        </tr>
                        </thead>
                        <tbody>
                        {items.length === 0 && (
                            <tr>
                                <td className="py-6 text-center text-gray-500" colSpan={4}>
                                    {t("structures.empty")}
                                </td>
                            </tr>
                        )}
                        {(() => {
                            // Get top-level structures that are departments
                            const topLevelStructures = items.filter(s => 
                                !s.parentId && 
                                s.type && 
                                typeof s.type === 'object' && 
                                isDepartmentType(s.type)
                            );
                            
                            // Create rows: one for each department
                            const rows: Array<{ department: Structure; teams: Structure[] }> = [];
                            
                            // For each top-level department, collect its children
                            topLevelStructures.forEach(department => {
                                const children = items.filter(s => s.parentId === department.id);
                                rows.push({ department, teams: children });
                            });
                            
                            return rows.map((row, index) => (
                                <tr key={`${row.department.id}-${index}`} className="border-b last:border-b-0">
                                    <td className="py-2 pr-3">
                                        {row.department.name}
                                    </td>
                                    {/* <td className="py-2 pr-3 font-medium">
                                        {row.teams.length === 0 ? (
                                            "—"
                                        ) : (
                                            <div className="space-y-1">
                                                {row.teams.map((team, teamIndex) => (
                                                    <div key={team.id} className="flex items-center justify-between">
                                                        <span>{team.name}</span>
                                                        {canWriteStructures && (
                                                            <div className="flex items-center gap-1 ml-2">
                                                                <button onClick={() => openEdit(team)}
                                                                        className="px-2 py-1 rounded-lg border hover:bg-gray-50 text-xs">
                                                                    {t("common.edit")}
                                                                </button>
                                                                <button
                                                                    onClick={() => askDelete(team)}
                                                                    className="px-2 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-xs"
                                                                >
                                                                    {t("common.delete")}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </td> */}
                                    {
                                        canWriteStructures && (
                                            <td className="py-2 pr-3">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <button 
                                                        onClick={() => openEdit(row.department)}
                                                        className="p-1 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                                                        title={t("common.edit")}
                                                    >
                                                        <div className="w-4 h-4 flex items-center justify-center">
                                                            <EditIcon stroke="currentColor" />
                                                        </div>
                                                    </button>
                                                    <button
                                                        onClick={() => askDelete(row.department)}
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
                            ));
                        })()}
                        </tbody>
                    </table>
                </div>
            )}

            {businessId && (
                <StructureUpsertModal
                    open={upsertOpen}
                    onClose={() => setUpsertOpen(false)}
                    businessId={businessId}
                    initial={editing}
                    options={items}
                    onSuccess={handleSaved}
                />
            )}

            <ConfirmModal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={doDelete}
                loading={deleteLoading}
                title={t("structures.delete.title")}
                text={
                    deleting
                        ? t("structures.delete.text", { name: deleting.name })
                        : t("structures.delete.textShort")
                }
                confirmText={t("common.delete")}
            />
        </div>
    );
};

export default StructuresPage;
