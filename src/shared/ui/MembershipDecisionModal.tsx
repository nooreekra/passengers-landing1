"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { decideMembershipRequest } from "@/shared/api/membership";
import {getBranches} from "@/shared/api/branches";
import {getRoles} from "@/shared/api/roles";
import {getStructures} from "@/shared/api/structures";
import {MembershipDecision} from "@/entities/membership/types";


type Option = { id: string; name: string };

type Props = {
    isOpen: boolean;
    onClose: () => void;
    businessId: string;
    requestId: string;
    mode: "approve" | "reject";
    onDone: () => void;
};

export default function MembershipDecisionModal({
                                                    isOpen,
                                                    onClose,
                                                    businessId,
                                                    requestId,
                                                    mode,
                                                    onDone,
                                                }: Props) {
    const { t } = useTranslation();

    const [branches, setBranches] = useState<Option[]>([]);
    const [roles, setRoles] = useState<Option[]>([]);
    const [structures, setStructures] = useState<Option[]>([]);
    const [loadingRefs, setLoadingRefs] = useState(false);

    const [branchId, setBranchId] = useState("");
    const [roleId, setRoleId] = useState("");
    const [structureId, setStructureId] = useState("");
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const selectBase = "w-full h-10 px-3 py-2 border rounded-lg focus:outline-none text-sm bg-white border-border-default";
    const inputBase  = "w-full h-10 px-3 py-2 border rounded-lg focus:outline-none text-sm border-border-default";
    const title = mode === "approve" ? t("membership.approveTitle") : t("membership.rejectTitle");

    useEffect(() => {
        if (!isOpen || mode !== "approve") return;
        const loadRefs = async () => {
            try {
                setLoadingRefs(true);
                const [br, rl, st] = await Promise.all([
                    getBranches(businessId),
                    getRoles(businessId),
                    getStructures(businessId),
                ]);
                const map = (arr: any[]) => (arr || []).map((x) => ({ id: x.id, name: x.name ?? x.value ?? "" }));
                setBranches(map(br));
                setRoles(map(rl));
                setStructures(map(st));
            } catch {
                toast.error(t("common.loadFail"));
            } finally {
                setLoadingRefs(false);
            }
        };
        loadRefs();
    }, [isOpen, mode, businessId, t]);

    if (!isOpen) return null;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload: MembershipDecision =
            mode === "approve"
                ? { status: "Approved", branchId: branchId || null, roleId: roleId || null, structureId: structureId || null, reason: reason || null }
                : { status: "Rejected", reason: reason || null };

        try {
            setSubmitting(true);
            await decideMembershipRequest(businessId, requestId, payload);
            toast.success(mode === "approve" ? t("membership.approved") : t("membership.rejected"));
            onClose();
            onDone();
        } catch (e: any) {
            const msg = e?.response?.data?.message || t("membership.actionFail");
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-[420px] p-4 md:p-5 relative mx-4" onClick={(e) => e.stopPropagation()}>
                <button className="absolute top-3 right-3 text-black" onClick={onClose}><X /></button>
                <p className="text-center mb-4 body-L-semibold text-label-primary">{title}</p>

                <form className="space-y-3" onSubmit={submit}>
                    {mode === "approve" && (
                        <>
                            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={selectBase} disabled={loadingRefs}>
                                <option value="">{t("common.selectBranchOptional")}</option>
                                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className={selectBase} disabled={loadingRefs}>
                                <option value="">{t("common.selectRoleOptional")}</option>
                                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                            <select value={structureId} onChange={(e) => setStructureId(e.target.value)} className={selectBase} disabled={loadingRefs}>
                                <option value="">{t("common.selectStructureOptional")}</option>
                                {structures.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </>
                    )}

                    <input
                        type="text"
                        placeholder={t("membership.reasonPlaceholder")}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className={inputBase}
                    />

                    <button
                        type="submit"
                        className={clsx(
                            "w-full h-11 rounded-lg text-white font-semibold",
                            mode === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700",
                            submitting && "opacity-70"
                        )}
                        disabled={submitting}
                    >
                        {submitting ? t("common.saving") : mode === "approve" ? t("membership.approve") : t("membership.reject")}
                    </button>
                </form>
            </div>
        </div>
    );
}
