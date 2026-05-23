import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    const email = request.nextUrl.searchParams.get("email");

    if (!email) {
        return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    return NextResponse.json({ available: !user });
}
