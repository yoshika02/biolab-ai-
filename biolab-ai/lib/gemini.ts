// Client-side Gemini AI helper
// Uses NEXT_PUBLIC_GEMINI_API_KEY which is baked into the bundle at build time.
// Fallback to window.localStorage to support 100% reliable direct-key configuration.

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export function getStoredApiKey(): string {
    if (typeof window !== "undefined") {
        return window.localStorage.getItem("biolab.gemini_key") || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    }
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
}

export function setStoredApiKey(key: string) {
    if (typeof window !== "undefined") {
        if (key.trim()) {
            window.localStorage.setItem("biolab.gemini_key", key.trim());
        } else {
            window.localStorage.removeItem("biolab.gemini_key");
        }
    }
}

export async function callGemini(prompt: string): Promise<string> {
    const apiKey = getStoredApiKey();

    if (!apiKey) {
        throw new Error("API_KEY_MISSING");
    }

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
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
        const errText = await response.text();
        console.error("Gemini error:", errText);
        throw new Error(`AI service error (${response.status}). Please check your API key.`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!text) throw new Error("AI returned an empty response.");
    return text;
}
