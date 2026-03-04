import { useCallback, useState } from "react";
import axiosInstance from "@/shared/api/axiosInstance";

type UploadState = "idle" | "uploading" | "error";
type Resp = { url: string };

export function useUploadToBlob(container = "promo-images") {
    const [state, setState] = useState<UploadState>("idle");

    const upload = useCallback(async (file: File) => {
        setState("uploading");

        const form = new FormData();
        form.append("file", file);

        try {
            const { data } = await axiosInstance.post<Resp>(
                "/api/storage/upload",
                form,
                {
                    params: { containerName: container },
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            setState("idle");
            return data.url;
        } catch (err) {
            setState("error");
            throw err;
        }
    }, [container]);

    return { upload, state };
}
