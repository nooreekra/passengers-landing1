import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const ALLOWED_BY_ROLE: Record<string, string[]> = {
    Airline: ["/dashboard/airline"],
    TravelAgency: ["/dashboard/agency"],
    TravelAgent: ["/dashboard/agent"],
    Partnership: ["/dashboard/partnership"],
    Passenger: ["/passenger"],
};

async function readRole(req: NextRequest) {
    const role = req.cookies.get("role")?.value;
    if (role) return role;

    const token = req.cookies.get("accessToken")?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(process.env.JWT_SECRET!)
        );
        return (payload as any).role?.type || (payload as any).role;
    } catch {
        return null;
    }
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Обработка маршрута /passenger
    if (pathname.startsWith("/passenger")) {
        const role = await readRole(req);
        if (!role || (role !== "Passenger")) {
            const url = req.nextUrl.clone();
            url.pathname = "/";
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    }

    if (!pathname.startsWith("/dashboard")) return NextResponse.next();

    const role = await readRole(req);

    if (!role) {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    const allowed = ALLOWED_BY_ROLE[role] ?? [];
    const canEnter = allowed.some((p) => pathname.startsWith(p));

    if (!canEnter) {
        const url = req.nextUrl.clone();
        url.pathname = allowed[0] ?? "/";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/passenger/:path*"],
};
