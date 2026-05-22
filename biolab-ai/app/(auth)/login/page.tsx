'use client';

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { api } from "@/lib/api";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event?: React.MouseEvent<HTMLButtonElement> | React.FormEvent<HTMLFormElement>) {
        if (event && 'preventDefault' in event) event.preventDefault();
        setLoading(true);
        setError(null);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(api.auth.login, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
                signal: controller.signal,
            });

            let body: Record<string, unknown> | null = null;
            try {
                body = (await response.json()) as Record<string, unknown>;
            } catch {
                body = null;
            }

            if (!response.ok) {
                const errMsg = body && typeof body.error === 'string' ? body.error : "Unable to sign in.";
                setError(errMsg);
                return;
            }

            // Success — navigate
            window.location.href = "/dashboard";
        } catch (err: unknown) {
            const e = err as { name?: string };
            if (e?.name === 'AbortError') {
                setError('Request timed out. Please try again.');
            } else {
                setError('Network error. Please try again.');
            }
        } finally {
            clearTimeout(timeout);
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-16">
            <div className="w-full rounded-3xl border border-slate-200 bg-white p-10 shadow-xl sm:p-12">
                <div className="space-y-2 text-center">
                    <p className="text-sm uppercase tracking-[0.32em] text-teal-700">BioLab AI</p>
                    <h1 className="text-3xl font-semibold text-slate-950">Sign in to your account</h1>
                    <p className="text-sm text-slate-500">Access lab protocols, activity feeds, and team dashboards.</p>
                </div>

                <form onSubmit={handleSubmit} className="mt-10 space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="name@company.com" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required placeholder="••••••••" />
                    </div>
                    {error ? <p className="text-sm text-rose-600">{error}</p> : null}
                    <Button type="button" onClick={handleSubmit} disabled={loading} className="w-full">{loading ? "Signing in..." : "Sign in"}</Button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Don’t have an account? <Link className="font-semibold text-teal-600 hover:text-teal-700" href="/register">Register</Link>
                </p>
            </div>
        </div>
    );
}
