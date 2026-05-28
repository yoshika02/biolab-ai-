import { NextRequest, NextResponse } from "next/server";
import type { Protocol, ProtocolQueryType } from "@/lib/protocol-ai";

export const dynamic = "force-dynamic";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

async function callGemini(prompt: string, apiKey: string): Promise<string> {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
        }),
    });
    if (!response.ok) {
        const err = await response.text();
        console.error("Gemini error:", err);
        throw new Error(`Gemini API error ${response.status}`);
    }
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function POST(request: NextRequest) {
    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

        const body = (await request.json()) as {
            protocol?: Protocol;
            query?: string;
            queryType?: ProtocolQueryType;
        };

        if (!body.protocol?.name || !body.query?.trim()) {
            return NextResponse.json({ error: "Protocol and query are required." }, { status: 400 });
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: "AI service not configured. Add GEMINI_API_KEY to your environment." }, { status: 503 });
        }

        const protocol = body.protocol;
        const steps = (protocol.steps || [])
            .map((s, i) => `${i + 1}. ${s.instruction}${s.duration_min ? ` (${s.duration_min} min)` : ""}${s.notes ? ` — ${s.notes}` : ""}`)
            .join("\n");
        const reagents = (protocol.reagents || [])
            .map((r) => `- ${r.name}${r.quantity ? ` ${r.quantity}${r.unit || ""}` : ""}${r.supplier ? ` (${r.supplier})` : ""}`)
            .join("\n");

        const prompt = `You are an expert biomedical lab assistant helping a researcher with their lab protocol.

Protocol Name: ${protocol.name}
${protocol.objective ? `Objective: ${protocol.objective}` : ""}
${protocol.sampleType ? `Sample Type: ${protocol.sampleType}` : ""}
${protocol.description ? `Description: ${protocol.description}` : ""}
${steps ? `\nProtocol Steps:\n${steps}` : "No steps defined yet."}
${reagents ? `\nReagents/Materials:\n${reagents}` : "No reagents defined yet."}

User Question: ${body.query}

Provide a thorough, structured, practical answer. Use ## headings, bullet points (- ), and numbered lists where appropriate. Be specific to this protocol.`;

        const content = await callGemini(prompt, GEMINI_API_KEY);

        return NextResponse.json({ type: "instructions", content });
    } catch (error) {
        console.error("Protocol query endpoint error:", error);
        return NextResponse.json({ error: "Failed to generate AI response. Check your GEMINI_API_KEY." }, { status: 500 });
    }
}
