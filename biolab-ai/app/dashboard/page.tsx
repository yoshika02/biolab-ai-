"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    AlertTriangle, BarChart3, BookOpen, Boxes, FileText, FlaskRound,
    ShieldCheck, TrendingUp, TrendingDown, Activity, Zap, Clock,
    ArrowRight, CheckCircle2, XCircle, Flame
} from "lucide-react";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AlertBanner } from "@/components/dashboard/AlertBanner";

const moduleLinks = [
    {
        label: "Protocol Assistant",
        href: "/dashboard/protocol",
        icon: FileText,
        color: "from-teal-500/20 to-teal-600/10",
        border: "border-teal-500/30",
        text: "text-teal-400",
        desc: "Chat with your lab SOPs",
    },
    {
        label: "Paper Summarizer",
        href: "/dashboard/papers",
        icon: BookOpen,
        color: "from-blue-500/20 to-blue-600/10",
        border: "border-blue-500/30",
        text: "text-blue-400",
        desc: "Summarize PubMed & PDFs",
    },
    {
        label: "Inventory",
        href: "/dashboard/inventory",
        icon: Boxes,
        color: "from-purple-500/20 to-purple-600/10",
        border: "border-purple-500/30",
        text: "text-purple-400",
        desc: "Track reagents & expiry",
    },
    {
        label: "Experiments",
        href: "/dashboard/experiments",
        icon: FlaskRound,
        color: "from-amber-500/20 to-amber-600/10",
        border: "border-amber-500/30",
        text: "text-amber-400",
        desc: "Log results & anomalies",
    },
    {
        label: "Safety Chatbot",
        href: "/dashboard/safety",
        icon: ShieldCheck,
        color: "from-rose-500/20 to-rose-600/10",
        border: "border-rose-500/30",
        text: "text-rose-400",
        desc: "Chemical safety checks",
    },
    {
        label: "Analytics",
        href: "/dashboard/analytics",
        icon: BarChart3,
        color: "from-emerald-500/20 to-emerald-600/10",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        desc: "Trends & weekly digest",
    },
];

const storageKeys = [
    { key: "biolab.protocols", label: "Protocol SOPs", icon: FileText, color: "text-teal-400", trend: "+1 this week" },
    { key: "biolab.papers", label: "Papers Reviewed", icon: BookOpen, color: "text-blue-400", trend: "New papers ready" },
    { key: "biolab.inventory", label: "Inventory Items", icon: Boxes, color: "text-purple-400", trend: "2 expiring soon" },
    { key: "biolab.experiments", label: "Active Experiments", icon: FlaskRound, color: "text-amber-400", trend: "Live tracking" },
];

function readCount(key: string) {
    if (typeof window === "undefined") return 0;
    try {
        const value = JSON.parse(window.localStorage.getItem(key) || "[]");
        return Array.isArray(value) ? value.length : 0;
    } catch {
        return 0;
    }
}

export default function DashboardHome() {
    const [counts, setCounts] = useState<Record<string, number>>({});
    const now = new Date();

    useEffect(() => {
        setCounts(Object.fromEntries(storageKeys.map((item) => [item.key, readCount(item.key)])));
    }, []);

    const totalProtocols = counts["biolab.protocols"] || 0;

    return (
        <div className="space-y-8">
            <AlertBanner />

            {/* Welcome Hero Strip */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 border border-teal-800/40 p-8">
                <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-teal-400 uppercase tracking-widest mb-1">
                            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                        </p>
                        <h2 className="text-3xl font-bold text-white">Good {now.getHours() < 12 ? "Morning" : now.getHours() < 17 ? "Afternoon" : "Evening"}, Researcher 👋</h2>
                        <p className="mt-2 text-slate-400">
                            You have <span className="font-semibold text-teal-300">{totalProtocols} protocol SOPs</span> ready for AI-assisted analysis.
                        </p>
                    </div>
                    <Link
                        href="/dashboard/protocol"
                        className="flex items-center gap-2 rounded-2xl bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 hover:scale-105 shadow-lg shadow-teal-500/20 shrink-0"
                    >
                        <Zap className="h-4 w-4" />
                        Open Protocol AI
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {storageKeys.map((item) => {
                    const Icon = item.icon;
                    const count = counts[item.key] || 0;
                    return (
                        <div key={item.key} className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-5 hover:border-slate-700 transition duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 ${item.color}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                {count > 0 ? (
                                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                                        <TrendingUp className="h-3 w-3" /> Active
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                                        <Clock className="h-3 w-3" /> Empty
                                    </span>
                                )}
                            </div>
                            <p className="text-4xl font-bold text-white">{count}</p>
                            <p className="mt-1 text-sm font-medium text-slate-400">{item.label}</p>
                            <p className="mt-1 text-xs text-slate-600">{item.trend}</p>
                        </div>
                    );
                })}
            </div>

            {/* Module Grid + Activity */}
            <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
                {/* Module Access Grid */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Lab Modules</h3>
                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                            {moduleLinks.length} modules
                        </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {moduleLinks.map((mod) => {
                            const Icon = mod.icon;
                            return (
                                <Link
                                    key={mod.href}
                                    href={mod.href}
                                    className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${mod.color} ${mod.border} p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}
                                >
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ${mod.text} mb-4`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <p className="font-semibold text-slate-900">{mod.label}</p>
                                    <p className="mt-1 text-xs text-slate-500">{mod.desc}</p>
                                    <ArrowRight className={`absolute right-4 top-4 h-4 w-4 ${mod.text} opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1`} />
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Activity Feed</h3>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                        </span>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                        <ActivityFeed />
                    </div>
                </div>
            </div>

            {/* Bottom Info Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-4">
                        <Activity className="h-5 w-5" />
                    </div>
                    <p className="font-semibold text-slate-900">AI Weekly Digest</p>
                    <p className="mt-1 text-sm text-slate-500">Review active experiment logs and inventory usage before the next lab meeting.</p>
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Protocol SOPs ready for queries
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <XCircle className="h-4 w-4 text-rose-400" /> 2 reagents expiring soon
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
                        <Flame className="h-5 w-5" />
                    </div>
                    <p className="font-semibold text-slate-900">Priority Alerts</p>
                    <p className="mt-1 text-sm text-slate-500">Resolve expiring reagents and unresolved anomalies before starting dependent protocols.</p>
                    <Link href="/dashboard/inventory" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700">
                        View inventory <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <p className="font-semibold text-slate-900">Research Progress</p>
                    <p className="mt-1 text-sm text-slate-500">Track your lab's research milestones across all active experiments and protocol completions.</p>
                    <Link href="/dashboard/analytics" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                        Open analytics <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
