import axiosInstance from "@/shared/api/axiosInstance";
import type { UUID } from "@/entities/roles/types";
import type { Role, UpsertRolePayload } from "@/entities/roles/types";

export async function getRoles(businessId: UUID): Promise<Role[]> {
    const { data } = await axiosInstance.get<Role[]>(
        `/api/businesses/${businessId}/roles`
    );
    return data;
}

export async function getRole(businessId: UUID, roleId: UUID): Promise<Role> {
    const { data } = await axiosInstance.get<Role>(
        `/api/businesses/${businessId}/roles/${roleId}`
    );
    return data;
}

export async function createRole(businessId: UUID, payload: UpsertRolePayload): Promise<Role> {
    const { data } = await axiosInstance.post<Role>(
        `/api/businesses/${businessId}/roles`,
        payload
    );
    return data;
}

export async function updateRole(businessId: UUID, roleId: UUID, payload: UpsertRolePayload): Promise<Role> {
    const { data } = await axiosInstance.put<Role>(
        `/api/businesses/${businessId}/roles/${roleId}`,
        payload
    );
    return data;
}

export async function deleteRole(businessId: UUID, roleId: UUID): Promise<void> {
    await axiosInstance.delete(`/api/businesses/${businessId}/roles/${roleId}`);
}

// Directory entries API for airline positions
export interface PositionEntry {
    id: string;
    directoryId: string;
    code: string;
    name: string;
    description: string | null;
}

export interface PositionEntriesResponse {
    items: PositionEntry[];
    total: number;
    offset: number;
    limit: number;
}

export const getAirlinePositions = async (
    language: string = 'en',
    limit: number = 100,
    offset: number = 0
): Promise<PositionEntriesResponse> => {
    const languageHeader = language === 'ru' ? 'ru-RU' : 'en-US';
    const { data } = await axiosInstance.get<PositionEntriesResponse>(
        `/api/directories/airline-positions/entries?limit=${limit}&offset=${offset}`,
        {
            headers: {
                'Accept-Language': languageHeader
            }
        }
    );
    return data;
};