"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import type { Business } from "@/entities/business/types";
import type { User } from "@/entities/users/types";
import type { Branch } from "@/entities/branches/types";
import type { Location } from "@/entities/locations/types";
import type { BranchType } from "@/entities/branchTypes/types";
import { getCurrentBusiness } from "@/shared/api/business";
import { getUser } from "@/shared/api/users";
import { getBranch } from "@/shared/api/branches";
import { getLocationById } from "@/shared/api/locations";
import { getBranchTypes } from "@/shared/api/branchTypes";
import BusinessEditModal from "@/shared/ui/BusinessEditModal";
import { ChangePasswordModal } from "@/shared/ui";
import { EditIcon, LockIcon } from "@/shared/icons";
import { usePermission } from "@/shared/lib/usePermission";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { splitCamelCase } from "@/shared/utils/formatting";

const dash = (v: string | number | null | undefined) => (v && String(v).trim() ? String(v) : "—");

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

export default function ProfilePartnership() {
    const { t } = useTranslation();
    const canWriteBusiness = usePermission("business:write");
    const me = useSelector((s: RootState) => s.user.current);
    const business = useSelector((s: RootState) => s.business.current);

    const [data, setData] = useState<Business | null>(null);
    const [userData, setUserData] = useState<User | null>(null);
    const [branchData, setBranchData] = useState<Branch | null>(null);
    const [countryData, setCountryData] = useState<Location | null>(null);
    const [cityData, setCityData] = useState<Location | null>(null);
    const [businessCityData, setBusinessCityData] = useState<Location | null>(null);
    const [businessHeadOfficeCountryData, setBusinessHeadOfficeCountryData] = useState<Location | null>(null);
    const [businessHeadOfficeCityData, setBusinessHeadOfficeCityData] = useState<Location | null>(null);
    const [branchTypes, setBranchTypes] = useState<BranchType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);

    const typesMap = useMemo(() => new Map(branchTypes.map((t) => [t.id, t.name])), [branchTypes]);

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

                // Загружаем типы филиалов
                if (businessRes.id) {
                    try {
                        const typesRes = await getBranchTypes(businessRes.id);
                        if (alive) setBranchTypes(typesRes);
                    } catch (typesError: any) {
                        console.warn("Не удалось загрузить типы филиалов:", typesError);
                    }
                }

                // Загружаем данные пользователя, если есть ID пользователя и бизнеса
                if (me?.id && businessRes?.id) {
                    try {
                        const userRes = await getUser(businessRes.id, me.id);
                        if (alive) setUserData(userRes);

                        // Загружаем данные филиала, если есть branchId
                        if (userRes.branchId) {
                            try {
                                const branchRes = await getBranch(businessRes.id, userRes.branchId);
                                if (alive) setBranchData(branchRes);

                                // Загружаем данные страны и города, если есть их ID
                                if (branchRes.countryId) {
                                    try {
                                        const countryRes = await getLocationById(branchRes.countryId);
                                        if (alive) setCountryData(countryRes);
                                    } catch (countryError: any) {
                                        console.warn("Не удалось загрузить данные страны:", countryError);
                                    }
                                }

                                if (branchRes.cityId) {
                                    try {
                                        const cityRes = await getLocationById(branchRes.cityId);
                                        if (alive) setCityData(cityRes);
                                    } catch (cityError: any) {
                                        console.warn("Не удалось загрузить данные города:", cityError);
                                    }
                                }
                            } catch (branchError: any) {
                                console.warn("Не удалось загрузить данные филиала:", branchError);
                                // Не показываем ошибку для пользователя, так как основные данные уже загружены
                            }
                        }
                    } catch (userError: any) {
                        console.warn("Не удалось загрузить данные пользователя:", userError);
                        // Не показываем ошибку для пользователя, так как основные данные уже загружены
                    }
                }
            } catch (e: any) {
                setError(e?.response?.data?.message || e?.message || t("common.failedToLoad"));
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
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
                <div className="text-red-600 font-medium mb-4">{t("profile.error")}: {error}</div>
                <button
                    onClick={() => {
                        setLoading(true);
                        setError(null);
                        getCurrentBusiness()
                            .then(setData)
                            .catch((e: any) =>
                                setError(e?.response?.data?.message || e?.message || t("common.failedToLoad")),
                            )
                            .finally(() => setLoading(false));
                    }}
                    className="px-4 py-2 rounded-xl bg-black text-white"
                >
                    {t("profile.repeat")}
                </button>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-4">
            {/* Administrator Profile */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Administrator Profile</h3>
                    <button
                        onClick={() => setChangePasswordOpen(true)}
                        className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm flex items-center gap-2"
                    >
                        <LockIcon stroke="currentColor" />
                        Change Password
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
                            <div>
                                <span className="text-gray-500">Branch Type: </span>
                                <span className="font-medium">{dash(branchData?.typeId ? (typesMap.get(branchData.typeId) || branchData.typeId) : branchData?.type?.name)}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Branch: </span>
                                <span className="font-medium">
                                    {countryData || cityData ? (
                                        `${dash(countryData?.name)}, ${dash(cityData?.name)}`
                                    ) : (
                                        "—"
                                    )}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500">Job Title: </span>
                                <span className="font-medium">{dash(userData?.role?.name || me?.role?.name)}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Email: </span>
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
                                <span className="text-gray-500">Phone number: </span>
                                <span className="font-medium">{dash(userData?.phoneNumber || me?.phoneNumber)}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Phone number (ext): </span>
                                <span className="font-medium">{dash(userData?.extensionPhoneNumber || me?.extensionPhoneNumber)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Company Profile */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Company Profile</h3>
                    {canWriteBusiness && (
                        <button
                            onClick={() => setEditOpen(true)}
                            className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm flex items-center gap-2"
                        >
                            <EditIcon stroke="currentColor" />
                            Edit
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
                            <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                Logo
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                            <h2 className="text-lg font-bold text-gray-900">{dash(data.tradingName)}</h2>
                            <Chip className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-0.5">{splitCamelCase(data.type)}</Chip>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="text-gray-500">Registered name: </span>
                                <span className="font-medium">{dash(data.legalName)}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Corporate email: </span>
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
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                    <div>
                        <h4 className="text-base font-semibold text-gray-800 mb-3">Addresses</h4>
                        <div className="space-y-4">
                            {/* Registered Address */}
                            <div className="border border-gray-300 rounded-lg p-4">
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-3 bg-gray-50 rounded text-sm">
                                            <div className="text-gray-500 mb-1">Address line 1</div>
                                            <div className="font-medium">{dash(data.firstAddressLine)}</div>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded text-sm">
                                            <div className="text-gray-500 mb-1">Address line 2</div>
                                            <div className="font-medium">{dash(data.secondAddressLine)}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="p-3 bg-gray-50 rounded text-sm">
                                            <div className="text-gray-500 mb-1">Country</div>
                                            <div className="font-medium">{dash(data.countryOfIncorporation)}</div>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded text-sm">
                                            <div className="text-gray-500 mb-1">City</div>
                                            <div className="font-medium">{dash(businessCityData?.name)}</div>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded text-sm">
                                            <div className="text-gray-500 mb-1">Post Index</div>
                                            <div className="font-medium">{dash(data.postIndex)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Head Office Address */}
                            <div className="border border-gray-300 rounded-lg p-4">
                                <h5 className="text-sm font-semibold text-gray-700 mb-3">Head Office Address</h5>
                                {isSameAsRegisteredAddress ? (
                                    <div className="flex items-center gap-2 text-blue-600 text-sm">
                                        <span className="w-4 h-4 border-2 border-blue-600 rounded flex items-center justify-center">
                                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                        </span>
                                        same as registered address
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-3 bg-gray-50 rounded text-sm">
                                                <div className="text-gray-500 mb-1">Address line 1</div>
                                                <div className="font-medium">{dash(data.headquartersFirstAddressLine)}</div>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded text-sm">
                                                <div className="text-gray-500 mb-1">Address line 2</div>
                                                <div className="font-medium">{dash(data.headquartersSecondAddressLine)}</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="p-3 bg-gray-50 rounded text-sm">
                                                <div className="text-gray-500 mb-1">Country</div>
                                                <div className="font-medium">{dash(businessHeadOfficeCountryData?.name)}</div>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded text-sm">
                                                <div className="text-gray-500 mb-1">City</div>
                                                <div className="font-medium">{dash(businessHeadOfficeCityData?.name)}</div>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded text-sm">
                                                <div className="text-gray-500 mb-1">Post Index</div>
                                                <div className="font-medium">{dash(data.headquartersPostIndex)}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 self-start">
                        <h4 className="text-base font-semibold text-blue-900 mb-3">{t("profile.companyCodes")}</h4>
                        <div className="space-y-3 text-sm">
                            <div className="border-b border-blue-200 pb-2">
                                <div className="text-blue-600 mb-1">—</div>
                            </div>
                            <div className="border-b border-blue-200 pb-2">
                                <div className="text-blue-600 mb-1">—</div>
                            </div>
                            <div>
                                <div className="text-blue-600 mb-1">—</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <BusinessEditModal
                open={editOpen}
                data={data}
                onClose={() => setEditOpen(false)}
                onSaved={(next) => setData(next)}
            />

            <ChangePasswordModal
                open={changePasswordOpen}
                onClose={() => setChangePasswordOpen(false)}
                onSuccess={() => {
                    console.log("Пароль успешно изменен");
                }}
            />
        </div>
    );
}

