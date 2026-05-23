import { NextRequest, NextResponse } from "next/server";
import { buildProtocolResponse, type Protocol, type ProtocolQueryType } from "@/lib/protocol-ai";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as {
            protocol?: Protocol;
            query?: string;
            queryType?: ProtocolQueryType;
        };

        if (!body.protocol?.name || !body.query?.trim()) {
            return NextResponse.json({ error: "Protocol and query are required." }, { status: 400 });
        }

        return NextResponse.json(buildProtocolResponse(body.protocol, body.query, body.queryType || "auto"));
    } catch (error) {
        console.error("Protocol query endpoint error:", error);
        return NextResponse.json({ error: "Failed to process protocol query." }, { status: 500 });
    }
}
