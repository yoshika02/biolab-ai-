import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, issueAccessToken } from "@/lib/auth";
import { ACCESS_TOKEN_MAX_AGE } from "@/lib/constants";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
        return NextResponse.json({ error: "No refresh token." }, { status: 401 });
    }

    try {
        const payload = await verifyRefreshToken(refreshToken);
        const newAccessToken = await issueAccessToken(payload);

        const response = NextResponse.json({ success: true });
        response.cookies.set("access_token", newAccessToken, {
            maxAge: ACCESS_TOKEN_MAX_AGE,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        return response;
    } catch {
        return NextResponse.json({ error: "Invalid refresh token." }, { status: 401 });
    }
}
