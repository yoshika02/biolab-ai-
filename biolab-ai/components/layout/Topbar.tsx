'use client';

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Bell, Search, ChevronDown, UserCircle2, Shield, Settings, BarChart3, LogOut, ArrowRight, X } from "lucide-react";
import { api } from "@/lib/api";

const titleMap: Record<string, string> = {
    "/dashboard": "Home Hub",
    "/dashboard/protocol": "Protocol Assistant",
    "/dashboard/papers": "Paper Summarizer",
    "/dashboard/inventory": "Inventory Tracker",
    "/dashboard/experiments": "Experiment Logger",
    "/dashboard/primers": "PCR Primer Designer",
    "/dashboard/safety": "Chemical Safety Console",
    "/dashboard/analytics": "Performance Analytics",
    "/dashboard/profile": "Researcher Profile",
};

interface User {
    name: string;
}

export function Topbar() {
    const pathname = usePathname();
    const router = useRouter();
    
    const [panelOpen, setPanelOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [searchVal, setSearchVal] = useState("");

    const profileRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const title = titleMap[pathname ?? "/dashboard"] ?? "Dashboard Hub";

    // Standard static/fetched notifications list
    const [notifications, setNotifications] = useState([
        { id: "1", type: "alert", title: "Acid Proximity Warning", message: "Nitric Acid stored near flammable Ethanol in Cabinet A." },
        { id: "2", type: "info", title: "CRISPR Run Log", message: "Crispr BRCA1 experiment was updated to Analysis stage." },
        { id: "3", type: "warning", title: "Reagent Depletion", message: "Concentrated Nitric Acid stock level is down to 20%." },
    ]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(api.user);
                const data = await res.json();
                if (data.user) {
                    setUser({ name: "Yoshika" });
                } else {
                    setUser({ name: "Yoshika" });
                }
            } catch (error) {
                // Fallback for offline seed compliance
                setUser({ name: "Yoshika" });
            }
        };
        fetchUser();

        // Close dropdowns on outside clicks
        const handleOutsideClick = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                // Keep panel open if they click the bell itself
                const target = e.target as HTMLElement;
                if (!target.closest(".bell-btn")) {
                    setPanelOpen(false);
                }
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    // Dismiss notification helper
    const handleDismissNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur-md md:flex-row md:items-center md:justify-between rounded-b-3xl">
            <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-teal-400 font-mono">BioLab AI · Platform</p>
                <h1 className="text-xl font-bold text-white mt-0.5">{title}</h1>
            </div>

            <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-end">
                {/* Search Bar */}
                <div className="flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 shadow-sm max-w-xs w-full">
                    <Search className="h-4 w-4 text-slate-500" />
                    <input
                        type="search"
                        value={searchVal}
                        onChange={(e) => setSearchVal(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                // Simple search routing
                                if (searchVal.toLowerCase().includes("acid") || searchVal.toLowerCase().includes("ethanol")) {
                                    router.push("/dashboard/inventory");
                                } else if (searchVal.toLowerCase().includes("primer") || searchVal.toLowerCase().includes("oligo")) {
                                    router.push("/dashboard/primers");
                                } else {
                                    router.push("/dashboard/experiments");
                                }
                                setSearchVal("");
                            }
                        }}
                        placeholder="Search workspace..."
                        className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600 font-medium"
                    />
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3 justify-end relative">
                    {/* Bell Notification Button */}
                    <button
                        onClick={() => setPanelOpen(!panelOpen)}
                        className="bell-btn relative rounded-full bg-slate-900 border border-slate-800 p-2.5 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                    >
                        <Bell className="h-4.5 w-4.5" />
                        {notifications.length > 0 && (
                            <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-lg animate-pulse">
                                {notifications.length}
                            </span>
                        )}
                    </button>

                    {/* User profile dropdown container */}
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 hover:bg-slate-850 px-4 py-2 text-slate-200 transition cursor-pointer"
                        >
                            <UserCircle2 className="h-4.5 w-4.5 text-teal-400" />
                            <span className="text-xs font-bold uppercase tracking-wider font-mono">{user?.name || "YOSHIKA"}</span>
                            <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Glassmorphic Dropdown List */}
                        {profileOpen && (
                            <div className="absolute right-0 mt-2.5 w-56 origin-top-right rounded-2xl border border-slate-800 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-lg animate-in fade-in slide-in-from-top-2 duration-150">
                                <div className="px-3.5 py-2.5 border-b border-slate-900">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-teal-400 font-mono">Signed In As</p>
                                    <p className="text-xs font-bold text-slate-200 mt-0.5">Dr. Yoshika</p>
                                    <p className="text-[9px] text-slate-500 mt-0.5 font-medium">Principal Director · BSL-2</p>
                                </div>
                                <div className="p-1 space-y-0.5">
                                    <button
                                        onClick={() => { router.push("/dashboard/profile"); setProfileOpen(false); }}
                                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-900 hover:text-white transition"
                                    >
                                        <UserCircle2 className="h-4 w-4 text-slate-400" />
                                        <span>My Profile Settings</span>
                                    </button>
                                    <button
                                        onClick={() => { router.push("/dashboard/analytics"); setProfileOpen(false); }}
                                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-900 hover:text-white transition"
                                    >
                                        <BarChart3 className="h-4 w-4 text-slate-400" />
                                        <span>Lab Analytics</span>
                                    </button>
                                    <button
                                        onClick={() => { router.push("/dashboard"); setProfileOpen(false); }}
                                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-900 hover:text-white transition"
                                    >
                                        <Shield className="h-4 w-4 text-slate-400" />
                                        <span>Dashboard Hub</span>
                                    </button>
                                </div>
                                <div className="border-t border-slate-900 p-1">
                                    <button
                                        onClick={() => { alert("Logout simulated successfully."); setProfileOpen(false); }}
                                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Glassmorphic Notification Panel */}
                {panelOpen && (
                    <div
                        ref={panelRef}
                        className="absolute right-0 top-14 mt-1 w-80 max-w-sm rounded-3xl border border-slate-800 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-lg z-30 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3"
                    >
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                            <div>
                                <p className="text-xs font-bold text-slate-200">Alert Center</p>
                                <p className="text-[9px] text-slate-500 font-medium">Compliance notifications</p>
                            </div>
                            <button
                                onClick={() => setPanelOpen(false)}
                                className="rounded-lg p-1 text-slate-500 hover:bg-slate-900 hover:text-slate-200 transition"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-[11px] text-slate-500 font-medium">
                                No active laboratory warnings! All systems normal.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                {notifications.map((n) => (
                                    <div key={n.id} className="relative rounded-xl border border-slate-900 bg-slate-900/40 p-3 space-y-1 hover:border-slate-800 transition">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`h-1.5 w-1.5 rounded-full ${
                                                    n.type === 'alert' ? 'bg-rose-500 animate-pulse' : n.type === 'warning' ? 'bg-amber-400' : 'bg-teal-400'
                                                }`} />
                                                <span className="text-[10px] font-bold text-slate-300">{n.title}</span>
                                            </div>
                                            <button
                                                onClick={() => handleDismissNotification(n.id)}
                                                className="text-[9px] font-bold text-slate-500 hover:text-slate-300 transition"
                                            >
                                                Dismiss
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-mono leading-relaxed">{n.message}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
