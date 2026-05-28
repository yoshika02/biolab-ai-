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
        let userData: Record<string, any> = {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
            name: "User",
            phone: "",
            department: "",
            institution: ""
        };

        try {
            const db = await getDb();
            if (db) {
                const dbUser = await db.prepare("SELECT name, email, phone, department, institution, role FROM users WHERE id = ?").bind(payload.userId).first<any>();
                if (dbUser) {
                    userData = {
                        id: payload.userId,
                        name: dbUser.name || "User",
                        email: dbUser.email || payload.email,
                        phone: dbUser.phone || "",
                        department: dbUser.department || "",
                        institution: dbUser.institution || "",
                        role: dbUser.role || payload.role
                    };
                }
            }
        } catch (dbError) {
            console.error("Database error fetching user details:", dbError);
        }

        return NextResponse.json({ user: userData });
    } catch {
        return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }
}
