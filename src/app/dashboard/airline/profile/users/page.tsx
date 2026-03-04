"use client";

import React, {useEffect, useMemo, useState} from "react";
import {getCurrentBusiness} from "@/shared/api/business";
import type {UUID} from "@/entities/users/types";
import type {Role} from "@/entities/roles/types";
import type {Structure} from "@/entities/structures/types";
import type {User} from "@/entities/users/types";
import {getRoles} from "@/shared/api/roles";
import {getStructures} from "@/shared/api/structures";
import {getUsers, deleteUser} from "@/shared/api/users";
import UserUpsertModal from "@/shared/ui/UserUpsertModal";
import ConfirmModal from "@/shared/ui/ConfirmModal";
import Button from "@/shared/ui/Button";
import {useTranslation} from "react-i18next";
import i18n from "@/shared/i18n";
import {usePermission} from "@/shared/lib/usePermission";
import { EditIcon, TrashIcon } from "@/shared/icons";
import type {Branch} from "@/entities/branches/types";
import type {BranchType} from "@/entities/branchTypes/types";
import {getBranches} from "@/shared/api/branches";
import {getBranchTypes} from "@/shared/api/branchTypes";
import {locationCache} from "@/shared/lib/locationCache";
import {getCountries, getCitiesByCountry} from "@/shared/api/locations";

export default function UsersPage() {
    const canWriteUsers = usePermission("user:write");
    const {t} = useTranslation();
    const [businessId, setBusinessId] = useState<UUID | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [structures, setStructures] = useState<Structure[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [branchTypes, setBranchTypes] = useState<BranchType[]>([]);
    const [items, setItems] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [upsertOpen, setUpsertOpen] = useState(false);
    const [editing, setEditing] = useState<User | undefined>();

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState<User | undefined>();
    const [deleteLoading, setDeleteLoading] = useState(false);
    
    // Состояние для загрузки локаций
    const [locationsLoaded, setLocationsLoaded] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const b = await getCurrentBusiness();
                setBusinessId(b.id as UUID);
            } catch (e: any) {
                setErr(e?.response?.data?.message || e?.message || t("users.error.loadBusiness"));
            }
        })();
    }, [t]);

    // Загрузка всех локаций одним запросом
    const loadAllLocations = async () => {
        try {
            // Проверяем, не загружены ли уже локации
            if (!locationCache.isLoaded()) {
                await locationCache.loadAllLocations();
            }
            setLocationsLoaded(true);
        } catch (error) {
            console.error("Ошибка загрузки локаций:", error);
        }
    };

    const loadAll = async (bid: UUID) => {
        setLoading(true);
        setErr(null);
        try {
            // Загружаем основные данные и локации параллельно
            const [users, r, s, b, bt] = await Promise.all([
                getUsers(bid), 
                getRoles(bid), 
                getStructures(bid), 
                getBranches(bid), 
                getBranchTypes(bid),
                loadAllLocations() // Загружаем все локации одним запросом
            ]);
            
            setItems(users);
            setRoles(r);
            setStructures(s);
            setBranches(b);
            setBranchTypes(bt);
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || t("users.error.loadData"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (businessId) loadAll(businessId);
    }, [businessId]);

    // Перезагружаем данные при смене языка
    useEffect(() => {
        if (businessId) loadAll(businessId);
    }, [i18n.language]);

    const roleNameById = useMemo(() => {
        const m = new Map<UUID, string>();
        roles.forEach((r) => m.set(r.id as UUID, r.name));
        return m;
    }, [roles]);

    const structureNameById = useMemo(() => {
        const m = new Map<UUID, string>();
        structures.forEach((s) => m.set(s.id as UUID, s.name));
        return m;
    }, [structures]);

    const branchNameById = useMemo(() => {
        const m = new Map<UUID, string>();
        branches.forEach((b) => m.set(b.id as UUID, b.name));
        return m;
    }, [branches]);

    const branchTypeNameById = useMemo(() => {
        const m = new Map<UUID, string>();
        branchTypes.forEach((bt) => m.set(bt.id as UUID, bt.name));
        return m;
    }, [branchTypes]);

    const openCreate = () => {
        setEditing(undefined);
        setUpsertOpen(true);
    };
    const openEdit = (u: User) => {
        setEditing(u);
        setUpsertOpen(true);
    };
    const handleSaved = async () => {
        if (businessId) await loadAll(businessId);
    };

    const askDelete = (u: User) => {
        setDeleting(u);
        setConfirmOpen(true);
    };
    const doDelete = async () => {
        if (!businessId || !deleting) return;
        setDeleteLoading(true);
        try {
            await deleteUser(businessId, deleting.id);
            await loadAll(businessId);
            setConfirmOpen(false);
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{t("users.title")}</h2>
                {
                    canWriteUsers && (
                        <Button onClick={openCreate} className="px-4 py-2 rounded-xl bg-black text-white">
                            {t("common.add")}
                        </Button>
                    )
                }
            </div>

            {err && <div className="p-3 mb-4 rounded-md bg-red-50 text-red-700 text-sm">{err}</div>}

            {loading ? (
                <div className="animate-pulse h-40 rounded-xl bg-gray-100"/>
            ) : (
                <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full text-sm" style={{ minWidth: '1400px' }}>
                        <thead>
                        <tr className="text-left text-gray-500 border-b">
                            <th className="py-2 pr-3 w-32 whitespace-nowrap">{t("users.col.firstName")}</th>
                            <th className="py-2 pr-3 w-32 whitespace-nowrap">{t("users.col.lastName")}</th>
                            <th className="py-2 pr-3 w-40 whitespace-nowrap">{t("branches.fields.type")}</th>
                            <th className="py-2 pr-3 w-48 whitespace-nowrap">{t("users.col.branch")}</th>
                            <th className="py-2 pr-3 w-48 whitespace-nowrap">{t("users.col.department")}</th>
                            <th className="py-2 pr-3 w-40 whitespace-nowrap">{t("users.col.team")}</th>
                            <th className="py-2 pr-3 w-48 whitespace-nowrap">{t("users.col.role")}</th>
                            <th className="py-2 pr-3 w-48 whitespace-nowrap">{t("users.col.email")}</th>
                            <th className="py-2 pr-3 w-40 whitespace-nowrap">{t("users.col.phone")}</th>
                            <th className="py-2 pr-3 w-40 whitespace-nowrap">{t("users.col.extensionPhone")}</th>
                            {
                                canWriteUsers && (
                                    <th className="py-2 pr-3 w-32 text-right">{t("users.col.actions")}</th>

                                )
                            }
                        </tr>
                        </thead>
                        <tbody>
                        {items.length === 0 && (
                            <tr>
                                <td className="py-6 text-center text-gray-500" colSpan={canWriteUsers ? 11 : 10}>
                                    {t("users.empty")}
                                </td>
                            </tr>
                        )}
                        {items.map((u) => (
                            <tr key={u.id} className="border-b last:border-b-0">
                                <td className="py-2 pr-3 whitespace-nowrap">{u.firstName}</td>
                                <td className="py-2 pr-3 whitespace-nowrap">{u.lastName}</td>
                                <td className="py-2 pr-3 whitespace-nowrap">
                                    {u.branchId ? (() => {
                                        const branch = branches.find(b => b.id === u.branchId);
                                        return branch?.typeId ? branchTypeNameById.get(branch.typeId as UUID) || "—" : "—";
                                    })() : "—"}
                                </td>
                                <td className="py-2 pr-3 whitespace-nowrap">
                                    {u.branchId ? (() => {
                                        const branch = branches.find(b => b.id === u.branchId);
                                        if (!branch) return "—";
                                        
                                        // Получаем названия страны и города из кэша
                                        const countryName = branch.countryId ? (locationCache.getCountry(branch.countryId)?.name || `Country ${branch.countryId}`) : "";
                                        const cityName = branch.cityId ? (locationCache.getCity(branch.cityId)?.name || `City ${branch.cityId}`) : "";
                                        
                                        if (countryName && cityName) {
                                            return `${cityName}, ${countryName}`;
                                        } else if (countryName) {
                                            return countryName;
                                        } else if (cityName) {
                                            return cityName;
                                        } else {
                                            return branch.location || "—";
                                        }
                                    })() : "—"}
                                </td>
                                <td className="py-2 pr-3 whitespace-nowrap">
                                    {u.structureId ? (() => {
                                        const structure = structures.find(s => s.id === u.structureId);
                                        return structure?.parentId ? structureNameById.get(structure.parentId as UUID) || "—" : structureNameById.get(u.structureId as UUID) || "—";
                                    })() : "—"}
                                </td>
                                <td className="py-2 pr-3 whitespace-nowrap">
                                    {u.structureId ? (() => {
                                        const structure = structures.find(s => s.id === u.structureId);
                                        return structure?.parentId ? structureNameById.get(u.structureId as UUID) || "—" : "—";
                                    })() : "—"}
                                </td>
                                <td className="py-2 pr-3 whitespace-nowrap">{roleNameById.get(u.roleId as UUID) || "—"}</td>
                                <td className="py-2 pr-3 whitespace-nowrap">{u.email}</td>
                                <td className="py-2 pr-3 whitespace-nowrap">{u.phoneNumber || "—"}</td>
                                <td className="py-2 pr-3 whitespace-nowrap">{u.extensionPhoneNumber || "—"}</td>
                                {
                                    canWriteUsers && (
                                        <td className="py-2 pr-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2 justify-end">
                                                <button 
                                                    onClick={() => openEdit(u)}
                                                    className="p-1 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                                                    title={t("common.edit")}
                                                >
                                                    <div className="w-4 h-4 flex items-center justify-center">
                                                        <EditIcon stroke="currentColor" />
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => askDelete(u)}
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
                <UserUpsertModal
                    open={upsertOpen}
                    onClose={() => setUpsertOpen(false)}
                    businessId={businessId}
                    initial={editing}
                    roles={roles}
                    structures={structures}
                    branches={branches}
                    branchTypes={branchTypes}
                    onSuccess={handleSaved}
                />
            )}

            <ConfirmModal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={doDelete}
                loading={deleteLoading}
                title={t("users.delete.title")}
                text={
                    deleting
                        ? t("users.delete.text", {first: deleting.firstName, last: deleting.lastName})
                        : t("users.delete.textShort")
                }
                confirmText={t("common.delete")}
            />
        </div>
    );
}
