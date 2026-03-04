export interface Requisites {
    id: string;
    bankId: string;
    bankName: string;
    businessId: string;
    businessName: string;
    uin: string;
    accountNumber: string;
    bankBic?: string;
    legalName?: string;
    legalAddress?: string;
}

export interface RequisitesResponse {
    items: Requisites[];
    total: number;
    offset: number;
    limit: number;
}

export interface RequisitesParams {
    offset?: number;
    limit?: number;
}

export interface CreateRequisitesPayload {
    bankId: string;
    uin: string;
    accountNumber: string;
    legalName: string;
    legalAddress: string;
}

export interface UpdateRequisitesPayload extends CreateRequisitesPayload {
    id: string;
}
