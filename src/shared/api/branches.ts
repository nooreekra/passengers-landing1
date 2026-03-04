import axiosInstance from "@/shared/api/axiosInstance";
import { Branch, UpsertBranchPayload } from "@/entities/branches/types";
import type { UUID } from "@/entities/branches/types";

export async function getBranches(businessId: UUID): Promise<Branch[]> {
    const { data } = await axiosInstance.get<Branch[]>(
        `/api/businesses/${businessId}/branches`
    );
    return data;
}

export async function getBranch(businessId: UUID, branchId: UUID): Promise<Branch> {
    const { data } = await axiosInstance.get<Branch>(
        `/api/businesses/${businessId}/branches/${branchId}`
    );
    return data;
}

export async function getBranchesByCity(businessId: UUID, cityId: string): Promise<Branch[]> {
    const { data } = await axiosInstance.get<Branch[]>(
        `/api/businesses/${businessId}/branches?cityId=${cityId}`
    );
    return data;
}

export async function createBranch(
    businessId: UUID,
    payload: UpsertBranchPayload
): Promise<Branch> {
    const { data } = await axiosInstance.post<Branch>(
        `/api/businesses/${businessId}/branches`,
        payload
    );
    return data;
}

export async function updateBranch(
    businessId: UUID,
    branchId: UUID,
    payload: UpsertBranchPayload
): Promise<Branch> {
    const { data } = await axiosInstance.put<Branch>(
        `/api/businesses/${businessId}/branches/${branchId}`,
        payload
    );
    return data;
}

export async function deleteBranch(
    businessId: UUID,
    branchId: UUID
): Promise<void> {
    await axiosInstance.delete(`/api/businesses/${businessId}/branches/${branchId}`);
}
