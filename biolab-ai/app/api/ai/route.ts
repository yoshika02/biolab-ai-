import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
        const primaryProvider = process.env.PRIMARY_PROVIDER || "gemini";

        const body = await request.json();
        const { prompt } = body as { prompt: string };

        if (!prompt?.trim()) {
            return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
        }

        if (primaryProvider === "gemini" && !GEMINI_API_KEY && !OPENROUTER_API_KEY) {
            return NextResponse.json(
                { error: "AI service not configured. Add GEMINI_API_KEY or OPENROUTER_API_KEY to your environment variables." },
                { status: 503 }
            );
        }
        if (primaryProvider === "llama" && !OPENROUTER_API_KEY && !GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "AI service not configured. Add OPENROUTER_API_KEY or GEMINI_API_KEY to your environment variables." },
                { status: 503 }
            );
        }

        const text = await callGemini(prompt);

        if (!text) {
            return NextResponse.json({ error: "AI returned an empty response." }, { status: 502 });
        }

        return NextResponse.json({ result: text });
    } catch (error) {
        console.error("AI route error:", error);
        return NextResponse.json(
            { error: `Failed to reach AI service: ${error instanceof Error ? error.message : "AI service unavailable"}` },
            { status: 500 }
        );
    }
}
