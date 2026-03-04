export type UUID = string;

export interface StructureType {
    id: UUID;
    name?: string;
    value?: string;
    businessId?: UUID;
}

export interface Structure {
    id: UUID;
    name: string;
    type: StructureType;
    parentId: UUID | null;
    businessId: UUID;
    typeId?: UUID;
}

export interface UpsertStructurePayload {
    name: string;
    typeId: UUID;
    parentId: UUID | null;
}

export const structureTypeLabel = (t: StructureType | null | undefined): string =>
    (t?.name || t?.value || "") as string;
