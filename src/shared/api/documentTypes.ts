import axiosInstance from './axiosInstance';
import { DocumentTypesResponse, DocumentTypesParams } from '@/entities/documentTypes/types';

export const documentTypesApi = {
    getDocumentTypes: async (params: DocumentTypesParams = {}): Promise<DocumentTypesResponse> => {
        const searchParams = new URLSearchParams();
        
        if (params.offset !== undefined) {
            searchParams.append('offset', params.offset.toString());
        }
        if (params.limit !== undefined) {
            searchParams.append('limit', params.limit.toString());
        }

        const queryString = searchParams.toString();
        const url = `/api/directories/document-types${queryString ? `?${queryString}` : ''}`;
        
        const response = await axiosInstance.get<DocumentTypesResponse>(url);
        return response.data;
    }
};
