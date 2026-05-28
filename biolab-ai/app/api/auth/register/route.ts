import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword, issueAccessToken, issueRefreshToken, hashToken, type TokenPayload } from "@/lib/auth";
import { AUTH_COOKIE_OPTIONS, REFRESH_TOKEN_MAX_AGE, ACCESS_TOKEN_MAX_AGE } from "@/lib/constants";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const { name, email, phone, department, institution, role, password } = await request.json();
        const normalizedRole = typeof role === "string" ? role.toLowerCase() : "student";

        if (typeof name !== "string" || !/^[A-Za-z. ]+$/.test(name.trim())) {
            return NextResponse.json({ error: "Name can contain alphabets and spaces only." }, { status: 400 });
        }

        if (typeof email !== "string" || !email.includes("@")) {
            return NextResponse.json({ error: "Email must include @." }, { status: 400 });
        }

        if (typeof phone !== "string" || phone.trim().length < 7) {
            return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
        }

        if (!["student", "researcher", "lab_assistant", "professor"].includes(normalizedRole)) {
            return NextResponse.json({ error: "Invalid role selected." }, { status: 400 });
        }

        const db = await getDb();

        // Check if email already exists
        const existingUser = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
        if (existingUser) {
            return NextResponse.json({ error: "Email already in use." }, { status: 409 });
        }

        // Create user
        const user = { id: crypto.randomUUID(), email, role: normalizedRole };
        const passwordHash = await hashPassword(password);
        await db.prepare(
            "INSERT INTO users (id, name, email, phone, password_hash, department, institution, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(user.id, name.trim(), email, phone.trim(), passwordHash, department ?? null, institution ?? null, normalizedRole).run();

        const payload: TokenPayload = { userId: user.id, email: user.email, role: user.role };
        const accessToken = await issueAccessToken(payload);
        const refreshToken = await issueRefreshToken(payload);
        const hashedRefreshToken = await hashToken(refreshToken);

        const ipAddress = request.headers.get("x-forwarded-for") ?? "";
        await db.prepare(
            "INSERT INTO sessions (id, user_id, token, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(
            crypto.randomUUID(),
            user.id,
            hashedRefreshToken,
            new Date(Date.now() + REFRESH_TOKEN_MAX_AGE * 1000).toISOString(),
            ipAddress,
            request.headers.get("user-agent") ?? ""
        ).run();

        const response = NextResponse.json({ success: true });
        response.cookies.set("access_token", accessToken, {
            ...AUTH_COOKIE_OPTIONS,
            maxAge: ACCESS_TOKEN_MAX_AGE,
        });
        response.cookies.set("refresh_token", refreshToken, {
            ...AUTH_COOKIE_OPTIONS,
            maxAge: REFRESH_TOKEN_MAX_AGE,
        });

        return response;
    } catch (err) {
        console.error('Register route error:', err);
        return NextResponse.json({ error: 'Server error.' }, { status: 500 });
    }
}
