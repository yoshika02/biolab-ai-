'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    BarChart3,
    BookOpen,
    Boxes,
    FileText,
    FlaskRound,
    ShieldCheck,
    TrendingUp,
    Clock,
    ArrowRight,
    CheckCircle2,
    XCircle,
    Activity,
    Zap,
    Flame,
    Compass
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
        label: "Inventory Tracker",
        href: "/dashboard/inventory",
        icon: Boxes,
        color: "from-purple-500/20 to-purple-600/10",
        border: "border-purple-500/30",
        text: "text-purple-400",
        desc: "Track reagents & expiry",
    },
    {
        label: "Experiment Logger",
        href: "/dashboard/experiments",
        icon: FlaskRound,
        color: "from-amber-500/20 to-amber-600/10",
        border: "border-amber-500/30",
        text: "text-amber-400",
        desc: "Log results & anomalies",
    },
    {
        label: "PCR Primer Designer",
        href: "/dashboard/primers",
        icon: Compass,
        color: "from-emerald-500/20 to-emerald-600/10",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        desc: "Design oligos & BLAST",
    },
    {
        label: "Safety Chatbot",
        href: "/dashboard/safety",
        icon: ShieldCheck,
        color: "from-rose-500/20 to-rose-600/10",
        border: "border-rose-500/30",
        text: "text-rose-400",
        desc: "Chemical compatibility console",
    },
];

const storageKeys = [
    { key: "biolab.protocols_seed", dbKey: "biolab.protocols_seed", label: "SOP Protocols", icon: FileText, color: "text-teal-400", trend: "Offline templates loaded" },
    { key: "biolab.papers_seed", dbKey: "biolab.papers_seed", label: "PubMed Papers", icon: BookOpen, color: "text-blue-400", trend: "Literature index sync" },
    { key: "biolab.inventory_premium", dbKey: "biolab.inventory_premium", label: "Reagents Stock", icon: Boxes, color: "text-purple-400", trend: "Active catalog list" },
    { key: "biolab.experiments_premium", dbKey: "biolab.experiments_premium", label: "Research Runs", icon: FlaskRound, color: "text-amber-400", trend: "Timeline experiments log" },
];

export default function DashboardHome() {
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [userName, setUserName] = useState("Researcher");
    const now = new Date();

    useEffect(() => {
        // Live dynamic local storage count reader
        const updateCounts = () => {
            const currentCounts: Record<string, number> = {};
            storageKeys.forEach(item => {
                if (typeof window !== "undefined") {
                    try {
                        const val = window.localStorage.getItem(item.dbKey);
                        if (val) {
                            const parsed = JSON.parse(val);
                            currentCounts[item.key] = Array.isArray(parsed) ? parsed.length : 0;
                        } else {
                            // Fallback seeds count if not yet initialized in localStorage
                            if (item.key.includes("protocol")) currentCounts[item.key] = 4;
                            else if (item.key.includes("paper")) currentCounts[item.key] = 7;
                            else currentCounts[item.key] = 0;
                        }
                    } catch {
                        currentCounts[item.key] = 0;
                    }
                }
            });
            setCounts(currentCounts);
        };

        // Fetch dynamic logged-in user name
        fetch("/api/user")
            .then(res => {
                if (res.ok) return res.json();
                throw new Error();
            })
            .then(data => {
                if (data?.user?.name) {
                    setUserName(data.user.name);

                    // 1. Initializing seed data for our laboratory ONLY for Yoshika account!
                    if (data.user.name.toLowerCase().includes("yoshika") && typeof window !== "undefined") {
                        const hasSeeded = window.localStorage.getItem("biolab.seeding_premium_completed");
                        if (!hasSeeded) {
                            // Seeding Inventory
                            const mockInventory = [
                                { id: "inv-1", item: "Ethanol (99% pure)", category: "Solvents", quantity: 2.5, unit: "L", location: "Cabinet B (Flammables)" },
                                { id: "inv-2", item: "Nitric Acid (Concentrated)", category: "Acids", quantity: 500, unit: "mL", location: "Cabinet A (Acids)" },
                                { id: "inv-3", item: "Tris-HCl Buffer (pH 8.0)", category: "Buffers", quantity: 1, unit: "L", location: "Shelf C" },
                                { id: "inv-4", item: "DAPI Nucleic Acid Stain", category: "Stains", quantity: 10, unit: "mg", location: "Freezer Box F" }
                            ];
                            window.localStorage.setItem("biolab.inventory_premium", JSON.stringify(mockInventory));

                            // Seeding Experiments
                            const mockExperiments = [
                                {
                                    id: "exp-1",
                                    name: "Growth curve study - Delta-12",
                                    stage: "Running",
                                    createdAt: new Date(Date.now() - 4 * 24 * 3600000).toISOString(),
                                    logs: [
                                        { date: "Day 1", od: 0.45, ph: 7.2, yield: 40, notes: "Inoculation successful. Normal growth rate." },
                                        { date: "Day 2", od: 0.92, ph: 5.1, yield: 65, notes: "Sudden sharp pH crash to 5.1. Sour odor observed in bacterial culture." }
                                    ]
                                },
                                {
                                    id: "exp-2",
                                    name: "BRCA1 CRISPR Knockout Verification",
                                    stage: "Analysis",
                                    createdAt: new Date(Date.now() - 8 * 24 * 3600000).toISOString(),
                                    logs: [
                                        { date: "Day 1", od: 0.35, ph: 7.4, yield: 84, notes: "GEL electrophoresis verification. Amplification detected at 250bp target." }
                                    ]
                                },
                                {
                                    id: "exp-3",
                                    name: "GFP Expressing E. coli Culture",
                                    stage: "Completed",
                                    createdAt: new Date(Date.now() - 15 * 24 * 3600000).toISOString(),
                                    logs: [
                                        { date: "Day 1", od: 0.88, ph: 7.0, yield: 92, notes: "Brilliant green fluorescence under UV light. High validation rate." }
                                    ]
                                }
                            ];
                            window.localStorage.setItem("biolab.experiments_premium", JSON.stringify(mockExperiments));

                            // Seeding Primers
                            const mockPrimers = [
                                {
                                    id: "prim-seed-1",
                                    geneName: "GFP-Reporter",
                                    geneSequence: "ATGGTGAGCAAGGGCGAGGAGCTGTTCACCGGGGTGGTGCCCATCCTGGTCGAG...",
                                    forwardPrimer: "ATGGTGAGCAAGGGCG",
                                    reversePrimer: "TTACTTGTACAGCTCG",
                                    tmForward: 58.4,
                                    tmReverse: 57.9,
                                    gcForward: 53.2,
                                    gcReverse: 51.5,
                                    ampliconSize: 240,
                                    qualityScore: 92,
                                    offTargetHits: 0,
                                    createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString()
                                }
                            ];
                            window.localStorage.setItem("biolab.primers_premium", JSON.stringify(mockPrimers));

                            // Seeding Activity Logs
                            const mockLogs = [
                                { id: "act-1", action: "logged daily measurements for Delta-12", module: "Experiment", createdAt: new Date(Date.now() - 1 * 3600000).toISOString() },
                                { id: "act-2", action: "created new CRISPR knockout target", module: "Experiment", createdAt: new Date(Date.now() - 4 * 3600000).toISOString() },
                                { id: "act-3", action: "performed SDS safety review for Nitric Acid", module: "Safety", createdAt: new Date(Date.now() - 12 * 3600000).toISOString() },
                                { id: "act-4", action: "designed PCR primers for GFP-Reporter", module: "Primer", createdAt: new Date(Date.now() - 48 * 3600000).toISOString() }
                            ];
                            window.localStorage.setItem("biolab.activity_logs", JSON.stringify(mockLogs));

                            // Finalize seed completion
                            window.localStorage.setItem("biolab.seeding_premium_completed", "true");
                        }
                    }
                    
                    // Trigger dynamic local storage count reader
                    updateCounts();
                }
            })
            .catch(() => {
                // Fetch failed or not authenticated, still update counters!
                updateCounts();
            });

        updateCounts();
        const interval = setInterval(updateCounts, 5000);
        return () => clearInterval(interval);
    }, []);

    const totalReagents = counts["biolab.inventory_premium"] || 0;
    const totalExperiments = counts["biolab.experiments_premium"] || 0;

    return (
        <div className="space-y-8">
            <AlertBanner />

            {/* Welcome Hero Strip */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 border border-teal-800/40 p-8 shadow-lg">
                <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-1">
                            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                        </p>
                        <h2 className="text-3xl font-bold text-white">Welcome Back, {userName} 👋</h2>
                        <p className="mt-2 text-slate-300 text-sm">
                            Molecular command console is online. <span className="font-semibold text-teal-300">{totalExperiments} experiments</span> are currently logged, with <span className="font-semibold text-teal-300">{totalReagents} chemical materials</span> cataloged.
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
                        <div key={item.key} className="relative overflow-hidden rounded-3xl bg-slate-900/60 border border-slate-800 p-5 hover:border-slate-700 transition duration-200 backdrop-blur shadow-md">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 border border-slate-850 ${item.color}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                {count > 0 ? (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 font-mono uppercase">
                                        <TrendingUp className="h-3 w-3" /> Live
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 font-mono uppercase">
                                        <Clock className="h-3 w-3" /> Empty
                                    </span>
                                )}
                            </div>
                            <p className="text-3xl font-bold text-white">{count}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.label}</p>
                            <p className="mt-2 text-[10px] font-medium text-slate-500 font-mono">{item.trend}</p>
                        </div>
                    );
                })}
            </div>

            {/* Module Grid + Activity Section */}
            <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
                
                {/* Module Access Grid */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Lab Operations Modules</h3>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full uppercase">
                            {moduleLinks.length} Active Modules
                        </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {moduleLinks.map((mod) => {
                            const Icon = mod.icon;
                            return (
                                <Link
                                    key={mod.href}
                                    href={mod.href}
                                    className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${mod.color} ${mod.border} p-5 transition hover:scale-[1.02] hover:shadow-lg`}
                                >
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950/80 border border-slate-800 ${mod.text} mb-4`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <p className="font-bold text-slate-100 text-sm group-hover:text-white transition">{mod.label}</p>
                                    <p className="mt-1 text-xs text-slate-400 font-medium leading-relaxed">{mod.desc}</p>
                                    <ArrowRight className={`absolute right-4 top-4 h-4 w-4 ${mod.text} opacity-0 transition group-hover:opacity-100 group-hover:translate-x-1`} />
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Active Audit Logs</h3>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 font-mono uppercase bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live
                        </span>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm backdrop-blur">
                        <ActivityFeed />
                    </div>
                </div>
            </div>

            {/* Bottom Info Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-md hover:border-slate-700 transition backdrop-blur">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/25 text-teal-400 mb-4 shrink-0">
                        <Activity className="h-4.5 w-4.5" />
                    </div>
                    <p className="font-bold text-slate-200 text-sm">AI Weekly Digest</p>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">Review active experiment logs, pH crash logs, and raw metrics before the upcoming laboratory compliance check.</p>
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> 
                            <span>Protocol SOPs indexed correctly</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                            <XCircle className="h-4 w-4 text-rose-400 shrink-0" /> 
                            <span>Storage safety alerts need review</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-md hover:border-slate-700 transition backdrop-blur">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 mb-4 shrink-0">
                        <Flame className="h-4.5 w-4.5" />
                    </div>
                    <p className="font-bold text-slate-200 text-sm">Priority Warnings</p>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">Clear chemical safety compliance alerts and complete CRISPR audits before launching dependent runs.</p>
                    <Link href="/dashboard/safety" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition uppercase tracking-wider font-mono">
                        <span>Resolve Alerts</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-md hover:border-slate-700 transition backdrop-blur">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50/10 border border-emerald-500/25 text-emerald-400 mb-4 shrink-0">
                        <BarChart3 className="h-4.5 w-4.5" />
                    </div>
                    <p className="font-bold text-slate-200 text-sm">Performance Insights</p>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">View productivity trends, chemical depletion forecasting charts, and oligo designer logs.</p>
                    <Link href="/dashboard/analytics" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition uppercase tracking-wider font-mono">
                        <span>Open Analytics</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

            </div>
        </div>
    );
}
