"use client";

import React, { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import type { UUID } from "@/entities/users/types";
import type { User, UpsertUserPayload } from "@/entities/users/types";
import type { Role } from "@/entities/roles/types";
import type { Structure } from "@/entities/structures/types";
import { createUser, updateUser } from "@/shared/api/users";
import Button from "@/shared/ui/Button";
import { useTranslation } from "react-i18next";
import { Input } from "@/shared/ui/Input";
import { Branch } from "@/entities/branches/types";
import type { BranchType } from "@/entities/branchTypes/types";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { locationCache } from "@/shared/lib/locationCache";

type Props = {
    open: boolean;
    businessId: UUID;
    initial?: Partial<User>;
    roles: Role[];
    structures: Structure[];
    branches: Branch[];
    branchTypes: BranchType[];
    onClose: () => void;
    onSuccess: (saved: User) => void;
};

export default function UserUpsertModal({
    open,
    businessId,
    initial,
    roles,
    structures,
    branches,
    branchTypes,
    onClose,
    onSuccess,
}: Props) {
    const { t } = useTranslation();

    const [form, setForm] = useState<UpsertUserPayload>({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phoneNumber: "",
        extensionPhoneNumber: "",
        roleId: "" as UUID,
        branchId: null,
        structureId: null
    });

    const [departmentId, setDepartmentId] = useState<UUID | null>(null);
    const [teamId, setTeamId] = useState<UUID | null>(null);
    const [selectedBranchTypeId, setSelectedBranchTypeId] = useState<UUID | null>(null);
    const [selectedCountryId, setSelectedCountryId] = useState<UUID | null>(null);
    const [selectedCityId, setSelectedCityId] = useState<UUID | null>(null);
    
    const [locationsLoaded, setLocationsLoaded] = useState(false);

    const [changePassword, setChangePassword] = useState(false);
    const [resetPassword, setResetPassword] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const formatPhoneNumber = (value: string) => {
        return value.replace(/\D/g, '');
    };


    const businessType = useSelector((s: RootState) => s.business.current?.type);
    const isTravelAgency = businessType === "TravelAgency";
    const isAirline = businessType === "Airline";

    useEffect(() => {
        if (open && isAirline && !locationsLoaded) {
            const loadAllLocations = async () => {
                try {
                    if (!locationCache.isLoaded()) {
                        await locationCache.loadAllLocations();
                    }
                    setLocationsLoaded(true);
                } catch (error) {
                    console.error("Ошибка загрузки локаций:", error);
                }
            };
            loadAllLocations();
        }
    }, [open, isAirline, locationsLoaded]);

    const getAvailableCountries = () => {
        if (!selectedBranchTypeId || !locationsLoaded) return [];
        return branches
            .filter(branch => branch.typeId === selectedBranchTypeId && branch.countryId)
            .map(branch => {
                const cached = locationCache.getCountry(branch.countryId!);
                return {
                    id: branch.countryId!,
                    name: cached?.name || `Country ${branch.countryId}`
                };
            })
            .filter((country, index, self) => 
                index === self.findIndex(c => c.id === country.id)
            );
    };

    const getAvailableCities = () => {
        if (!selectedBranchTypeId || !selectedCountryId || !locationsLoaded) return [];
        return branches
            .filter(branch => 
                branch.typeId === selectedBranchTypeId && 
                branch.countryId === selectedCountryId && 
                branch.cityId
            )
            .map(branch => {
                const cached = locationCache.getCity(branch.cityId!);
                return {
                    id: branch.cityId!,
                    name: cached?.name || `City ${branch.cityId}`
                };
            })
            .filter((city, index, self) => 
                index === self.findIndex(c => c.id === city.id)
            );
    };

    useEffect(() => {
        const validRole = roles.find((r) => r.id === (initial?.roleId as UUID));
        const roleId: UUID = (validRole?.id as UUID) || (roles[0]?.id as UUID) || ("" as UUID);

        const validStruct = structures.find((s) => s.id === (initial?.structureId as UUID));
        const structureId = (validStruct?.id as UUID) ?? null;

        const validBranch = branches.find((b) => b.id === (initial?.branchId as UUID));
        const branchId = (validBranch?.id as UUID) ?? null;

        let deptId: UUID | null = null;
        let tmId: UUID | null = null;

        if (structureId && structures.length > 0) {
            const structure = structures.find(s => s.id === structureId);
            if (structure) {
                if (structure.parentId) {
                    tmId = structureId;
                    deptId = structure.parentId;
                } else {
                    deptId = structureId;
                }
            }
        }

        setForm({
            firstName: initial?.firstName || "",
            lastName: initial?.lastName || "",
            email: initial?.email || "",
            password: "",
            phoneNumber: initial?.phoneNumber || "",
            extensionPhoneNumber: initial?.extensionPhoneNumber || "",
            roleId,
            structureId,
            branchId
        });


        setDepartmentId(deptId);
        setTeamId(tmId);
        
        if (isAirline && initial?.branchId) {
            const branch = branches.find(b => b.id === initial.branchId);
            setSelectedBranchTypeId(branch?.typeId || null);
            setSelectedCountryId(branch?.countryId || null);
            setSelectedCityId(branch?.cityId || null);
        } else {
            setSelectedBranchTypeId(null);
            setSelectedCountryId(null);
            setSelectedCityId(null);
        }
        
        setChangePassword(!initial?.id);
        setResetPassword(false);
        setError(null);
    }, [initial, open, roles, structures, branches, isAirline]);


    const submit = async () => {
        if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
            setError(t("users.modal.fillRequired"));
            return;
        }
        if (!roles.length) {
            setError(t("users.modal.noRoles"));
            return;
        }
        if (!form.roleId || !roles.some((r) => r.id === form.roleId)) {
            setError(t("users.modal.selectValidRole"));
            return;
        }

        let structureId: UUID | null = null;
        if (teamId) {
            structureId = teamId;
        } else if (departmentId) {
            structureId = departmentId;
        }

        let branchId: UUID | null = null;
        if (isAirline && selectedBranchTypeId && selectedCountryId && selectedCityId) {
            const branch = branches.find(b => 
                b.typeId === selectedBranchTypeId && 
                b.countryId === selectedCountryId && 
                b.cityId === selectedCityId
            );
            branchId = branch?.id || null;
        } else {
            branchId = form.branchId || null;
        }

        const payload: UpsertUserPayload = {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            roleId: form.roleId,
            structureId: structureId,
            branchId: branchId,
            phoneNumber: form.phoneNumber?.trim() || "",
            extensionPhoneNumber: form.extensionPhoneNumber?.trim() || ""
        }


        if (initial?.id && resetPassword) {
            payload.resetPassword = true;
        } else if (initial?.id && changePassword && form.password) {
            payload.password = form.password;
        }

        setSaving(true);
        try {
            const saved = initial?.id
                ? await updateUser(businessId, initial.id as UUID, payload)
                : await createUser(businessId, payload);
            onSuccess(saved);
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || t("users.modal.saveError"));
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
                            <Dialog.Panel className="w-full max-w-lg max-h-[90vh] rounded-2xl bg-white shadow flex flex-col">
                                <div className="p-6 pb-4 border-b border-gray-200">
                                    <Dialog.Title className="text-lg font-semibold">
                                        {initial?.id ? t("users.modal.editTitle") : t("users.modal.addTitle")}
                                    </Dialog.Title>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 pt-4">
                                    <div className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label
                                                className="block text-sm text-gray-600 mb-1">{t("users.fields.firstName")}</label>
                                            <Input
                                                className="w-full rounded-xl border px-3 py-2"
                                                value={form.firstName}
                                                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label
                                                className="block text-sm text-gray-600 mb-1">{t("users.fields.lastName")}</label>
                                            <Input
                                                className="w-full rounded-xl border px-3 py-2"
                                                value={form.lastName}
                                                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            className="block text-sm text-gray-600 mb-1">{t("users.fields.email")}</label>
                                        <Input
                                            type="email"
                                            className="w-full rounded-xl border px-3 py-2"
                                            value={form.email}
                                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label
                                                className="block text-sm text-gray-600 mb-1">{t("users.fields.phone")}</label>
                                            <Input
                                                className="w-full rounded-xl border px-3 py-2"
                                                value={form.phoneNumber}
                                                onChange={(e) => {
                                                    const formatted = formatPhoneNumber(e.target.value);
                                                    setForm((f) => ({ ...f, phoneNumber: formatted }));
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label
                                                className="block text-sm text-gray-600 mb-1">{t("users.fields.extensionPhone")}</label>
                                            <Input
                                                className="w-full rounded-xl border px-3 py-2"
                                                value={form.extensionPhoneNumber}
                                                onChange={(e) => setForm((f) => ({ ...f, extensionPhoneNumber: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            className="block text-sm text-gray-600 mb-1">
                                            {isAirline ? t("branches.fields.type") : t("users.fields.branch")}
                                        </label>
                                        {isAirline ? (
                                            <select
                                                className="bg-white w-full h-14 rounded-xl border border-border-default px-4 outline-none"
                                                value={selectedBranchTypeId || ""}
                                                onChange={(e) => {
                                                    const typeId = e.target.value || null;
                                                    setSelectedBranchTypeId(typeId as UUID);
                                                    setSelectedCountryId(null);
                                                    setSelectedCityId(null);
                                                }}
                                            >
                                                <option value="">{t("users.none")}</option>
                                                {branchTypes.map((bt) => (
                                                    <option key={bt.id} value={bt.id}>
                                                        {bt.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <select
                                                className="bg-white w-full h-14 rounded-xl border border-border-default px-4 outline-none"
                                                value={form.branchId || ""}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        branchId: (e.target.value || null) as any,
                                                    }))
                                                }
                                            >
                                                <option value="">{t("users.none")}</option>
                                                {branches.map((b) => (
                                                    <option key={b.id} value={b.id}>
                                                        {b.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    {isAirline && selectedBranchTypeId && (
                                        <>
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">
                                                    {t("branches.fields.country")}
                                                </label>
                                                <select
                                                    className="bg-white w-full h-14 rounded-xl border border-border-default px-4 outline-none"
                                                    value={selectedCountryId || ""}
                                                    onChange={(e) => {
                                                        const countryId = e.target.value || null;
                                                        setSelectedCountryId(countryId as UUID);
                                                        setSelectedCityId(null);
                                                    }}
                                                >
                                                    <option value="">{t("users.none")}</option>
                                                    {getAvailableCountries().map((country) => (
                                                        <option key={country.id} value={country.id}>
                                                            {country.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">
                                                    {t("branches.fields.city")}
                                                </label>
                                                <select
                                                    className="bg-white w-full h-14 rounded-xl border border-border-default px-4 outline-none"
                                                    value={selectedCityId || ""}
                                                    onChange={(e) => {
                                                        const cityId = e.target.value || null;
                                                        setSelectedCityId(cityId as UUID);
                                                    }}
                                                    disabled={!selectedCountryId}
                                                >
                                                    <option value="">{t("users.none")}</option>
                                                    {getAvailableCities().map((city) => (
                                                        <option key={city.id} value={city.id}>
                                                            {city.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label
                                            className="block text-sm text-gray-600 mb-1">{t("users.fields.department")}</label>
                                        <select
                                            className="bg-white w-full h-14 rounded-xl border border-border-default px-4 outline-none"
                                            value={departmentId || ""}
                                            onChange={(e) => {
                                                const deptId = e.target.value || null;
                                                setDepartmentId(deptId as UUID);
                                                setTeamId(null);
                                                setForm(f => ({ ...f, structureId: deptId as UUID }));
                                            }}
                                        >
                                            <option value="">{t("users.none")}</option>
                                            {structures.filter(s => !s.parentId).map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {
                                        !isTravelAgency && (
                                            <div>
                                                <label
                                                    className="block text-sm text-gray-600 mb-1">{t("users.fields.team")}</label>
                                                <select
                                                    className="bg-white w-full h-14 rounded-xl border border-border-default px-4 outline-none"
                                                    value={teamId || ""}
                                                    onChange={(e) => {
                                                        const tmId = e.target.value || null;
                                                        setTeamId(tmId as UUID);
                                                        setForm(f => ({ ...f, structureId: tmId as UUID }));
                                                    }}
                                                    disabled={!departmentId || !structures.some(s => s.parentId === departmentId)}
                                                >
                                                    <option value="">{t("users.none")}</option>
                                                    {structures.filter(s => s.parentId === departmentId).map((s) => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )
                                    }

                                    <div>
                                        <label
                                            className="block text-sm text-gray-600 mb-1">{t("users.fields.role")}</label>
                                        <select
                                            className="bg-white w-full h-14 rounded-xl border border-border-default px-4 outline-none"
                                            value={form.roleId}
                                            onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value as UUID }))}
                                            disabled={!roles.length}
                                        >
                                            {roles.map((r) => (
                                                <option key={r.id} value={r.id}>
                                                    {r.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>


                                    {initial?.id && (
                                        <div className="pt-3">
                                            <label className="inline-flex items-center gap-2 text-sm">
                                                <Input
                                                    type="checkbox"
                                                    checked={resetPassword}
                                                    onChange={(e) => setResetPassword(e.target.checked)}
                                                />
                                                {t("users.fields.resetPassword")}
                                            </label>
                                        </div>
                                    )}

                                    {error && <div className="text-sm text-red-600">{error}</div>}
                                    </div>
                                </div>

                                <div className="p-6 pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
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