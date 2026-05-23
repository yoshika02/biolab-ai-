import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { queryProtocolAI, type Protocol } from "@/lib/protocol-ai";
import { verify } from "jose";
import { JWT_SECRET } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const cookieHeader = request.headers.get("cookie");
        const accessToken = cookieHeader
            ?.split("; ")
            .find((c) => c.startsWith("access_token="))
            ?.split("=")[1];

        if (!accessToken) {
            return NextResponse.json(
                { error: "Unauthorized - no token" },
                { status: 401 }
            );
        }

        let payload: TokenPayload;
        try {
            const verified = await verify(accessToken, JWT_SECRET);
            payload = verified as TokenPayload;
        } catch (error) {
            return NextResponse.json(
                { error: "Unauthorized - invalid token" },
                { status: 401 }
            );
        }

        const body = (await request.json()) as {
            protocolId: string;
            query: string;
            queryType: "steps" | "reagents" | "instructions" | "summary";
        };

        if (!body.protocolId || !body.query || !body.queryType) {
            return NextResponse.json(
                {
                    error: "Missing required fields: protocolId, query, queryType",
                },
                { status: 400 }
            );
        }

        const db = await getDb();

        // Fetch protocol from localStorage-like storage or database
        // For now, we'll accept protocol data in the request
        // In production, fetch from database: const protocol = await db.prepare(...).bind(body.protocolId).first()

        // Parse protocol from request or fetch from DB
        let protocol: Protocol;
        if ("protocol" in body) {
            protocol = (body as Record<string, unknown>).protocol as Protocol;
        } else {
            // Fetch from DB if implemented
            return NextResponse.json(
                { error: "Protocol not found" },
                { status: 404 }
            );
        }

        // Query the AI
        const aiResponse = await queryProtocolAI(
            protocol,
            body.query,
            body.queryType
        );

        // Store the query in database for audit trail
        try {
            await db
                .prepare(
                    "INSERT INTO protocol_queries (id, protocol_id, user_id, query_type, query_text, ai_response, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
                )
                .bind(
                    crypto.randomUUID(),
                    body.protocolId,
                    payload.userId,
                    body.queryType,
                    body.query,
                    aiResponse.content,
                    new Date().toISOString()
                )
                .run();
        } catch (dbError) {
            console.warn("Failed to store protocol query in DB:", dbError);
            // Continue even if DB store fails
        }

        return NextResponse.json(aiResponse);
    } catch (error) {
        console.error("Protocol query endpoint error:", error);
        return NextResponse.json(
            { error: "Failed to process protocol query" },
            { status: 500 }
        );
    }
}
