'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
    Home,
    FileText,
    BookOpen,
    Boxes,
    FlaskRound,
    Droplet,
    ShieldCheck,
    BarChart3,
    User,
    LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";

const navItems = [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Protocol", href: "/dashboard/protocol", icon: FileText },
    { label: "Papers", href: "/dashboard/papers", icon: BookOpen },
    { label: "Inventory", href: "/dashboard/inventory", icon: Boxes },
    { label: "Experiments", href: "/dashboard/experiments", icon: FlaskRound },
    { label: "Primers", href: "/dashboard/primers", icon: Droplet },
    { label: "Safety", href: "/dashboard/safety", icon: ShieldCheck },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { label: "Profile", href: "/dashboard/profile", icon: User },
];

interface User {
    name: string;
    role: string;
}

export function Sidebar() {
    const pathname = usePathname() || "/dashboard";
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(api.user);
                const data = await res.json();
                if (data.user) setUser(data.user);
            } catch (error) {
                console.error("Failed to fetch user:", error);
            }
        };
        fetchUser();
    }, []);

    return (
        <aside className="fixed left-0 top-0 z-20 h-screen w-60 border-r border-slate-200 bg-slate-950 px-3 py-6 text-slate-100 sm:w-60">
            <div className="mb-10 flex items-center gap-3 px-3">
                <img src="/biolab-logo.svg" alt="BioLab AI Logo" className="h-12 w-12" suppressHydrationWarning />
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">BioLab</p>
                    <p className="text-lg font-semibold">AI Platform</p>
                </div>
            </div>

            <nav className="space-y-1">
                {navItems.map((item) => {
                    const active = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition ${active ? "bg-teal-500 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto flex flex-col gap-4 px-3 pt-8">
                <div className="rounded-3xl bg-slate-800 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500 text-white">R</div>
                        <div>
                            <p className="text-sm font-semibold">{user?.name || "Loading..."}</p>
                            <Badge variant="success" className="mt-1">{user?.role || "User"}</Badge>
                        </div>
                    </div>
                </div>
                <button className="flex items-center justify-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-700">
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </aside>
    );
}
