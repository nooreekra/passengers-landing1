"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const STORAGE_KEY = "lastActivityAt";
const CHANNEL = "idle-activity";

type Props = {
    idleMinutes?: number;
    logoutPath?: string;
    skipPaths?: string[];
};

export default function IdleLogout({
                                       idleMinutes,
                                       logoutPath,
                                       skipPaths = ["/"],
                                   }: Props) {
    const router = useRouter();
    const pathname = usePathname();

    const idleMs = useMemo(() => {
        const fromEnv = Number(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MIN || "30");
        return (idleMinutes ?? fromEnv) * 60 * 1000;
    }, [idleMinutes]);

    const target = useMemo(
        () => logoutPath ?? process.env.NEXT_PUBLIC_LOGOUT_PATH ?? "/",
        [logoutPath]
    );

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const bcRef   = useRef<BroadcastChannel | null>(null);

    const markActivity = () => {
        try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {}
        if (bcRef.current) bcRef.current.postMessage("ping");
        resetTimer();
    };

    const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(handleTimeout, idleMs);
    };

    const handleTimeout = () => {
        const isSkipped = skipPaths.some((p) => pathname?.startsWith(p));
        if (isSkipped) return;

        try {
            localStorage.removeItem("access_token");
            sessionStorage.removeItem("access_token");
        } catch {}

        router.replace(target);
    };

    useEffect(() => {
        // Канал для синхронизации между вкладками
        const bc = new BroadcastChannel(CHANNEL);
        bcRef.current = bc;
        bc.onmessage = (msg) => {
            if (msg.data === "ping") resetTimer();
        };

        markActivity();

        const onStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) resetTimer();
        };

        const onActivity = () => markActivity();
        const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "visibilitychange"];

        events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));
        window.addEventListener("storage", onStorage);

        const interval = setInterval(() => {
            const last = Number(localStorage.getItem(STORAGE_KEY) || "0");
            if (last && Date.now() - last >= idleMs) handleTimeout();
        }, 15000);

        return () => {
            events.forEach((ev) => window.removeEventListener(ev, onActivity));
            window.removeEventListener("storage", onStorage);
            clearInterval(interval);
            if (timerRef.current) clearTimeout(timerRef.current);
            bc.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idleMs, pathname, target]);

    return null;
}
