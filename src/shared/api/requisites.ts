import axiosInstance from './axiosInstance';
import { 
    Requisites, 
    RequisitesResponse, 
    RequisitesParams, 
    CreateRequisitesPayload, 
    UpdateRequisitesPayload 
} from '@/entities/requisites/types';

export const requisitesApi = {
    getRequisites: async (businessId: string, params: RequisitesParams = {}): Promise<RequisitesResponse> => {
        const response = await axiosInstance.get(`/api/businesses/${businessId}/requisites`, { params });
        return response.data;
    },

    getRequisite: async (businessId: string, requisiteId: string): Promise<Requisites> => {
        const response = await axiosInstance.get(`/api/businesses/${businessId}/requisites/${requisiteId}`);
        return response.data;
    },

    createRequisites: async (businessId: string, payload: CreateRequisitesPayload): Promise<Requisites> => {
        const response = await axiosInstance.post(`/api/businesses/${businessId}/requisites`, payload);
        return response.data;
    },

    updateRequisites: async (businessId: string, requisiteId: string, payload: UpdateRequisitesPayload): Promise<Requisites> => {
        const response = await axiosInstance.put(`/api/businesses/${businessId}/requisites/${requisiteId}`, payload);
        return response.data;
    },

    deleteRequisites: async (businessId: string, requisiteId: string): Promise<void> => {
        await axiosInstance.delete(`/api/businesses/${businessId}/requisites/${requisiteId}`);
    },
};
