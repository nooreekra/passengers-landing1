export type UUID = string;

export interface Document {
    id: UUID;
    dateTime: string; // createdAt
    updatedAt?: string;
    businessId: UUID;
    templateId: UUID;
    typeId: UUID;
    typeName: string;
    name: string;
    description?: string;
    invoiceId: UUID;
    filePath: string;
}

export interface DocumentsResponse {
    items: Document[];
    total: number;
    offset: number;
    limit: number;
}

export interface DocumentsParams {
    offset?: number;
    limit?: number;
    search?: string;
    typeId?: string;
}

