"use client";

import React, { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import type { UUID } from "@/entities/branchTypes/types";
import type { BranchType, UpsertBranchTypePayload } from "@/entities/branchTypes/types";
import { createBranchType, updateBranchType } from "@/shared/api/branchTypes";
import Button from "@/shared/ui/Button";
import { useTranslation } from "react-i18next";
import {Input} from "@/shared/ui/Input";

type Props = {
    open: boolean;
    businessId: UUID;
    initial?: Partial<BranchType>;
    onClose: () => void;
    onSuccess: (saved: BranchType) => void;
};

export default function BranchTypeUpsertModal({
                                                  open,
                                                  businessId,
                                                  initial,
                                                  onClose,
                                                  onSuccess,
                                              }: Props) {
    const { t } = useTranslation();

    const [form, setForm] = useState<UpsertBranchTypePayload>({ name: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setForm({ name: initial?.name || "" });
        setError(null);
    }, [initial, open]);

    const submit = async () => {
        if (!form.name.trim()) {
            setError(t("branchTypes.modal.nameRequired"));
            return;
        }
        setSaving(true);
        try {
            const payload = { name: form.name.trim() };
            const saved = initial?.id
                ? await updateBranchType(businessId, initial.id as UUID, payload)
                : await createBranchType(businessId, payload);
            onSuccess(saved);
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || t("branchTypes.modal.saveError"));
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
                                    {initial?.id ? t("branchTypes.modal.editTitle") : t("branchTypes.modal.addTitle")}
                                </Dialog.Title>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">{t("branchTypes.fields.name")}</label>
                                        <Input
                                            className="w-full rounded-xl border px-3 py-2"
                                            value={form.name}
                                            onChange={(e) => setForm({ name: e.target.value })}
                                            placeholder={t("branchTypes.fields.namePh")}
                                        />
                                    </div>
                                    {error && <div className="text-sm text-red-600">{error}</div>}
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-2">
                                    <Button onClick={onClose} disabled={saving} className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50">
                                        <p className="text-black">{t("common.cancel")}</p>
                                    </Button>
                                    <Button onClick={submit} disabled={saving} className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-50">
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
