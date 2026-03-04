import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

export function usePermission(code: string) {
    const user = useSelector((s: RootState) => s.user.current);
    return useMemo(() => {
        const perms = (user?.role?.permissions ?? {}) as Record<string, string>;
        return Object.values(perms).includes(code);
    }, [user, code]);
}
