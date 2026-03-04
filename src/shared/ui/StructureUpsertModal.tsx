"use client";

import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { UUID, Structure, UpsertStructurePayload, StructureType } from "@/entities/structures/types";
import { createStructure, updateStructure, getStructureTypes, getDirectoryEntries, DirectoryEntry } from "@/shared/api/structures";
import Button from "@/shared/ui/Button";
import { useTranslation } from "react-i18next";
import {Input} from "@/shared/ui/Input";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { isDepartmentType, isTeamType, getStructureTypeLabel } from "@/shared/constants/structureTypes";

type Props = {
    open: boolean;
    businessId: UUID;
    initial?: Partial<Structure>;
    options: Structure[];
    onClose: () => void;
    onSuccess: (saved: Structure) => void;
};

export default function StructureUpsertModal({ open, businessId, initial, options, onClose, onSuccess }: Props) {
    const { t, i18n } = useTranslation();
    const [form, setForm] = useState<UpsertStructurePayload>({ name: "", typeId: "" as UUID, parentId: null });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [types, setTypes] = useState<StructureType[]>([]);
    const [typesLoading, setTypesLoading] = useState(false);
    const [typesError, setTypesError] = useState<string | null>(null);

    const [directoryEntries, setDirectoryEntries] = useState<DirectoryEntry[]>([]);
    const [directoryLoading, setDirectoryLoading] = useState(false);
    const [directoryError, setDirectoryError] = useState<string | null>(null);

    const [departmentsEntries, setDepartmentsEntries] = useState<DirectoryEntry[]>([]);
    const [departmentsLoading, setDepartmentsLoading] = useState(false);

    const businessType = useSelector((s: RootState) => s.business.current?.type);
    const isAirline = businessType === "Airline";
    const isTravelAgency = businessType === "TravelAgency";

    useEffect(() => {
        if (!open) return;
        setTypesLoading(true);
        setTypesError(null);
        getStructureTypes(businessId)
            .then(setTypes)
            .catch((e: any) => setTypesError(e?.response?.data?.message || e?.message || t("structures.types.error")))
            .finally(() => setTypesLoading(false));
    }, [open, businessId, t]);

    useEffect(() => {
        setForm({
            name: initial?.name || "",
            parentId: initial?.parentId ?? null,
            typeId: (initial?.type && typeof initial.type === "object" ? (initial.type.id as UUID) : ("" as UUID)),
        });
        setError(null);
    }, [initial, open]);

    useEffect(() => {
        if (!open || types.length === 0) return;
        setForm((f) => (f.typeId ? f : { ...f, typeId: types[0].id as UUID }));
    }, [types, open]);

    useEffect(() => {
        if (!open || !isAirline) return;
        loadDirectoryEntries(form.typeId);
    }, [form.typeId, open, isAirline]);

    useEffect(() => {
        if (!open || !isAirline) return;
        loadDepartmentsEntries();
    }, [open, isAirline, i18n.language]);

    const parentOptions = useMemo(() => {
        if (isAirline) {
            // Для авиакомпаний показываем только департаменты
            const filtered = options.filter((o) => 
                o.id !== initial?.id && 
                !o.parentId && 
                o.type && 
                typeof o.type === 'object' && 
                isDepartmentType(o.type)
            );
            
            // Отладочная информация
            console.log('Parent options for airline:', {
                allOptions: options.map(o => ({
                    id: o.id,
                    name: o.name,
                    parentId: o.parentId,
                    type: o.type
                })),
                filtered: filtered.map(o => ({
                    id: o.id,
                    name: o.name,
                    type: o.type
                }))
            });
            
            return filtered;
        } else {
            // Для других типов бизнеса показываем все структуры верхнего уровня
            return options.filter((o) => o.id !== initial?.id && !o.parentId);
        }
    }, [options, initial?.id, isAirline]);

    // Устанавливаем первый доступный департамент как родительский по умолчанию только для отделов
    useEffect(() => {
        if (!open || !isAirline || parentOptions.length === 0) return;
        
        // Проверяем, что выбранный тип НЕ является департаментом
        const selectedType = types.find(t => t.id === form.typeId);
        const isDepartment = selectedType && isDepartmentType(selectedType);
        
        // Устанавливаем parentId только для отделов, не для департаментов
        if (!isDepartment && !form.parentId) {
            setForm((f) => ({ ...f, parentId: parentOptions[0].id }));
        } else if (isDepartment) {
            // Для департаментов убираем parentId
            setForm((f) => ({ ...f, parentId: null }));
        }
    }, [open, isAirline, parentOptions, form.parentId, form.typeId, types]);

    const getDisplayName = (structure: Structure) => {
        if (!isAirline) return structure.name;
        
        // Для авиакомпаний ищем соответствующую позицию в справочнике департаментов
        const department = departmentsEntries.find(d => d.code === structure.name);
        return department ? department.name : structure.name;
    };

    const loadDirectoryEntries = async (typeId: string) => {
        if (!isAirline || !typeId) return;
        
        const selectedType = types.find(t => t.id === typeId);
        if (!selectedType) return;

        let directoryName: 'teams' | 'departments' | null = null;
        
        if (isTeamType(selectedType)) {
            directoryName = 'teams';
        } else if (isDepartmentType(selectedType)) {
            directoryName = 'departments';
        }

        if (!directoryName) {
            setDirectoryEntries([]);
            return;
        }

        setDirectoryLoading(true);
        setDirectoryError(null);
        
        try {
            const response = await getDirectoryEntries(directoryName, i18n.language);
            setDirectoryEntries(response.items);
        } catch (e: any) {
            setDirectoryError(e?.response?.data?.message || e?.message || t("structures.directories.error"));
        } finally {
            setDirectoryLoading(false);
        }
    };

    const loadDepartmentsEntries = async () => {
        if (!isAirline) return;

        setDepartmentsLoading(true);
        try {
            const response = await getDirectoryEntries('departments', i18n.language);
            setDepartmentsEntries(response.items);
        } catch (e: any) {
            console.error("Failed to load departments entries:", e);
        } finally {
            setDepartmentsLoading(false);
        }
    };

    const submit = async () => {
        if (!form.name.trim() || !form.typeId) {
            setError(t("structures.modal.fillRequired"));
            return;
        }
        
        // Для авиакомпаний проверяем, что выбран родительский департамент только для отделов
        if (isAirline && !form.parentId) {
            const selectedType = types.find(t => t.id === form.typeId);
            const isDepartment = selectedType && isDepartmentType(selectedType);
            
            if (!isDepartment) {
                setError("Выберите родительский департамент");
                return;
            }
        }
        
        // Отладочная информация
        console.log('Submitting structure form:', {
            name: form.name,
            typeId: form.typeId,
            parentId: form.parentId,
            isAirline,
            parentOptions: parentOptions.length
        });
        
        setSaving(true);
        try {
            const saved = initial?.id ? await updateStructure(businessId, initial.id as UUID, form) : await createStructure(businessId, form);
            onSuccess(saved);
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || t("structures.modal.saveError"));
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
                            <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow">
                                <Dialog.Title className="text-lg font-semibold mb-4">
                                    {initial?.id ? t("structures.modal.editTitle") : t("structures.modal.addTitle")}
                                </Dialog.Title>

                                <div className="space-y-4">
                                    <div>
                                        <label
                                            className="block text-sm text-gray-600 mb-1">{t("structures.fields.type")}</label>
                                        <select
                                            className="bg-white w-full h-14 rounded-xl border border-border-default px-4 outline-none"
                                            value={form.typeId}
                                            onChange={(e) => {
                                                const newTypeId = e.target.value as UUID;
                                                setForm((f) => ({...f, typeId: newTypeId}));
                                                if (isAirline) {
                                                    loadDirectoryEntries(newTypeId);
                                                }
                                            }}
                                            disabled={typesLoading}
                                        >
                                            {types.filter(tItem => tItem.name && !tItem.name.includes('(')).map((tItem) => (
                                                <option key={tItem.id} value={tItem.id}>
                                                    {getStructureTypeLabel(tItem, t)}
                                                </option>
                                            ))}
                                        </select>
                                        {typesLoading && <div
                                            className="mt-1 text-xs text-gray-500">{t("structures.types.loading")}</div>}
                                        {typesError && <div className="mt-1 text-xs text-red-600">{typesError}</div>}
                                    </div>

                                    { !isTravelAgency &&
                                       types.find((t) => !isDepartmentType(t) && t.id === form.typeId) && (
                                            <div>
                                                <label
                                                    className="block text-sm text-gray-600 mb-1">{t("structures.fields.parent")}</label>
                                                <select
                                                    className="bg-white w-full h-14 rounded-xl border border-border-default px-4 outline-none"
                                                    value={form.parentId || ""}
                                                    onChange={(e) => setForm((f) => ({
                                                        ...f,
                                                        parentId: e.target.value
                                                    }))}
                                                >
                                                    {parentOptions.map((o) => (
                                                        <option key={o.id} value={o.id}>
                                                            {isAirline ? getDisplayName(o) : o.name} ({getStructureTypeLabel(o.type, t)})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )
                                    }

                                    <div>
                                        <label
                                            className="block text-sm text-gray-600 mb-1">{t("structures.fields.name")}</label>
                                        {isAirline ? (
                                            <select
                                                className="bg-white w-full h-14 rounded-xl border border-border-default px-4 outline-none"
                                                value={form.name}
                                                onChange={(e) => setForm((f) => ({...f, name: e.target.value}))}
                                                disabled={directoryLoading}
                                            >
                                                <option value="">{t("structures.fields.selectName")}</option>
                                                {directoryEntries.map((entry) => (
                                                    <option key={entry.id} value={entry.code}>
                                                        {entry.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <Input
                                                className="w-full rounded-xl border px-3 py-2"
                                                value={form.name}
                                                onChange={(e) => setForm((f) => ({...f, name: e.target.value}))}
                                                placeholder={t("structures.fields.namePlaceholder")}
                                            />
                                        )}
                                        {isAirline && directoryLoading && (
                                            <div className="mt-1 text-xs text-gray-500">{t("structures.directories.loading")}</div>
                                        )}
                                        {isAirline && directoryError && (
                                            <div className="mt-1 text-xs text-red-600">{directoryError}</div>
                                        )}
                                    </div>

                                    {error && <div className="text-sm text-red-600">{error}</div>}
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-2">
                                    <Button onClick={onClose} disabled={saving}
                                            className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50">
                                        <p className="text-black">{t("common.cancel")}</p>
                                    </Button>
                                    <Button onClick={submit} disabled={saving}
                                            className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-50">
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
