import axiosInstance from "@/shared/api/axiosInstance";

export interface DemoRequestPayload {
    companyName: string;
    firstName: string;
    lastName: string;
    department: string;
    jobTitle: string;
    email: string;
}

export const sendDemoRequest = async (payload: DemoRequestPayload) => {
    const { data } = await axiosInstance.post(
        "/api/demo-requests",
        payload,
        { headers: { "Content-Type": "application/json" } }
    );
    return data;
};
