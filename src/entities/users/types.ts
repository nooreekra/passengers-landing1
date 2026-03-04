export type UUID = string;

export interface User {
    id: UUID;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    extensionPhoneNumber?: string;
    ain?: string;
    businessId: UUID;
    business?: {
        id: UUID;
        legalName: string;
    };
    roleId: UUID;
    role?: {
        id: UUID;
        name: string;
        type: string;
        permissions: Record<string, any>;
    };
    branchId: UUID | null;
    branch?: {
        id: UUID;
        name: string;
    } | null;
    structureId: UUID | null;
    structure?: {
        id: UUID;
        name: string;
    } | null;
}

export interface UpsertUserPayload {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    ain?: string;
    phoneNumber?: string;
    extensionPhoneNumber?: string;
    roleId: UUID;
    branchId: UUID | null;
    structureId: UUID | null;
    resetPassword?: boolean;
}