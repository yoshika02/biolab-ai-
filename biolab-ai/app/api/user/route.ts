import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    const token = request.cookies.get("access_token")?.value;

    if (!token) {
        return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    try {
        const payload = await verifyAccessToken(token);
        const user = { id: payload.userId, email: payload.email, role: payload.role };
        return NextResponse.json({ user });
    } catch {
        return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }
}
