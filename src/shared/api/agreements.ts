import axiosInstance from './axiosInstance';

export interface Agreement {
    id: string;
    title: string;
    content: string;
    version: string;
    createdAt: string;
    updatedAt: string;
    entityType: 'Business' | 'User';
}

export const agreementsApi = {
    getAgreements: async (entityType: 'Business' | 'User'): Promise<Agreement[]> => {
        const response = await axiosInstance.get<Agreement[]>(`/api/agreements/${entityType}`);
        return response.data;
    }
};

