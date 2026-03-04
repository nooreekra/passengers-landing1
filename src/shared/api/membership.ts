import axiosInstance from "@/shared/api/axiosInstance";
import {
    CreateMembershipRequestPayload,
    MembershipDecision,
    MembershipRequest,
    Paginated,
} from "@/entities/membership/types";

export async function fetchMembershipRequests(
    businessId: string,
    offset = 0,
    limit = 20
): Promise<Paginated<MembershipRequest>> {
    const { data } = await axiosInstance.get(
        `/api/businesses/${businessId}/membership-requests`,
        { params: { offset, limit } }
    );
    return data;
}

export async function fetchMembershipRequest(
    businessId: string,
    requestId: string
): Promise<MembershipRequest> {
    const { data } = await axiosInstance.get(
        `/api/businesses/${businessId}/membership-requests/${requestId}`
    );
    return data;
}

export async function decideMembershipRequest(
    businessId: string,
    requestId: string,
    payload: MembershipDecision
): Promise<void> {
    await axiosInstance.patch(
        `/api/businesses/${businessId}/membership-requests/${requestId}/decision`,
        payload
    );
}

export async function fetchMyMembershipRequests(
    offset = 0,
    limit = 100
): Promise<Paginated<MembershipRequest>> {
    const { data } = await axiosInstance.get(`/api/membership-requests/me`, {
        params: { offset, limit },
    });
    return data;
}

export async function createMyMembershipRequest(
    payload: CreateMembershipRequestPayload
): Promise<MembershipRequest> {
    const { data } = await axiosInstance.post(
        `/api/membership-requests/me`,
        payload
    );
    return data;
}

export async function cancelMyMembershipRequest(requestId: string): Promise<void> {
    await axiosInstance.patch(
        `/api/membership-requests/${requestId}/me/cancel`
    );
}

export async function createMembershipRequest(payload: CreateMembershipRequestPayload) {
    const { data } = await axiosInstance.post(`/api/membership-requests`, payload);
    return data;
}
