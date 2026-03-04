"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardNotFound() {
    const router = useRouter();

    return (
        <div className="flex-1 flex items-center justify-center p-10">
            <div className="text-center space-y-4">
                <div className="text-5xl font-semibold">404</div>
                <p className="opacity-70">Section not found inside Dashboard.</p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 rounded-xl bg-black/5 hover:bg-black/10"
                    >
                        Go back
                    </button>
                    <Link
                        href="/dashboard"
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                    >
                        Dashboard home
                    </Link>
                </div>
            </div>
        </div>
    );
}
