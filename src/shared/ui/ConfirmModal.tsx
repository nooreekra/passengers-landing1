"use client";

import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment } from "react";
import Button from "@/shared/ui/Button";
import { useTranslation } from "react-i18next";

type Props = {
    open: boolean;
    title?: string;
    icon?: React.ReactNode;
    text: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
    danger?: boolean;
    onConfirm: () => void;
    onClose: () => void;
    children?: React.ReactNode;
};

export default function ConfirmModal({
                                         open,
                                         title,
                                         icon,
                                         text,
                                         confirmText,
                                         cancelText,
                                         loading,
                                         danger = false,
                                         onConfirm,
                                         onClose,
                                         children,
                                     }: Props) {
    const { t } = useTranslation();
    
    const defaultTitle = title || t("common.confirm_title", { defaultValue: "Подтверждение" });
    const defaultConfirmText = confirmText || t("common.confirm", { defaultValue: "Подтвердить" });
    const defaultCancelText = cancelText || t("common.cancel", { defaultValue: "Отмена" });
    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => !loading && onClose()}>
                <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30" />
                </Transition.Child>
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0 translate-y-2" enterTo="opacity-100 translate-y-0" leave="ease-in duration-100" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-2">
                        <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
                            <Dialog.Title className="text-lg font-semibold mb-3 flex items-center gap-2">
                                {icon && <span className="inline-flex items-center justify-center w-6 h-6 text-gray-700">{icon}</span>}
                                <span>{defaultTitle}</span>
                            </Dialog.Title>
                            <p className="text-sm text-gray-700">{text}</p>
                            {children && (
                                <div className="mt-4">
                                    {children}
                                </div>
                            )}
                            <div className="mt-6 flex items-center justify-end gap-2">
                                <Button onClick={onClose} disabled={loading} className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50">
                                    <p className="text-black">{defaultCancelText}</p>
                                </Button>
                                <Button 
                                    onClick={onConfirm} 
                                    disabled={loading} 
                                    className={`px-4 py-2 rounded-xl text-white hover:opacity-90 disabled:opacity-50 ${
                                        danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                >
                                    {loading ? t("common.loading", { defaultValue: "..." }) : defaultConfirmText}
                                </Button>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
