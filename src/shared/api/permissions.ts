import axiosInstance from "@/shared/api/axiosInstance";
import type { UUID } from "@/entities/permissions/types";
import type { Permission } from "@/entities/permissions/types";

export async function getPermissions(businessId: UUID): Promise<Permission[]> {
    const { data } = await axiosInstance.get<Permission[]>(
        `/api/businesses/${businessId}/permissions`
    );
    return data;
}
