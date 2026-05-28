// Client and Server-side AI Helper
// Supports Google Gemini and Meta Llama (via OpenRouter) with automatic fallback resilience.

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ============================================================================
// Google Gemini API Key Helpers
// ============================================================================
export function getStoredApiKey(): string {
    if (typeof window !== "undefined") {
        return window.localStorage.getItem("biolab.gemini_key") || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    }
    return process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
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

// ============================================================================
// OpenRouter API Key Helpers
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

// ============================================================================
// Engine Engine Configurations & Settings
// ============================================================================
export function getStoredPrimaryProvider(): "gemini" | "llama" {
    if (typeof window !== "undefined") {
        return (window.localStorage.getItem("biolab.primary_provider") as "gemini" | "llama") || "gemini";
    }
    return (process.env.PRIMARY_PROVIDER as "gemini" | "llama") || "gemini";
}

export function setStoredPrimaryProvider(provider: "gemini" | "llama") {
    if (typeof window !== "undefined") {
        window.localStorage.setItem("biolab.primary_provider", provider);
    }
}

export function getStoredEnableFallback(): boolean {
    if (typeof window !== "undefined") {
        const val = window.localStorage.getItem("biolab.enable_fallback");
        return val === null ? true : val === "true";
    }
    return process.env.ENABLE_FALLBACK !== "false";
}

export function setStoredEnableFallback(enable: boolean) {
    if (typeof window !== "undefined") {
        window.localStorage.setItem("biolab.enable_fallback", String(enable));
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

// ============================================================================
// Direct API Callers
// ============================================================================

export async function callGeminiDirect(prompt: string, apiKey: string): Promise<string> {
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
        let errMessage = `Gemini service error (${response.status}).`;
        try {
            const errJson = await response.json();
            if (errJson?.error?.message) {
                errMessage = `Gemini service error: ${errJson.error.message}`;
            } else {
                errMessage = `Gemini service error: ${JSON.stringify(errJson)}`;
            }
        } catch {
            const errText = await response.text();
            if (errText) errMessage = `Gemini service error: ${errText.slice(0, 150)}`;
        }
        console.error("Gemini direct error:", errMessage);
        throw new Error(errMessage);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!text) throw new Error("Gemini returned an empty response.");
    return text;
}

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
        let errMessage = `Llama service error (${response.status}).`;
        try {
            const errJson = await response.json();
            if (errJson?.error?.message) {
                errMessage = `Llama service error: ${errJson.error.message}`;
            } else {
                errMessage = `Llama service error: ${JSON.stringify(errJson)}`;
            }
        } catch {
            const errText = await response.text();
            if (errText) errMessage = `Llama service error: ${errText.slice(0, 150)}`;
        }
        console.error("Llama direct error:", errMessage);
        throw new Error(errMessage);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || "";
    if (!text) throw new Error("Llama returned an empty response.");
    return text;
}

// ============================================================================
// Core Unified API Orchestrator (with Smart Fallback retry)
// ============================================================================
export async function callGemini(prompt: string): Promise<string> {
    const primary = getStoredPrimaryProvider();
    const fallbackEnabled = getStoredEnableFallback();

    const geminiKey = getStoredApiKey();
    const openrouterKey = getStoredOpenRouterKey();

    if (primary === "gemini") {
        try {
            if (!geminiKey) {
                throw new Error("API_KEY_MISSING");
            }
            return await callGeminiDirect(prompt, geminiKey);
        } catch (err) {
            const isKeyMissing = err instanceof Error && err.message === "API_KEY_MISSING";
            if (fallbackEnabled && openrouterKey) {
                console.warn(`Gemini call failed (${err instanceof Error ? err.message : String(err)}). Falling back to OpenRouter Llama...`);
                try {
                    return await callLlamaDirect(prompt, openrouterKey, getStoredLlamaModel());
                } catch (fallbackErr) {
                    throw new Error(`Primary Gemini failed (${err instanceof Error ? err.message : String(err)}). Fallback Llama also failed: ${fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)}`);
                }
            }
            throw isKeyMissing ? new Error("API_KEY_MISSING") : err;
        }
    } else {
        try {
            if (!openrouterKey) {
                throw new Error("API_KEY_MISSING");
            }
            return await callLlamaDirect(prompt, openrouterKey, getStoredLlamaModel());
        } catch (err) {
            const isKeyMissing = err instanceof Error && err.message === "API_KEY_MISSING";
            if (fallbackEnabled && geminiKey) {
                console.warn(`Llama call failed (${err instanceof Error ? err.message : String(err)}). Falling back to Gemini...`);
                try {
                    return await callGeminiDirect(prompt, geminiKey);
                } catch (fallbackErr) {
                    throw new Error(`Primary Llama failed (${err instanceof Error ? err.message : String(err)}). Fallback Gemini also failed: ${fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)}`);
                }
            }
            throw isKeyMissing ? new Error("API_KEY_MISSING") : err;
        }
    }
}
