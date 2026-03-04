"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import type { Business } from "@/entities/business/types";
import type { User } from "@/entities/users/types";
import type { Location } from "@/entities/locations/types";
import { getCurrentBusiness, getBusiness } from "@/shared/api/business";
import { getUser } from "@/shared/api/users";
import { getLocationById } from "@/shared/api/locations";
import BusinessEditModal from "@/shared/ui/BusinessEditModal";
import InfoTooltip from "@/shared/ui/InfoTooltip";
import { usePermission } from "@/shared/lib/usePermission";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { MembershipRequestModal, ChangePasswordModal } from "@/shared/ui";
import { EditIcon, LockIcon } from "@/shared/icons";
import { cancelMyMembershipRequest, fetchMyMembershipRequests } from "@/shared/api/membership";
import type { MembershipRequest } from "@/entities/membership/types";
import { splitCamelCase } from "@/shared/utils/formatting";

const dash = (v: string | null | undefined) => (v && String(v).trim() ? v : "—");
const dashArray = (v: string[] | null | undefined) => (v && v.length > 0 ? v.join(", ") : "—");

const Chip = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${className || ""}`}>
        {children}
    </span>
);

const Row = ({ label, value }: { label: string; value?: React.ReactNode }) => (
    <div className="flex justify-between items-center py-1">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-sm font-medium">{value}</span>
    </div>
);

const getInitials = (name?: string) => {
    if (!name) return "US";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

const stringToHsl = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 60%, 45%)`;
};

const makeAvatar = (name?: string, size = 64) => {
    const initials = getInitials(name);
    const bg = stringToHsl(name || "User");
    const fontSize = Math.round(size * 0.42);
    const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="100%" height="100%" rx="${Math.round(size / 4)}" fill="${bg}"/>
    <text x="50%" y="50%" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial"
          font-size="${fontSize}" font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="central">
      ${initials}
    </text>
  </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const makeLogoPlaceholder = (name?: string, size = 112) => {
    const initials = getInitials(name);
    const bg = stringToHsl(name || "Company");
    const fontSize = Math.round(size * 0.42);
    const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="100%" height="100%" rx="24" fill="${bg}"/>
    <text x="50%" y="50%" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial"
          font-size="${fontSize}" font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="central">
      ${initials}
    </text>
  </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export default function ProfileAgent() {
    const { t } = useTranslation();
    const canWriteBusiness = usePermission("business:write");
    const me = useSelector((s: RootState) => s.user.current);
    const business = useSelector((s: RootState) => s.business.current);

    const [data, setData] = useState<Business | null>(null);
    const [userData, setUserData] = useState<User | null>(null);
    const [businessCityData, setBusinessCityData] = useState<Location | null>(null);
    const [businessHeadOfficeCountryData, setBusinessHeadOfficeCountryData] = useState<Location | null>(null);
    const [businessHeadOfficeCityData, setBusinessHeadOfficeCityData] = useState<Location | null>(null);
    const [loading, setLoading] = useState(true);

    // Функция для проверки соответствия адресов
    const isSameAsRegisteredAddress = useMemo(() => {
        if (!data) return false;
        
        return (
            data.firstAddressLine === data.headquartersFirstAddressLine &&
            data.secondAddressLine === data.headquartersSecondAddressLine &&
            data.countryId === data.headquartersCountryId &&
            data.cityId === data.headquartersCityId &&
            data.postIndex === data.headquartersPostIndex
        );
    }, [data]);
    const [error, setError] = useState<string | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [requestOpen, setRequestOpen] = useState(false);
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);

    const [myReqs, setMyReqs] = useState<MembershipRequest[]>([]);
    const [reqsLoading, setReqsLoading] = useState(false);
    const [businessNames, setBusinessNames] = useState<Record<string, string>>({});

    const loadBusinessNames = async (businessIds: string[]) => {
        const newBusinessNames: Record<string, string> = {};

        // Загружаем только те бизнесы, которые еще не загружены
        const idsToLoad = businessIds.filter(id => !businessNames[id]);

        if (idsToLoad.length === 0) return;

        try {
            const promises = idsToLoad.map(async (id) => {
                try {
                    const business = await getBusiness(id);
                    newBusinessNames[id] = business.tradingName || business.legalName || "Неизвестная организация";
                } catch {
                    newBusinessNames[id] = "Неизвестная организация";
                }
            });

            await Promise.all(promises);
            setBusinessNames(prev => ({ ...prev, ...newBusinessNames }));
        } catch {
            // Игнорируем ошибки загрузки названий
        }
    };

    const loadMyRequests = async () => {
        setReqsLoading(true);
        try {
            const res = await fetchMyMembershipRequests(0, 100);
            setMyReqs(res.items || []);

            // Загружаем названия организаций для всех заявок
            const businessIds = res.items?.map(req => req.businessId) || [];
            if (businessIds.length > 0) {
                await loadBusinessNames(businessIds);
            }
        } catch {
            setMyReqs([]);
        } finally {
            setReqsLoading(false);
        }
    };

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                // Загружаем данные бизнеса
                const businessRes = await getCurrentBusiness();
                if (alive) setData(businessRes);

                // Загружаем город для бизнеса, если есть cityId
                if (businessRes.cityId) {
                    try {
                        const businessCityRes = await getLocationById(businessRes.cityId);
                        if (alive) setBusinessCityData(businessCityRes);
                    } catch (cityError: any) {
                        console.warn("Не удалось загрузить город бизнеса:", cityError);
                    }
                }

                // Загружаем страну для headquarters, если есть headquartersCountryId
                if (businessRes.headquartersCountryId) {
                    try {
                        const headOfficeCountryRes = await getLocationById(businessRes.headquartersCountryId);
                        if (alive) setBusinessHeadOfficeCountryData(headOfficeCountryRes);
                    } catch (countryError: any) {
                        console.warn("Не удалось загрузить страну headquarters:", countryError);
                    }
                }

                // Загружаем город для headquarters, если есть headquartersCityId
                if (businessRes.headquartersCityId) {
                    try {
                        const headOfficeCityRes = await getLocationById(businessRes.headquartersCityId);
                        if (alive) setBusinessHeadOfficeCityData(headOfficeCityRes);
                    } catch (cityError: any) {
                        console.warn("Не удалось загрузить город headquarters:", cityError);
                    }
                }

                // Загружаем данные пользователя, если есть ID пользователя и бизнеса
                if (me?.id && businessRes?.id) {
                    try {
                        const userRes = await getUser(businessRes.id, me.id);
                        if (alive) setUserData(userRes);
                    } catch (userError: any) {
                        console.warn("Не удалось загрузить данные пользователя:", userError);
                        // Не показываем ошибку для пользователя, так как основные данные уже загружены
                    }
                }
            } catch (e: any) {
                console.log(e);
                const msg = e?.response?.data?.message || e?.response?.data || e?.message || t("common.failedToLoad");
                if (msg === "Business not found" || msg === t("common.businessNotFound")) {
                    if (alive) setData(null);
                    await loadMyRequests();
                } else {
                    if (alive) setError(msg);
                }
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [me?.id]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
                    <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
                    <div className="flex items-start gap-4">
                        <div className="h-16 w-16 bg-gray-100 rounded-2xl" />
                        <div className="flex-1 space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={`u-${i}`} className="h-5 bg-gray-100 rounded" />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
                    <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
                    <div className="flex items-start gap-4 mb-6">
                        <div className="h-28 w-28 bg-gray-100 rounded-2xl" />
                        <div className="flex-1 space-y-3">
                            {Array.from({ length: 2 }).map((_, i) => (
                                <div key={`c-${i}`} className="h-5 bg-gray-100 rounded" />
                            ))}
                        </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={`d-${i}`} className="h-5 bg-gray-100 rounded" />
                            ))}
                        </div>
                        <div className="h-32 bg-gray-100 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="text-red-600 font-medium mb-4">Ошибка: {error}</div>
                <button
                    onClick={() => {
                        setLoading(true);
                        setError(null);
                        getCurrentBusiness()
                            .then(setData)
                            .catch(async (e: any) => {
                                const msg = e?.response?.data?.message || e?.response?.data || e?.message || "Failed to load";
                                if (msg === "Business not found" || msg === t("common.businessNotFound")) {
                                    setData(null);
                                    await loadMyRequests();
                                } else {
                                    setError(msg);
                                }
                            })
                            .finally(() => setLoading(false));
                    }}
                    className="px-4 py-2 rounded-xl bg-black text-white"
                >
                    Повторить
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Блок профиля пользователя */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{t("profile.user")}</h3>
                    <button
                        onClick={() => setChangePasswordOpen(true)}
                        className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm flex items-center gap-2"
                    >
                        <LockIcon stroke="currentColor" />
                        {t("profile.changePassword")}
                    </button>
                </div>

                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                            src={makeAvatar(`${userData?.firstName || me?.firstName || ""} ${userData?.lastName || me?.lastName || ""}`)}
                            alt="User"
                            width={64}
                            height={64}
                            className="object-cover"
                            unoptimized
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                            <h2 className="text-lg font-bold text-gray-900">
                                {dash(`${userData?.firstName || me?.firstName || ""} ${userData?.lastName || me?.lastName || ""}`.trim())}
                            </h2>
                            {(userData?.roleId || me?.role?.type) && (
                                <Chip className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-0.5">
                                    {userData?.roleId ? "User" : splitCamelCase(me?.role?.type || "")}
                                </Chip>
                            )}
                        </div>

                        <div className="space-y-2 text-sm">
                            {userData?.branchId && (
                                <div>
                                    <span className="text-gray-500">{t("profile.branch")}: </span>
                                    <span className="font-medium">{dash(userData.branch?.name)}</span>
                                </div>
                            )}
                            {userData?.structureId && (
                                <div>
                                    <span className="text-gray-500">{t("profile.department")}: </span>
                                    <span className="font-medium">{dash(userData.structure?.name)}</span>
                                </div>
                            )}
                            <div>
                                <span className="text-gray-500">{t("profile.jobTitle")}: </span>
                                <span className="font-medium">{dash(userData?.role?.name || me?.role?.name)}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">{t("profile.ain")}: </span>
                                <span className="font-medium">{dash(userData?.ain || me?.ain)}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">{t("profile.emailLabel")}: </span>
                                <span className="font-medium">
                                    {(userData?.email || me?.email) ? (
                                        <a className="text-blue-600 hover:text-blue-800 underline" href={`mailto:${userData?.email || me?.email}`}>
                                            {userData?.email || me?.email}
                                        </a>
                                    ) : (
                                        "—"
                                    )}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500">{t("profile.phoneLabel")}: </span>
                                <span className="font-medium">{dash(userData?.phoneNumber || me?.phoneNumber)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>



            {data ? (
                <>
                    {/* Блок профиля компании */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">{t("profile.company")}</h3>
                            {canWriteBusiness && (
                                <button
                                    onClick={() => setEditOpen(true)}
                                    className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm flex items-center gap-2"
                                >
                                    <EditIcon stroke="currentColor" />
                                    {t("profile.edit")}
                                </button>
                            )}
                        </div>

                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {data.logoUri ? (
                                    <Image
                                        src={data.logoUri}
                                        alt={data.tradingName || "Logo"}
                                        width={64}
                                        height={64}
                                        className="object-contain"
                                        unoptimized
                                    />
                                ) : (
                                    <Image
                                        src={makeLogoPlaceholder(data.tradingName || data.legalName || data.type)}
                                        alt="Generated placeholder"
                                        width={64}
                                        height={64}
                                        className="object-contain"
                                        unoptimized
                                    />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <h2 className="text-lg font-bold text-gray-900">{dash(data.tradingName)}</h2>
                                    <Chip className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-0.5">{splitCamelCase(data.type)}</Chip>
                                </div>

                                {data.legalName && (
                                    <div className="text-gray-600 text-sm mb-3">
                                        <span className="font-medium">{t("profile.legalNameLabel")}:</span> {data.legalName}
                                    </div>
                                )}

                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">{t("profile.corporateEmail")}: </span>
                                        <span className="font-medium">
                                            {data.corporateEmail ? (
                                                <a className="text-blue-600 hover:text-blue-800 underline" href={`mailto:${data.corporateEmail}`}>
                                                    {data.corporateEmail}
                                                </a>
                                            ) : (
                                                "—"
                                            )}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">{t("profile.ain")}: </span>
                                        <span className="font-medium">{dash(data.ain)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-5">
                            <div>
                                <h4 className="text-base font-semibold text-gray-800 mb-3">{t("profile.addresses")}</h4>
                                <div className="space-y-4">
                                    {/* Registered Address */}
                                    <div className="border border-gray-300 rounded-lg p-4">
                                        <h5 className="text-sm font-semibold text-gray-700 mb-3">{t("business.fields.registeredAddress", { defaultValue: "Registered Address" })}</h5>
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="p-3 bg-gray-50 rounded text-sm">
                                                    <div className="text-gray-500 mb-1">{t("profile.firstAddressLine")}</div>
                                                    <div className="font-medium">{dash(data.firstAddressLine)}</div>
                                                </div>
                                                <div className="p-3 bg-gray-50 rounded text-sm">
                                                    <div className="text-gray-500 mb-1">{t("profile.secondAddressLine")}</div>
                                                    <div className="font-medium">{dash(data.secondAddressLine)}</div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="p-3 bg-gray-50 rounded text-sm">
                                                    <div className="text-gray-500 mb-1">{t("profile.countryOfIncorporation")}</div>
                                                    <div className="font-medium">{dash(data.countryOfIncorporation)}</div>
                                                </div>
                                                <div className="p-3 bg-gray-50 rounded text-sm">
                                                    <div className="text-gray-500 mb-1">{t("profile.city")}</div>
                                                    <div className="font-medium">{dash(businessCityData?.name)}</div>
                                                </div>
                                                <div className="p-3 bg-gray-50 rounded text-sm">
                                                    <div className="text-gray-500 mb-1">{t("profile.postIndex")}</div>
                                                    <div className="font-medium">{dash(data.postIndex)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Head Office Address */}
                                    <div className="border border-gray-300 rounded-lg p-4">
                                        <h5 className="text-sm font-semibold text-gray-700 mb-3">{t("business.fields.headOfficeAddress", { defaultValue: "Head Office Address" })}</h5>
                                        {isSameAsRegisteredAddress ? (
                                            <div className="text-blue-600 text-sm">✓ {t("profile.sameAsRegistered")}</div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="p-3 bg-gray-50 rounded text-sm">
                                                        <div className="text-gray-500 mb-1">{t("profile.firstAddressLine")}</div>
                                                        <div className="font-medium">{dash(data.headquartersFirstAddressLine)}</div>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 rounded text-sm">
                                                        <div className="text-gray-500 mb-1">{t("profile.secondAddressLine")}</div>
                                                        <div className="font-medium">{dash(data.headquartersSecondAddressLine)}</div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="p-3 bg-gray-50 rounded text-sm">
                                                        <div className="text-gray-500 mb-1">{t("profile.countryOfIncorporation")}</div>
                                                        <div className="font-medium">{dash(businessHeadOfficeCountryData?.name)}</div>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 rounded text-sm">
                                                        <div className="text-gray-500 mb-1">{t("profile.city")}</div>
                                                        <div className="font-medium">{dash(businessHeadOfficeCityData?.name)}</div>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 rounded text-sm">
                                                        <div className="text-gray-500 mb-1">{t("profile.postIndex")}</div>
                                                        <div className="font-medium">{dash(data.headquartersPostIndex)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-orange-50 rounded-lg p-4 self-start">
                                <h4 className="text-base font-semibold text-orange-900 mb-3">{t("profile.agentInfo")}</h4>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <div className="text-orange-600 mb-1">{t("profile.businessType")}</div>
                                        <div className="font-bold text-orange-900">{dash(splitCamelCase(data.type))}</div>
                                    </div>
                                    <div>
                                        <div className="text-orange-600 mb-1 flex items-center gap-1">
                                            {t("profile.iataValidator")}
                                            <InfoTooltip
                                                text={t("profile.iataValidatorTooltip")}
                                                position="left"
                                            />
                                        </div>
                                        <div className="font-bold text-orange-900">{dashArray(data.iataValidator)}</div>
                                    </div>
                                    <div>
                                        <div className="text-orange-600 mb-1 flex items-center gap-1">
                                            {t("profile.pseudoCityCode")}
                                            <InfoTooltip
                                                text={t("profile.pseudoCityCodeTooltip")}
                                                position="left"
                                            />
                                        </div>
                                        <div className="font-bold text-orange-900">{dashArray(data.pseudoCityCode)}</div>
                                    </div>
                                    {data.ticketingAuthority === false && (
                                        <div>
                                            <div className="text-orange-600 mb-1 flex items-center gap-1">
                                                {t("profile.officeIds")}
                                                <InfoTooltip
                                                    text={t("profile.officeIdsTooltip")}
                                                    position="left"
                                                />
                                            </div>
                                            <div className="font-bold text-orange-900">{dashArray(data.officeIds)}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <BusinessEditModal open={editOpen} data={data} onClose={() => setEditOpen(false)} onSaved={(next) => setData(next)} />
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{t("profile.organization")}</h3>
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    </div>

                    {reqsLoading ? (
                        <div className="text-gray-500">{t("profile.loadingRequests")}</div>
                    ) : myReqs.length > 0 ? (
                        <div className="space-y-3">
                            {myReqs.map((r) => (
                                <div key={r.id} className="flex items-center justify-between rounded-lg bg-gray-50 border p-3">
                                    <div>
                                        <div className="font-medium">{t("profile.requestNumber")}{r.id.slice(0, 8)}</div>
                                        <div className="text-sm text-gray-600">
                                            <span className="font-medium text-blue-600">
                                                {businessNames[r.businessId] || "Загрузка..."}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {t("profile.status")} <span className="font-medium">{r.status}</span>
                                            {r.comment ? <> · {t("profile.comment")}: {r.comment}</> : null}
                                        </div>
                                        <div className="text-xs text-gray-400">{t("profile.created")} {new Date(r.createdAt).toLocaleString()}</div>
                                    </div>

                                    {r.status === "Pending" && (
                                        <button
                                            onClick={async () => {
                                                await cancelMyMembershipRequest(r.id);
                                                await loadMyRequests();
                                            }}
                                            className="px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                                        >
                                            {t("profile.cancel")}
                                        </button>
                                    )}
                                </div>
                            ))}

                            <div className="pt-2">
                                <button className="px-4 py-2 rounded-lg bg-label-blue text-white" onClick={() => setRequestOpen(true)}>
                                    {t("profile.newRequest")}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-gray-600 mb-4">
                                {t("profile.notJoinedYet")}
                            </p>
                            <button className="px-4 py-2 rounded-lg bg-label-blue text-white" onClick={() => setRequestOpen(true)}>
                                {t("profile.sendRequestToAgency")}
                            </button>
                        </>
                    )}

                    <MembershipRequestModal
                        open={requestOpen}
                        onClose={() => setRequestOpen(false)}
                        onSuccess={loadMyRequests}
                    />
                </div>
            )}

            <ChangePasswordModal
                open={changePasswordOpen}
                onClose={() => setChangePasswordOpen(false)}
                onSuccess={() => {
                    // Можно добавить уведомление об успешной смене пароля
                    console.log("Пароль успешно изменен");
                }}
            />
        </div>
    );
}
