export type UUID = string;

export interface Branch {
    id: UUID;
    name: string;
    typeId?: UUID;
    type?: {
        id: UUID;
        name: string;
    };
    countryId?: UUID;
    country?: {
        id: UUID;
        name: string;
        code: string;
    };
    cityId?: UUID;
    city?: {
        id: UUID;
        name: string;
        code: string;
    };
    pseudoCityCode?: string[];
    location?: string;
}

export interface UpsertBranchPayload {
    name: string;
    typeId: UUID;
    countryId: UUID;
    cityId: UUID;
    pseudoCityCode?: string[];
    location?: string;
}
