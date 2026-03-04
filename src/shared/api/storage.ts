import axiosInstance from "@/shared/api/axiosInstance";

export async function uploadToStorage(
    file: File,
    containerName = process.env.NEXT_PUBLIC_STORAGE_CONTAINER || "logos"
): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);

    const { data } = await axiosInstance.post(
        `/api/storage/upload?containerName=${encodeURIComponent(containerName)}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
    );

    if (typeof data === "string") return data;
    return data?.url || data?.uri || data?.location || "";
}
