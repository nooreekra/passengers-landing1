export type MembershipStatus = "Pending" | "Approved" | "Rejected";

export type MembershipRequest = {
    id: string;
    userId: string;
    businessId: string;
    branchId?: string | null;
    status: MembershipStatus;
    createdAt: string;
    decidedAt?: string | null;
    decidedBy?: string | null;
    decisionReason?: string | null;
    comment?: string | null;
    firstName: string;
    lastName: string;
    email: string;
};

export type CreateMembershipRequestPayload = {
    businessId: string;
    branchId?: string | null;
    roleId?: string | null;
    structureId?: string | null;
    comment?: string | null;
};

export type MembershipDecision = {
    status: "Approved" | "Rejected";
    roleId?: string | null;
    branchId?: string | null;
    structureId?: string | null;
    reason?: string | null;
};

export type Paginated<T> = {
    items: T[];
    total: number;
    offset: number;
    limit: number;
};