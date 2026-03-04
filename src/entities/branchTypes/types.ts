export type UUID = string;

export interface BranchType {
    id: UUID;
    name: string;
    visible: boolean;
}

export interface UpsertBranchTypePayload {
    name: string;
}
