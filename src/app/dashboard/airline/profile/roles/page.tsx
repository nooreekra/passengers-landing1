"use client";

import React, { useEffect, useState } from "react";
import { getCurrentBusiness } from "@/shared/api/business";
import type { UUID } from "@/entities/roles/types";
import { Role } from "@/entities/roles/types";
import { getRoles, getRole, deleteRole, getAirlinePositions, PositionEntry } from "@/shared/api/roles";
import { getPermissions } from "@/shared/api/permissions";
import type { Permission } from "@/entities/permissions/types";
import RoleUpsertModal from "@/shared/ui/RoleUpsertModal";
import ConfirmModal from "@/shared/ui/ConfirmModal";
import Button from "@/shared/ui/Button";
import { useTranslation } from "react-i18next";
import {usePermission} from "@/shared/lib/usePermission";
import { EditIcon, TrashIcon } from "@/shared/icons";

export default function RolesPage() {
    const canWriteRoles = usePermission("role:write");
    const { t, i18n } = useTranslation();
    const [businessId, setBusinessId] = useState<UUID | null>(null);
    const [items, setItems] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [editLoadingId, setEditLoadingId] = useState<UUID | null>(null);

    const [upsertOpen, setUpsertOpen] = useState(false);
    const [editing, setEditing] = useState<Role | undefined>();

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState<Role | undefined>();
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [positionEntries, setPositionEntries] = useState<PositionEntry[]>([]);
    const [positionLoading, setPositionLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const b = await getCurrentBusiness();
                setBusinessId(b.id as UUID);
            } catch (e: any) {
                setErr(e?.response?.data?.message || e?.message || t("roles.error.loadBusiness"));
            }
        })();
    }, [t]);

    const loadPositionEntries = async () => {
        setPositionLoading(true);
        try {
            const response = await getAirlinePositions(i18n.language);
            setPositionEntries(response.items);
        } catch (e: any) {
            console.error("Failed to load position entries:", e);
        } finally {
            setPositionLoading(false);
        }
    };

    const load = async (bid: UUID) => {
        setLoading(true);
        setErr(null);
        try {
            const [roles, perms] = await Promise.all([getRoles(bid), getPermissions(bid)]);
            setItems(roles);
            setPermissions(perms);
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || t("roles.error.loadList"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (businessId) load(businessId);
    }, [businessId]);

    useEffect(() => {
        loadPositionEntries();
    }, [i18n.language]);

    const openCreate = () => {
        setEditing(undefined);
        setUpsertOpen(true);
    };

    const openEdit = async (r: Role) => {
        if (!businessId) return;
        setEditLoadingId(r.id);
        try {
            const fresh = await getRole(businessId, r.id);
            setEditing(fresh);
            setUpsertOpen(true);
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || t("roles.error.loadItem"));
        } finally {
            setEditLoadingId(null);
        }
    };

    const handleSaved = async () => {
        if (businessId) await load(businessId);
    };

    const askDelete = (r: Role) => {
        setDeleting(r);
        setConfirmOpen(true);
    };

    const doDelete = async () => {
        if (!businessId || !deleting) return;
        setDeleteLoading(true);
        try {
            await deleteRole(businessId, deleting.id);
            await load(businessId);
            setConfirmOpen(false);
        } finally {
            setDeleteLoading(false);
        }
    };

    const getDisplayName = (role: Role) => {
        // Для авиакомпаний ищем соответствующую позицию в справочнике
        const position = positionEntries.find(p => p.code === role.name);
        return position ? position.name : role.name;
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{t("roles.title")}</h2>
                {
                    canWriteRoles && (
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
                            <th className="py-2 pr-3">{t("roles.col.name")}</th>
                            <th className="py-2 pr-3">{t("roles.col.permissionsCount")}</th>
                            {
                                canWriteRoles && (
                                    <th className="py-2 pr-3 w-40 text-right">{t("roles.col.actions")}</th>

                                )
                            }
                        </tr>
                        </thead>
                        <tbody>
                        {items.length === 0 && (
                            <tr>
                                <td className="py-6 text-center text-gray-500" colSpan={4}>
                                    {t("roles.empty")}
                                </td>
                            </tr>
                        )}
                        {items.map((r) => (
                            <tr key={r.id} className="border-b last:border-b-0">
                                <td className="py-2 pr-3">
                                    {positionLoading ? (
                                        <div className="animate-pulse h-4 bg-gray-200 rounded w-24"></div>
                                    ) : (
                                        getDisplayName(r)
                                    )}
                                </td>
                                <td className="py-2 pr-3">{r.permissions?.length ?? 0}</td>
                                {canWriteRoles && (
                                    <td className="py-2 pr-3">
                                        <div className="flex items-center gap-2 justify-end">
                                            <button 
                                                onClick={() => openEdit(r)}
                                                disabled={editLoadingId === r.id}
                                                className="p-1 rounded-lg hover:bg-gray-50 disabled:opacity-60 flex items-center justify-center"
                                                title={editLoadingId === r.id ? t("common.loading") : t("common.edit")}
                                            >
                                                <div className="w-4 h-4 flex items-center justify-center">
                                                    <EditIcon stroke="currentColor" />
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => askDelete(r)}
                                                className="p-1 rounded-lg text-red-600 hover:bg-red-50 flex items-center justify-center"
                                                title={t("common.delete")}
                                            >
                                                <div className="w-4 h-4 flex items-center justify-center">
                                                    <TrashIcon stroke="currentColor" />
                                                </div>
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {businessId && (
                <RoleUpsertModal
                    open={upsertOpen}
                    onClose={() => setUpsertOpen(false)}
                    businessId={businessId}
                    initial={editing}
                    permissions={permissions}
                    onSuccess={handleSaved}
                />
            )}

            <ConfirmModal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={doDelete}
                loading={deleteLoading}
                title={t("roles.delete.title")}
                text={
                    deleting
                        ? t("roles.delete.text", {name: getDisplayName(deleting)})
                        : t("roles.delete.textShort")
                }
                confirmText={t("common.delete")}
            />
        </div>
    );
}
