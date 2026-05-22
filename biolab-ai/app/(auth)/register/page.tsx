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

const departments = [
    "Computer Science and Engineering",
    "Information Technology",
    "Artificial Intelligence and Data Science",
    "Artificial Intelligence and Machine Learning",
    "Electronics and Communication Engineering",
    "Electrical Engineering",
    "Electrical and Electronics Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Chemical Engineering",
    "Biotechnology",
    "Biomedical Engineering",
    "Instrumentation Engineering",
    "Industrial Engineering",
    "Production Engineering",
    "Metallurgical and Materials Engineering",
    "Aerospace Engineering",
    "Automobile Engineering",
    "Mechatronics Engineering",
    "Environmental Engineering",
];

const institutions = [
    "IIT Bombay",
    "IIT Delhi",
    "IIT Madras",
    "IIT Kanpur",
    "IIT Kharagpur",
    "IIT Roorkee",
    "IIT Guwahati",
    "IIT Hyderabad",
    "IIT Indore",
    "IIT BHU Varanasi",
    "NIT Trichy",
    "NIT Surathkal",
    "NIT Warangal",
    "NIT Calicut",
    "NIT Rourkela",
    "NIT Kurukshetra",
    "NIT Durgapur",
    "NIT Silchar",
    "NIT Hamirpur",
    "MNIT Jaipur",
    "MANIT Bhopal",
    "SVNIT Surat",
    "IIIT Hyderabad",
    "IIIT Bangalore",
    "IIIT Delhi",
    "ABV-IIITM Gwalior",
    "IIIT Allahabad",
    "IIITDM Jabalpur",
    "IIIT Sri City",
    "IIIT Guwahati",
    "BITS Pilani",
    "VIT Vellore",
    "SRM Institute of Science and Technology",
    "Manipal Institute of Technology",
    "Thapar Institute of Engineering and Technology",
    "Amity University",
    "Shiv Nadar University",
    "Chandigarh University",
    "Lovely Professional University",
    "PES University",
];

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [department, setDepartment] = useState("");
    const [institution, setInstitution] = useState("");
    const [role, setRole] = useState("student");
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

        if (!/^[A-Za-z ]+$/.test(name.trim())) {
            setError("Name can contain alphabets and spaces only.");
            setLoading(false);
            return;
        }

        if (!email.includes("@")) {
            setError("Email must include @.");
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(api.auth.register, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, phone, department, institution, role, password }),
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
                        <Input value={name} onChange={(event) => setName(event.target.value.replace(/[^A-Za-z ]/g, ""))} pattern="[A-Za-z ]+" required />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                        <Input value={email} type="email" onChange={(event) => { setEmail(event.target.value); checkEmail(event.target.value); }} required />
                        {emailStatus ? <p className="mt-2 text-sm text-slate-500">{emailStatus}</p> : null}
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Phone number</label>
                        <Input value={phone} type="tel" onChange={(event) => setPhone(event.target.value.replace(/[^0-9+\-() ]/g, ""))} required />
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Department</label>
                            <select value={department} onChange={(event) => setDepartment(event.target.value)} required className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                                <option value="">Select department</option>
                                {departments.map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Institution</label>
                            <select value={institution} onChange={(event) => setInstitution(event.target.value)} required className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                                <option value="">Select institution</option>
                                {institutions.map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
                        <select value={role} onChange={(event) => setRole(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                            <option value="student">Student</option>
                            <option value="researcher">Researcher</option>
                            <option value="lab_assistant">Lab Assistant</option>
                            <option value="professor">Professor</option>
                        </select>
                    </div>
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
