import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
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
        const db = await getDb();
        const { results: logs } = await db.prepare(
            "SELECT id, user_id, action, module, metadata, created_at FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 10"
        ).bind(payload.userId).all();
        return NextResponse.json({ logs });
    } catch {
        return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }
}
