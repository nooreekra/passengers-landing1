"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getCurrentBusiness } from "@/shared/api/business";
import { UUID, Structure } from "@/entities/structures/types";
import { getStructures, deleteStructure, getDirectoryEntries, DirectoryEntry } from "@/shared/api/structures";
import StructureUpsertModal from "@/shared/ui/StructureUpsertModal";
import ConfirmModal from "@/shared/ui/ConfirmModal";
import Button from "@/shared/ui/Button";
import { useTranslation } from "react-i18next";
import {usePermission} from "@/shared/lib/usePermission";
import { EditIcon, TrashIcon } from "@/shared/icons";
import { isDepartmentType } from "@/shared/constants/structureTypes";

const StructuresPage = () => {
    const canWriteStructures = usePermission("branch:write");
    const { t, i18n } = useTranslation();
    const [businessId, setBusinessId] = useState<UUID | null>(null);
    const [items, setItems] = useState<Structure[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [upsertOpen, setUpsertOpen] = useState(false);
    const [editing, setEditing] = useState<Structure | undefined>();

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState<Structure | undefined>();
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [teamsEntries, setTeamsEntries] = useState<DirectoryEntry[]>([]);
    const [departmentsEntries, setDepartmentsEntries] = useState<DirectoryEntry[]>([]);
    const [directoriesLoading, setDirectoriesLoading] = useState(false);

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

    const loadDirectories = async () => {
        setDirectoriesLoading(true);
        try {
            const [teamsResponse, departmentsResponse] = await Promise.all([
                getDirectoryEntries('teams', i18n.language),
                getDirectoryEntries('departments', i18n.language)
            ]);
            setTeamsEntries(teamsResponse.items);
            setDepartmentsEntries(departmentsResponse.items);
        } catch (e: any) {
            console.error("Failed to load directories:", e);
        } finally {
            setDirectoriesLoading(false);
        }
    };

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

    useEffect(() => {
        loadDirectories();
    }, [i18n.language]);

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

    const getDisplayName = (structure: Structure) => {
        // Определяем тип структуры по parentId
        const isDepartment = !structure.parentId;
        const isTeam = !!structure.parentId;
        
        if (isDepartment) {
            // Для департаментов ищем в справочнике departments
            const department = departmentsEntries.find(d => d.code === structure.name);
            return department ? department.name : structure.name;
        } else if (isTeam) {
            // Для отделов ищем в справочнике teams
            const team = teamsEntries.find(t => t.code === structure.name);
            return team ? team.name : structure.name;
        }
        
        return structure.name;
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
                            <th className="py-2 pr-3 w-2/5">{t("structures.col.department")}</th>
                            <th className="py-2 pr-3 w-2/5">{t("structures.col.team")}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {items.length === 0 && (
                            <tr>
                                <td className="py-6 text-center text-gray-500" colSpan={2}>
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
                                    <td className="py-2 pr-6 w-2/5">
                                        <div className="flex items-center justify-between">
                                            <span className="flex-1">
                                                {directoriesLoading ? (
                                                    <div className="animate-pulse h-4 bg-gray-200 rounded w-24"></div>
                                                ) : (
                                                    getDisplayName(row.department)
                                                )}
                                            </span>
                                            {canWriteStructures && (
                                                <div className="flex items-center gap-2 ml-4">
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
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-2 pr-3 font-medium w-2/5">
                                        {row.teams.length === 0 ? (
                                            "—"
                                        ) : (
                                            <div className="space-y-1">
                                                {row.teams.map((team, teamIndex) => (
                                                    <div key={team.id} className="flex items-center justify-between">
                                                        <span className="flex-1">
                                                            {directoriesLoading ? (
                                                                <div className="animate-pulse h-4 bg-gray-200 rounded w-20"></div>
                                                            ) : (
                                                                getDisplayName(team)
                                                            )}
                                                        </span>
                                                        {canWriteStructures && (
                                                            <div className="flex items-center gap-2 ml-4">
                                                                <button 
                                                                    onClick={() => openEdit(team)}
                                                                    className="p-1 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                                                                    title={t("common.edit")}
                                                                >
                                                                    <div className="w-4 h-4 flex items-center justify-center">
                                                                        <EditIcon stroke="currentColor" />
                                                                    </div>
                                                                </button>
                                                                <button
                                                                    onClick={() => askDelete(team)}
                                                                    className="p-1 rounded-lg text-red-600 hover:bg-red-50 flex items-center justify-center"
                                                                    title={t("common.delete")}
                                                                >
                                                                    <div className="w-4 h-4 flex items-center justify-center">
                                                                        <TrashIcon stroke="currentColor" />
                                                                    </div>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
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
                        ? t("structures.delete.text", { name: getDisplayName(deleting) })
                        : t("structures.delete.textShort")
                }
                confirmText={t("common.delete")}
            />
        </div>
    );
};

export default StructuresPage;
