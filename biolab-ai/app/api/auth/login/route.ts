import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { comparePassword, issueAccessToken, issueRefreshToken, hashToken, type TokenPayload } from "@/lib/auth";
import { AUTH_COOKIE_OPTIONS, REFRESH_TOKEN_MAX_AGE, ACCESS_TOKEN_MAX_AGE } from "@/lib/constants";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    // Read raw body for debugging and robust parsing
    try {
        const raw = await request.text();
        let body: Record<string, unknown> | null = null;
        try {
            body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        } catch (err) {
            console.error('Invalid JSON body received at /api/auth/login:', raw);
            return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
        }
        const email = typeof body?.email === 'string' ? body.email : '';
        const password = typeof body?.password === 'string' ? body.password : '';

        const db = await getDb();

        const user = await db.prepare(
            "SELECT id, email, role, password_hash FROM users WHERE email = ?"
        ).bind(email).first<{
            id: string;
            email: string;
            role: string;
            password_hash: string;
        }>();
        if (!user) {
            return NextResponse.json({ error: "Unregistered email." }, { status: 401 });
        }

        const passwordValid = await comparePassword(password, user.password_hash);
        if (!passwordValid) {
            return NextResponse.json({ error: "Wrong password." }, { status: 401 });
        }

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
    } catch (error) {
        console.error('Login route error:', error);
        return NextResponse.json({ error: 'Server error.' }, { status: 500 });
    }
}
