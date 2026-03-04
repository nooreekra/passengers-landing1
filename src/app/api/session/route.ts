import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { accessToken, role } = await req.json();

    const res = NextResponse.json({ ok: true });

    const cookieOpts = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
    };

    res.cookies.set("accessToken", accessToken, cookieOpts);
    res.cookies.set("role", role, cookieOpts);

    return res;
}
