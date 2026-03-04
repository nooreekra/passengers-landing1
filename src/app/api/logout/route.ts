import { NextResponse } from "next/server";

export async function POST() {
    const res = NextResponse.json({ ok: true });

    const opts = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
    res.cookies.set("accessToken", "", { ...opts, maxAge: 0 });
    res.cookies.set("role", "", { ...opts, maxAge: 0 });

    return res;
}
