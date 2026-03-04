import axiosInstance from "@/shared/api/axiosInstance";
import { Structure, StructureType, UpsertStructurePayload, UUID } from "@/entities/structures/types";

export const getStructureTypes = async (businessId: UUID): Promise<StructureType[]> => {
    const { data } = await axiosInstance.get<StructureType[]>(
        `/api/businesses/${businessId}/structure-types`
    );
    return data;
};

export const getStructures = async (businessId: UUID): Promise<Structure[]> => {
    const { data } = await axiosInstance.get<Structure[]>(
        `/api/businesses/${businessId}/structures`
    );
    return data;
};

export const createStructure = async (
    businessId: UUID,
    payload: UpsertStructurePayload
): Promise<Structure> => {
    const { data } = await axiosInstance.post<Structure>(
        `/api/businesses/${businessId}/structures`,
        payload
    );
    return data;
};

export const updateStructure = async (
    businessId: UUID,
    structureId: UUID,
    payload: UpsertStructurePayload
): Promise<Structure> => {
    const { data } = await axiosInstance.put<Structure>(
        `/api/businesses/${businessId}/structures/${structureId}`,
        payload
    );
    return data;
};

export const deleteStructure = async (businessId: UUID, structureId: UUID): Promise<void> => {
    await axiosInstance.delete(`/api/businesses/${businessId}/structures/${structureId}`);
};

// Directory entries API
export interface DirectoryEntry {
    id: string;
    directoryId: string;
    code: string;
    name: string;
    description: string | null;
}

export interface DirectoryEntriesResponse {
    items: DirectoryEntry[];
    total: number;
    offset: number;
    limit: number;
}

export const getDirectoryEntries = async (
    directoryName: 'teams' | 'departments',
    language: string = 'en',
    limit: number = 100,
    offset: number = 0
): Promise<DirectoryEntriesResponse> => {
    const languageHeader = language === 'ru' ? 'ru-RU' : 'en-US';
    const apiPath = directoryName === 'teams' ? 'airline-teams' : 'airline-departments';
    const { data } = await axiosInstance.get<DirectoryEntriesResponse>(
        `/api/directories/${apiPath}/entries?limit=${limit}&offset=${offset}`,
        {
            headers: {
                'Accept-Language': languageHeader
            }
        }
    );
    return data;
};