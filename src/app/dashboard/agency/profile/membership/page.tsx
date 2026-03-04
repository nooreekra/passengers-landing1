"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { fetchMembershipRequests } from "@/shared/api/membership";
import { useSelector } from "react-redux";
import MembershipDecisionModal from "@/shared/ui/MembershipDecisionModal";
import Pagination from "@/shared/ui/Pagination";
import { getBranches } from "@/shared/api/branches";
import {MembershipRequest} from "@/entities/membership/types";
import {usePermission} from "@/shared/lib/usePermission";

type RootState = any;

export default function MembershipRequests() {
    const canWriteMembershipRequests = usePermission("membership:write");
    const { t } = useTranslation();
    const businessId: string | undefined = useSelector(
        (s: RootState) => s.business?.current?.id || s.business?.id
    );

    const [items, setItems] = useState<MembershipRequest[]>([]);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const limit = 20;

    const [loading, setLoading] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"approve" | "reject">("approve");
    const [activeId, setActiveId] = useState<string>("");

    // кэш названий филиалов
    const [branchesMap, setBranchesMap] = useState<Record<string, string>>({});

    // при смене бизнеса — сброс страницы и загрузка филиалов
    useEffect(() => {
        setOffset(0);
        if (!businessId) {
            setBranchesMap({});
            return;
        }
        (async () => {
            try {
                const branches = await getBranches(businessId);
                const map: Record<string, string> = {};
                (branches || []).forEach((b: any) => {
                    map[b.id] = b.name ?? b.value ?? "";
                });
                setBranchesMap(map);
            } catch {
                toast.error(t("common.loadFail"));
            }
        })();
    }, [businessId, t]);

    // загрузка списка заявок (постранично)
    const load = async () => {
        if (!businessId) return;
        try {
            setLoading(true);
            const res = await fetchMembershipRequests(businessId, offset, limit);
            setItems((res.items || []) as MembershipRequest[]);
            setTotal(res.total || 0);
        } catch {
            toast.error(t("common.loadFail"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [businessId, offset]);

    const openApprove = (id: string) => {
        setActiveId(id);
        setModalMode("approve");
        setModalOpen(true);
    };

    const openReject = (id: string) => {
        setActiveId(id);
        setModalMode("reject");
        setModalOpen(true);
    };

    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">{t("membership.title")}</h3>
                <div className="text-sm text-label-secondary">{t("membership.total", { total })}</div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="text-left text-label-secondary">
                    <tr>
                        <th className="py-2 pr-3">{t("membership.col.created")}</th>
                        <th className="py-2 pr-3">{t("membership.col.applicant")}</th>
                        <th className="py-2 pr-3">{t("membership.col.email")}</th>
                        <th className="py-2 pr-3">{t("membership.col.status")}</th>
                        <th className="py-2 pr-3">{t("membership.col.branch")}</th>
                        <th className="py-2 pr-3">{t("membership.col.comment")}</th>
                        {canWriteMembershipRequests && <th className="py-2 pr-3">{t("membership.col.actions")}</th>}
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                            <td className="py-4" colSpan={7}>{t("membership.loading")}</td>
                        </tr>
                    ) : items.length === 0 ? (
                        <tr>
                            <td className="py-4" colSpan={7}>{t("membership.empty")}</td>
                        </tr>
                    ) : (
                        items.map((r) => {
                            const fullName = `${r.firstName ?? "—"} ${r.lastName ?? ""}`.trim();
                            const branchName = r.branchId ? (branchesMap[r.branchId] || "-") : "-";
                            return (
                                <tr key={r.id} className="border-t">
                                    <td className="py-2 pr-3">{new Date(r.createdAt).toLocaleString()}</td>
                                    <td className="py-2 pr-3">{fullName || "—"}</td>
                                    <td className="py-2 pr-3">{r.email || "—"}</td>
                                    <td className="py-2 pr-3">{t(`membership.status.${r.status}`)}</td>
                                    <td className="py-2 pr-3">{branchName}</td>
                                    <td className="py-2 pr-3 max-w-[320px] break-words">{r.comment || "—"}</td>
                                    {
                                        canWriteMembershipRequests && (
                                            <td className="py-2 pr-3">
                                                {r.status === "Pending" ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => openApprove(r.id)}
                                                            className="px-3 h-9 rounded-lg bg-green-600 text-white hover:bg-green-700"
                                                        >
                                                            {t("membership.approve")}
                                                        </button>
                                                        <button
                                                            onClick={() => openReject(r.id)}
                                                            className="px-3 h-9 rounded-lg bg-red-600 text-white hover:bg-red-700"
                                                        >
                                                            {t("membership.reject")}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-label-secondary">—</span>
                                                )}
                                            </td>
                                        )
                                    }
                                </tr>
                            );
                        })
                    )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-end mt-4">
                <Pagination
                    total={total}
                    limit={limit}
                    offset={offset}
                    onPageChange={(newOffset) => setOffset(newOffset)}
                />
            </div>

            <MembershipDecisionModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                businessId={businessId!}
                requestId={activeId}
                mode={modalMode}
                onDone={load}
            />
        </div>
    );
}
