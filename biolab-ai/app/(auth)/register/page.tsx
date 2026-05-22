'use client';

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { api } from "@/lib/api";

function passwordStrength(password: string) {
    if (password.length < 6) return "Weak";
    if (password.length < 10) return "Fair";
    return "Strong";
}

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [department, setDepartment] = useState("");
    const [institution, setInstitution] = useState("");
    const [role, setRole] = useState("RESEARCHER");
    const [inviteCode, setInviteCode] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [emailStatus, setEmailStatus] = useState<string | null>(null);

    async function checkEmail(value: string) {
        if (!value.includes("@")) {
            setEmailStatus(null);
            return;
        }
        const res = await fetch(api.auth.checkEmail(value));
        const data = await res.json().catch(() => null);
        setEmailStatus(data?.available ? "Available" : "Already in use");
    }

    async function handleSubmit(event?: React.MouseEvent<HTMLButtonElement> | React.FormEvent<HTMLFormElement>) {
        if (event && 'preventDefault' in event) event.preventDefault();
        setLoading(true);
        setError(null);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(api.auth.register, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, department, institution, role, inviteCode, password }),
                signal: controller.signal,
            });

            let body: Record<string, unknown> | null = null;
            try {
                body = (await response.json()) as Record<string, unknown>;
            } catch {
                body = null;
            }

            if (!response.ok) {
                const errMsg = body && typeof body.error === 'string' ? body.error : "Unable to register.";
                setError(errMsg);
                return;
            }

            setSuccessMessage("You have successfully registered. Please sign in to continue.");
            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 3000);
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
        <div className="mx-auto min-h-screen max-w-3xl px-4 py-16">
            <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-xl sm:p-12">
                <div className="space-y-2 text-center">
                    <p className="text-sm uppercase tracking-[0.32em] text-teal-700">BioLab AI</p>
                    <h1 className="text-3xl font-semibold text-slate-950">Create your account</h1>
                    <p className="text-sm text-slate-500">Register to start using the lab dashboard and protocol tracker.</p>
                </div>

                <form onSubmit={handleSubmit} className="mt-10 space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
                        <Input value={name} onChange={(event) => setName(event.target.value)} required />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                        <Input value={email} type="email" onChange={(event) => { setEmail(event.target.value); checkEmail(event.target.value); }} required />
                        {emailStatus ? <p className="mt-2 text-sm text-slate-500">{emailStatus}</p> : null}
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Department</label>
                            <Input value={department} onChange={(event) => setDepartment(event.target.value)} required />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Institution</label>
                            <Input value={institution} onChange={(event) => setInstitution(event.target.value)} required />
                        </div>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
                        <select value={role} onChange={(event) => setRole(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                            <option value="RESEARCHER">Researcher</option>
                            <option value="LAB_HEAD">Lab Head</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    {role === "ADMIN" ? (
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Admin invite code</label>
                            <Input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} required />
                        </div>
                    ) : null}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                        <Input value={password} type="password" onChange={(event) => setPassword(event.target.value)} required />
                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                            Password strength:
                            <Badge
                                variant={
                                    passwordStrength(password) === "Strong"
                                        ? "success"
                                        : passwordStrength(password) === "Fair"
                                            ? "warning"
                                            : "error"
                                }
                            >
                                {passwordStrength(password)}
                            </Badge>
                        </div>
                    </div>
                    {error ? <p className="text-sm text-rose-600">{error}</p> : null}
                    {successMessage ? (
                        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm text-emerald-900">
                            <p>{successMessage}</p>
                            <p className="mt-2">
                                <Link className="font-semibold text-teal-600 hover:text-teal-700" href="/login">Sign in</Link> to continue.
                            </p>
                        </div>
                    ) : (
                        <Button type="button" onClick={handleSubmit} disabled={loading} className="w-full">{loading ? "Creating account..." : "Register"}</Button>
                    )}
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Already registered? <Link className="font-semibold text-teal-600 hover:text-teal-700" href="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
