import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export async function POST(request: NextRequest) {
    try {
        if (!GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "AI service not configured. Please add GEMINI_API_KEY to your environment variables." },
                { status: 503 }
            );
        }

        const body = await request.json();
        const { prompt } = body as { prompt: string };

        if (!prompt?.trim()) {
            return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
        }

        const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 2048,
                },
            }),
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error("Gemini API error:", errBody);
            return NextResponse.json({ error: "AI service returned an error. Check your API key." }, { status: 502 });
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        if (!text) {
            return NextResponse.json({ error: "AI returned an empty response." }, { status: 502 });
        }

        return NextResponse.json({ result: text });
    } catch (error) {
        console.error("AI route error:", error);
        return NextResponse.json({ error: "Failed to reach AI service." }, { status: 500 });
    }
}
