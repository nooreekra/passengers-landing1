export type UUID = string;
export type UserType = "Airline" | "TravelAgent" | "TravelAgency" | "Partnership" | "Passenger";

export type RolePermissions =
    | string[]
    | Record<UUID, string>;

export interface MeRole {
    id: UUID;
    code: string;
    name: string;
    type: UserType;
    permissions: RolePermissions;
}

export interface MeUser {
    id: UUID;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    extensionPhoneNumber?: string;
    ain?: string;
    imsNumber?: string | null;
    tier?: {
        id: string;
        code: string;
        name: string;
        color: string;
        discountPercent: number;
        levelOrder: number;
    } | null;
    country?: {
        code: string;
        name: string;
    } | null;
    role: MeRole;
}

export type AgentRegisterPayload = {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    businessId: string;
    branchId?: string;
    roleId?: string;
    structureId?: string;
    comment?: string;
};