'use client';

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Bell, Search, ChevronDown, UserCircle2 } from "lucide-react";
import { NotificationPanel } from "@/components/layout/NotificationPanel";
import { api } from "@/lib/api";

const titleMap: Record<string, string> = {
    "/dashboard": "Home",
    "/dashboard/protocol": "Protocol",
    "/dashboard/papers": "Papers",
    "/dashboard/inventory": "Inventory",
    "/dashboard/experiments": "Experiments",
    "/dashboard/primers": "Primers",
    "/dashboard/safety": "Safety",
    "/dashboard/analytics": "Analytics",
    "/dashboard/profile": "Profile",
};

interface User {
    name: string;
}

export function Topbar() {
    const pathname = usePathname();
    const [panelOpen, setPanelOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const title = titleMap[pathname ?? "/dashboard"] ?? "Dashboard";

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
        <div className="sticky top-0 z-10 flex flex-col gap-4 border-b border-slate-800 bg-slate-950/95 px-6 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
            <div>
                <p className="text-xs font-medium uppercase tracking-[0.32em] text-slate-500">Dashboard</p>
                <h1 className="text-2xl font-semibold text-white">{title}</h1>
            </div>

            <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900 px-4 py-2 shadow-sm">
                    <Search className="h-4 w-4 text-slate-500" />
                    <input
                        type="search"
                        placeholder="Search protocols, papers, inventory..."
                        className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => setPanelOpen((open) => !open)} className="relative rounded-full bg-slate-800 p-3 text-slate-300 transition hover:bg-slate-700">
                        <Bell className="h-5 w-5" />
                        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[0.65rem] font-semibold text-white">3</span>
                    </button>

                    <div className="flex items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-slate-300">
                        <UserCircle2 className="h-5 w-5" />
                        <span className="text-sm font-medium">{user?.name || "..."}</span>
                        <ChevronDown className="h-4 w-4" />
                    </div>
                </div>
            </div>

            <NotificationPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
        </div>
    );
}
