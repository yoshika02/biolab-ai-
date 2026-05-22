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
    const { env } = await getCloudflareContext({ async: true });
    return env.DB;
}
