import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const protectedPaths = ["/dashboard", "/api/user"];
const accessTokenSecret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET ?? "dev-access-secret");

function isProtectedPath(pathname: string) {
    return protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

async function verifyAccessToken(token: string) {
    const { payload } = await jwtVerify(token, accessTokenSecret);
    return payload as { userId: string; role: string; email: string };
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (!isProtectedPath(pathname)) {
        return NextResponse.next();
    }

    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    try {
        const payload = await verifyAccessToken(accessToken);
        if (pathname.startsWith("/dashboard/admin") && payload.role !== "admin") {
            return new NextResponse("Forbidden", { status: 403 });
        }
        return NextResponse.next();
    } catch {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }
}

export const config = {
    matcher: ["/dashboard/:path*", "/api/user"],
};
