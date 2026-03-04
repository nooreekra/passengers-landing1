"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
    const router = useRouter();

    return (
        <main className="min-h-screen flex items-center justify-center bg-black text-white">
            <div className="text-center space-y-6">
                <div className="text-6xl font-bold">404</div>
                <p className="text-lg opacity-80">This page could not be found.</p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
                    >
                        Go back
                    </button>
                    <Link
                        href="/"
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700"
                    >
                        Go home
                    </Link>
                </div>
            </div>
        </main>
    );
}
