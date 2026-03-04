export interface DocumentType {
    id: string;
    createdAt: string;
    updatedAt: string | null;
    code: string;
    name: string;
    description: string;
}

export interface DocumentTypesResponse {
    items: DocumentType[];
    total: number;
    offset: number;
    limit: number;
}

export interface DocumentTypesParams {
    offset?: number;
    limit?: number;
}
