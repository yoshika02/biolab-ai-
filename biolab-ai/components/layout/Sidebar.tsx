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
    Sun,
    Moon,
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

interface UserInfo {
    name: string;
    role: string;
}

export function Sidebar() {
    const pathname = usePathname() || "/dashboard";
    const [user, setUser] = useState<UserInfo | null>(null);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    useEffect(() => {
        // Load saved theme
        const saved = typeof window !== 'undefined' ? window.localStorage.getItem('biolab.theme') as 'dark' | 'light' | null : null;
        const initial = saved || 'dark';
        setTheme(initial);
        applyTheme(initial);

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

    function applyTheme(t: 'dark' | 'light') {
        if (typeof document === 'undefined') return;
        if (t === 'light') {
            document.documentElement.classList.add('theme-light');
            document.documentElement.classList.remove('theme-dark');
        } else {
            document.documentElement.classList.add('theme-dark');
            document.documentElement.classList.remove('theme-light');
        }
    }

    function toggleTheme() {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        applyTheme(next);
        window.localStorage.setItem('biolab.theme', next);
    }

    async function handleLogout() {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } finally {
            window.location.href = "/login";
        }
    }

    const isLight = theme === 'light';

    return (
        <aside className={`fixed left-0 top-0 z-20 h-screen w-60 border-r px-3 py-6 flex flex-col transition-colors duration-300 ${
            isLight
                ? 'bg-[#FAF7F2] border-[#E8DFD0] text-slate-800'
                : 'bg-slate-950 border-slate-800 text-slate-100'
        }`}>
            {/* Logo */}
            <div className="mb-8 flex items-center gap-3 px-3">
                <img src="/biolab-logo.svg" alt="BioLab AI Logo" className="h-11 w-11" suppressHydrationWarning />
                <div>
                    <p className={`text-[10px] font-bold uppercase tracking-[0.3em] ${isLight ? 'text-teal-700' : 'text-slate-400'}`}>BioLab</p>
                    <p className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>AI Platform</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="space-y-1 flex-1">
                {navItems.map((item) => {
                    const active = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all ${
                                active
                                    ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20'
                                    : isLight
                                        ? 'text-slate-600 hover:bg-[#EDE8DF] hover:text-slate-900'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <Icon className="h-4.5 w-4.5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Theme Toggle */}
            <div className={`mt-4 mx-2 rounded-2xl p-1 flex items-center gap-1 border ${
                isLight ? 'bg-[#EDE8DF] border-[#D6CCB8]' : 'bg-slate-900 border-slate-800'
            }`}>
                <button
                    onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-bold transition-all ${
                        theme === 'dark'
                            ? 'bg-slate-700 text-white shadow'
                            : isLight ? 'text-slate-500' : 'text-slate-500'
                    }`}
                >
                    <Moon className="h-3.5 w-3.5" />
                    <span>Dark</span>
                </button>
                <button
                    onClick={() => { if (theme !== 'light') toggleTheme(); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-bold transition-all ${
                        theme === 'light'
                            ? 'bg-[#C8B99A] text-slate-900 shadow'
                            : isLight ? 'text-slate-500' : 'text-slate-500'
                    }`}
                >
                    <Sun className="h-3.5 w-3.5" />
                    <span>Beige</span>
                </button>
            </div>

            {/* User card + logout */}
            <div className="mt-4 flex flex-col gap-3 px-1">
                <div className={`rounded-3xl p-4 ${isLight ? 'bg-[#EDE8DF]' : 'bg-slate-800'}`}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500 text-white text-sm font-bold shrink-0">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                            <p className={`text-xs font-semibold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{user?.name || "Loading..."}</p>
                            <Badge variant="success" className="mt-1">{user?.role || "User"}</Badge>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                        isLight ? 'bg-[#EDE8DF] text-slate-700 hover:bg-[#D6CCB8]' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </aside>
    );
}
