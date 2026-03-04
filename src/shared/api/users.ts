import axiosInstance from "@/shared/api/axiosInstance";
import type { UUID } from "@/entities/users/types";
import type { User, UpsertUserPayload } from "@/entities/users/types";

export async function getUsers(businessId: UUID): Promise<User[]> {
    const { data } = await axiosInstance.get<User[]>(
        `/api/businesses/${businessId}/users`
    );
    return data;
}

export async function createUser(businessId: UUID, payload: UpsertUserPayload): Promise<User> {
    const { data } = await axiosInstance.post<User>(
        `/api/businesses/${businessId}/users`,
        payload
    );
    return data;
}

export async function updateUser(businessId: UUID, userId: UUID, payload: UpsertUserPayload): Promise<User> {
    const { data } = await axiosInstance.put<User>(
        `/api/businesses/${businessId}/users/${userId}`,
        payload
    );
    return data;
}

export async function getUser(businessId: UUID, userId: UUID): Promise<User> {
    const { data } = await axiosInstance.get<User>(
        `/api/businesses/${businessId}/users/${userId}`
    );
    return data;
}

export async function deleteUser(businessId: UUID, userId: UUID): Promise<void> {
    await axiosInstance.delete(`/api/businesses/${businessId}/users/${userId}`);
}
