export type UUID = string;

export interface Role {
    id: UUID;
    name: string;
    branchId?: UUID | null;
    permissions: string[];
}

export interface UpsertRolePayload {
    name: string;
    permissionIds: UUID[];
}
