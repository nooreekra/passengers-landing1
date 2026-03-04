import axiosInstance from './axiosInstance';
import { Document, DocumentsResponse, DocumentsParams } from '@/entities/documents/types';

export const documentsApi = {
    getDocuments: async (businessId: string, params: DocumentsParams = {}): Promise<DocumentsResponse> => {
        const response = await axiosInstance.get(`/api/businesses/${businessId}/documents`, { params });
        return response.data;
    },

    getDocument: async (businessId: string, documentId: string): Promise<Document> => {
        const response = await axiosInstance.get(`/api/businesses/${businessId}/documents/${documentId}`);
        return response.data;
    },
};

