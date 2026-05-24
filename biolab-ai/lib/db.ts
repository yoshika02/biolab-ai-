import { getCloudflareContext } from "@opennextjs/cloudflare";

declare global {
    interface CloudflareEnv {
        DB: {
            prepare: (query: string) => {
                bind: (...values: unknown[]) => {
                    first: <T = unknown>() => Promise<T | null>;
                    all: <T = unknown>() => Promise<{ results: T[] }>;
                    run: () => Promise<unknown>;
                };
                first: <T = unknown>() => Promise<T | null>;
                all: <T = unknown>() => Promise<{ results: T[] }>;
                run: () => Promise<unknown>;
            };
        };
    }
}

export async function getDb() {
    try {
        const { env } = await getCloudflareContext({ async: true });
        return env.DB;
    } catch {
        // In local dev (npm run dev), Cloudflare context is not available.
        // API routes that call getDb() will receive null and should handle it gracefully.
        if (process.env.NODE_ENV === "development") {
            console.warn("[db.ts] Running in local dev mode — Cloudflare D1 is not available. Use `wrangler dev` for full runtime.");
            return null as unknown as CloudflareEnv["DB"];
        }
        throw new Error("Failed to get Cloudflare context. Ensure you are running via wrangler or deployed on Cloudflare.");
    }
}
