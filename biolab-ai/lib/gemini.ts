// Client and Server-side AI Helper configured exclusively for OpenRouter Llama models.
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ============================================================================
// OpenRouter API Key & Model Helpers
// ============================================================================
export function getStoredOpenRouterKey(): string {
    if (typeof window !== "undefined") {
        return window.localStorage.getItem("biolab.openrouter_key") || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "";
    }
    return process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "";
}

export function setStoredOpenRouterKey(key: string) {
    if (typeof window !== "undefined") {
        if (key.trim()) {
            window.localStorage.setItem("biolab.openrouter_key", key.trim());
        } else {
            window.localStorage.removeItem("biolab.openrouter_key");
        }
    }
}

export function getStoredLlamaModel(): string {
    if (typeof window !== "undefined") {
        return window.localStorage.getItem("biolab.llama_model") || "meta-llama/llama-3.3-70b-instruct";
    }
    return process.env.LLAMA_MODEL || "meta-llama/llama-3.3-70b-instruct";
}

export function setStoredLlamaModel(model: string) {
    if (typeof window !== "undefined") {
        window.localStorage.setItem("biolab.llama_model", model);
    }
}

// Backward compatibility fallbacks
export function getStoredApiKey(): string {
    return getStoredOpenRouterKey();
}

export function setStoredApiKey(key: string) {
    setStoredOpenRouterKey(key);
}

// ============================================================================
// Direct OpenRouter Caller
// ============================================================================
export async function callLlamaDirect(
    prompt: string,
    apiKey: string,
    model: string = "meta-llama/llama-3.3-70b-instruct"
): Promise<string> {
    const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
            "X-Title": "BioLab AI"
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.4,
        }),
    });

    if (!response.ok) {
        let errMessage = `AI service error (${response.status}).`;
        try {
            const errJson = await response.json();
            if (errJson?.error?.message) {
                errMessage = `AI service error: ${errJson.error.message}`;
            } else {
                errMessage = `AI service error: ${JSON.stringify(errJson)}`;
            }
        } catch {
            const errText = await response.text();
            if (errText) errMessage = `AI service error: ${errText.slice(0, 150)}`;
        }
        console.error("OpenRouter direct error:", errMessage);
        throw new Error(errMessage);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || "";
    if (!text) throw new Error("AI returned an empty response.");
    return text;
}

// ============================================================================
// Core Unified API Orchestrator (calling OpenRouter directly)
// ============================================================================
export async function callGemini(prompt: string): Promise<string> {
    const openrouterKey = getStoredOpenRouterKey();
    if (!openrouterKey) {
        throw new Error("API_KEY_MISSING");
    }
    return await callLlamaDirect(prompt, openrouterKey, getStoredLlamaModel());
}
