import axiosInstance from "@/shared/api/axiosInstance";
import type { UUID } from "@/entities/branchTypes/types";
import type { BranchType, UpsertBranchTypePayload } from "@/entities/branchTypes/types";

export async function getBranchTypes(businessId: UUID): Promise<BranchType[]> {
    const { data } = await axiosInstance.get<BranchType[]>(
        `/api/businesses/${businessId}/branch-types`
    );
    return data;
}

export async function createBranchType(
    businessId: UUID,
    payload: UpsertBranchTypePayload
): Promise<BranchType> {
    const { data } = await axiosInstance.post<BranchType>(
        `/api/businesses/${businessId}/branch-types`,
        payload
    );
    return data;
}

export async function updateBranchType(
    businessId: UUID,
    typeId: UUID,
    payload: UpsertBranchTypePayload
): Promise<BranchType> {
    const { data } = await axiosInstance.put<BranchType>(
        `/api/businesses/${businessId}/branch-types/${typeId}`,
        payload
    );
    return data;
}

export async function deleteBranchType(
    businessId: UUID,
    typeId: UUID
): Promise<void> {
    await axiosInstance.delete(`/api/businesses/${businessId}/branch-types/${typeId}`);
}
