import axiosInstance from './axiosInstance';

export interface Bank {
    id: string;
    bic: string;
    name: string;
}

export interface BanksResponse {
    items: Bank[];
    total: number;
    offset: number;
    limit: number;
}

export interface BanksParams {
    offset?: number;
    limit?: number;
    language?: string;
}

export const banksApi = {
    getBanks: async (params: BanksParams = {}): Promise<BanksResponse> => {
        const { language, ...queryParams } = params;
        const languageHeader = language === 'ru' ? 'ru-RU' : 'en-US';
        
        const response = await axiosInstance.get('/api/directories/banks/entries', { 
            params: queryParams,
            headers: {
                'Accept-Language': languageHeader
            }
        });
        return response.data;
    },
};
