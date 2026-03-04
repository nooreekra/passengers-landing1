"use client";

import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import type { UUID } from "@/entities/roles/types";
import { Role, UpsertRolePayload } from "@/entities/roles/types";
import type { Permission } from "@/entities/permissions/types";
import { createRole, updateRole, getAirlinePositions, PositionEntry } from "@/shared/api/roles";
import Button from "@/shared/ui/Button";
import { useTranslation } from "react-i18next";
import { Input } from "@/shared/ui/Input";
import { PERMISSION_I18N, prettyPerm } from "@/shared/lib/permissionLabels"; // ⬅️ NEW
import { useSelector } from "react-redux";
import { RootState } from "@/store";

type Props = {
    open: boolean;
    businessId: UUID;
    initial?: Partial<Role>;
    permissions: Permission[];
    onClose: () => void;
    onSuccess: (saved: Role) => void;
};

export default function RoleUpsertModal({
                                            open,
                                            businessId,
                                            initial,
                                            permissions,
                                            onClose,
                                            onSuccess,
                                        }: Props) {
    const { t, i18n } = useTranslation();
    const businessType = useSelector((s: RootState) => s.business.current?.type);
    const isAirline = businessType === "Airline";
    const isPartnership = businessType === "Partnership";

    const [form, setForm] = useState<UpsertRolePayload>({
        name: "",
        permissionIds: [],
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");

    const [positionEntries, setPositionEntries] = useState<PositionEntry[]>([]);
    const [positionLoading, setPositionLoading] = useState(false);
    const [positionError, setPositionError] = useState<string | null>(null);

    const codeToId = useMemo(() => {
        const m = new Map<string, UUID>();
        permissions.forEach((p) => m.set(p.code, p.id));
        return m;
    }, [permissions]);

    useEffect(() => {
        const idsFromInitial =
            (initial?.permissions || [])
                .map((code) => codeToId.get(code))
                .filter(Boolean) as UUID[];

        setForm({
            name: initial?.name || "",
            permissionIds: idsFromInitial,
        });
        setQuery("");
        setError(null);
    }, [initial, open, codeToId]);

    const loadPositionEntries = async () => {
        if (!isAirline || !open) return;

        setPositionLoading(true);
        setPositionError(null);
        
        try {
            const response = await getAirlinePositions(i18n.language);
            setPositionEntries(response.items);
        } catch (e: any) {
            setPositionError(e?.response?.data?.message || e?.message || t("roles.positions.error"));
        } finally {
            setPositionLoading(false);
        }
    };

    useEffect(() => {
        if (open && isAirline) {
            loadPositionEntries();
        }
    }, [open, isAirline]);

    const getPermLabel = (code: string) =>
        t(PERMISSION_I18N[code] || "permissions.__fallback", {
            defaultValue: prettyPerm(code),
        });

    const filtered = useMemo(() => {
        // Сначала фильтруем только те разрешения, которые есть в PERMISSION_I18N
        let availablePermissions = permissions.filter((p) => PERMISSION_I18N[p.code]);
        
        if (isAirline || isPartnership) {
            // Для airline и partnership исключаем только membership:
            availablePermissions = availablePermissions.filter((p) => 
                !p.code.startsWith("membership:")
            );
        } else {
            // Для агентств и агентов исключаем promo:write
            availablePermissions = availablePermissions.filter((p) => 
                !p.code.startsWith("imsfee:") && 
                !p.code.startsWith("subscription:") && 
                !p.code.startsWith("document:") &&
                p.code !== "promo:write"
            );
        }
        
        const q = query.trim().toLowerCase();
        if (!q) return availablePermissions;

        return availablePermissions.filter((p) => {
            const label = getPermLabel(p.code).toLowerCase();
            return (
                p.code.toLowerCase().includes(q) ||
                p.id.toLowerCase().includes(q) ||
                label.includes(q)
            );
        });
    }, [permissions, query, t, isAirline, isPartnership]);

    const toggle = (id: UUID) => {
        setForm((f) =>
            f.permissionIds.includes(id)
                ? { ...f, permissionIds: f.permissionIds.filter((x) => x !== id) }
                : { ...f, permissionIds: [...f.permissionIds, id] }
        );
    };

    const selectAllVisible = () =>
        setForm((f) => ({
            ...f,
            permissionIds: Array.from(new Set([...f.permissionIds, ...filtered.map((p) => p.id)])),
        }));

    const clearAll = () => setForm((f) => ({ ...f, permissionIds: [] }));

    const submit = async () => {
        if (!form.name.trim()) {
            setError(t("roles.modal.fillRequired"));
            return;
        }
        setSaving(true);
        try {
            const payload: UpsertRolePayload = {
                name: form.name.trim(),
                permissionIds: form.permissionIds,
            };
            const saved = initial?.id
                ? await updateRole(businessId, initial.id as UUID, payload)
                : await createRole(businessId, payload);
            onSuccess(saved);
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || t("roles.modal.saveError"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => !saving && onClose()}>
                <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0 translate-y-2" enterTo="opacity-100 translate-y-0" leave="ease-in duration-100" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-2">
                            <Dialog.Panel className="w-full max-w-xl rounded-2xl bg-white p-6 shadow">
                                <Dialog.Title className="text-lg font-semibold mb-4">
                                    {initial?.id ? t("roles.modal.editTitle") : t("roles.modal.addTitle")}
                                </Dialog.Title>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">{t("roles.fields.name")}</label>
                                        {isAirline ? (
                                            <select
                                                className="bg-white w-full h-14 rounded-xl border border-border-default px-4 outline-none"
                                                value={form.name}
                                                onChange={(e) => setForm((f) => ({...f, name: e.target.value}))}
                                                disabled={positionLoading}
                                            >
                                                <option value="">{t("roles.fields.selectName")}</option>
                                                {positionEntries.map((entry) => (
                                                    <option key={entry.id} value={entry.code}>
                                                        {entry.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <Input
                                                className="w-full rounded-xl border px-3 py-2"
                                                value={form.name}
                                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                            />
                                        )}
                                        {isAirline && positionLoading && (
                                            <div className="mt-1 text-xs text-gray-500">{t("roles.positions.loading")}</div>
                                        )}
                                        {isAirline && positionError && (
                                            <div className="mt-1 text-xs text-red-600">{positionError}</div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between">
                                            <label className="block text-sm text-gray-600 mb-2">{t("roles.fields.permissions")}</label>
                                            <div className="flex gap-2 text-xs">
                                                <button type="button" onClick={selectAllVisible} className="underline">
                                                    {t("roles.selectVisible")}
                                                </button>
                                                <button type="button" onClick={clearAll} className="underline">
                                                    {t("roles.clearAll")}
                                                </button>
                                            </div>
                                        </div>

                                        <Input
                                            className="w-full rounded-xl border px-3 py-2 mb-2"
                                            placeholder={t("roles.searchPlaceholder")}
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                        />

                                        <div className="max-h-56 overflow-auto rounded-xl border p-2 space-y-1">
                                            {filtered.map((p) => {
                                                const checked = form.permissionIds.includes(p.id);
                                                const label = getPermLabel(p.code);
                                                return (
                                                    <label
                                                        key={p.id}
                                                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer"
                                                    >
                                                        <Input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggle(p.id)}
                                                            className="rounded"
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="text-sm text-gray-900">{label}</span>
                                                            <span className="font-mono text-[11px] text-gray-500">{p.code}</span>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                            {filtered.length === 0 && (
                                                <div className="text-sm text-gray-500 px-2 py-1">{t("roles.nothingFound")}</div>
                                            )}
                                        </div>

                                        {form.permissionIds.length > 0 && (
                                            <div className="mt-2 text-xs text-gray-600">
                                                {t("roles.selectedCount", { count: form.permissionIds.length })}
                                            </div>
                                        )}
                                    </div>

                                    {error && <div className="text-sm text-red-600">{error}</div>}
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-2">
                                    <Button onClick={onClose} disabled={saving} className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50">
                                        <p className="text-black">{t("common.cancel")}</p>
                                    </Button>
                                    <Button onClick={submit} disabled={saving} className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50">
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
