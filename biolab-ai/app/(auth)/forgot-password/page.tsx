'use client';

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState<string | null>(null);

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!email.includes("@")) {
            setMessage("Enter a valid registered email address.");
            return;
        }
        setMessage("Password reset links are not automated yet. Please contact your lab administrator for a reset.");
    }

    return (
        <div className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-16">
            <div className="w-full rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
                <div className="space-y-2 text-center">
                    <p className="text-sm uppercase tracking-[0.32em] text-teal-700">BioLab AI</p>
                    <h1 className="text-3xl font-semibold text-slate-950">Reset password</h1>
                    <p className="text-sm text-slate-500">Request help for your account using the email you registered with.</p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                    </div>
                    {message ? <p className="text-sm text-slate-600">{message}</p> : null}
                    <Button type="submit" className="w-full">Send reset request</Button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Back to <Link href="/login" className="font-semibold text-teal-600 hover:text-teal-700">sign in</Link>
                </p>
            </div>
        </div>
    );
}

