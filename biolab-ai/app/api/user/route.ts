import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    const token = request.cookies.get("access_token")?.value;

    if (!token) {
        return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    try {
        const payload = await verifyAccessToken(token);
        let name = "User"; // Default fallback
        try {
            const db = await getDb();
            if (db) {
                const dbUser = await db.prepare("SELECT name FROM users WHERE id = ?").bind(payload.userId).first<{ name: string }>();
                if (dbUser && dbUser.name) {
                    name = dbUser.name;
                }
            }
        } catch (dbError) {
            console.error("Database error fetching user name:", dbError);
        }

        const user = { id: payload.userId, email: payload.email, role: payload.role, name };
        return NextResponse.json({ user });
    } catch {
        return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }
}
