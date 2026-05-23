"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, BookOpen, Boxes, FileText, FlaskRound, Search, ShieldCheck } from "lucide-react";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { QuickAccess } from "@/components/dashboard/QuickAccess";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

const moduleHealth = [
    { label: "Protocol SOPs", key: "biolab.protocols", icon: FileText },
    { label: "Research papers", key: "biolab.papers", icon: BookOpen },
    { label: "Inventory items", key: "biolab.inventory", icon: Boxes },
    { label: "Experiments", key: "biolab.experiments", icon: FlaskRound },
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

    useEffect(() => {
        setCounts(Object.fromEntries(moduleHealth.map((item) => [item.key, readCount(item.key)])));
    }, []);

    const stats = useMemo(() => {
        const experiments = counts["biolab.experiments"] || 0;
        const inventory = counts["biolab.inventory"] || 0;
        const papers = counts["biolab.papers"] || 0;
        const protocols = counts["biolab.protocols"] || 0;

        return [
            { label: "Active experiments", value: String(experiments), description: "Running or planned records in the lab workspace.", highlight: "Live" },
            { label: "Inventory records", value: String(inventory), description: "Saved reagents, chemicals, kits, and supplies.", highlight: "Stock" },
            { label: "Papers this week", value: String(papers), description: "Literature notes available for review.", highlight: "Research" },
            { label: "Protocol SOPs", value: String(protocols), description: "Saved procedures ready for AI protocol help.", highlight: "M1" },
        ];
    }, [counts]);

    return (
        <div className="space-y-6">
            <AlertBanner />

            <div className="grid gap-4 xl:grid-cols-4">
                {stats.map((stat) => (
                    <StatCard key={stat.label} label={stat.label} value={stat.value} description={stat.description} highlight={stat.highlight} />
                ))}
            </div>

            <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <Card className="space-y-5 rounded-lg">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500">Lab Command Center</p>
                            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Unified research operations</h2>
                            <p className="mt-2 max-w-2xl text-sm text-slate-600">
                                Protocols, literature, inventory, experiment records, safety notes, and analytics are connected in one workspace.
                            </p>
                        </div>
                        <Badge variant="success">Phase 1 Dashboard</Badge>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        {moduleHealth.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.key} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-950">{item.label}</p>
                                                <p className="text-sm text-slate-500">{counts[item.key] || 0} saved records</p>
                                            </div>
                                        </div>
                                        <Badge>{counts[item.key] ? "Active" : "Ready"}</Badge>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                <Card className="space-y-4 rounded-lg">
                    <p className="text-sm font-semibold text-slate-500">Weekly AI Digest</p>
                    <div className="space-y-3">
                        <div className="flex gap-3 rounded-lg bg-teal-50 p-3">
                            <BarChart3 className="mt-0.5 h-5 w-5 text-teal-700" />
                            <p className="text-sm text-slate-700">Review active experiment logs and inventory usage before the next lab meeting.</p>
                        </div>
                        <div className="flex gap-3 rounded-lg bg-amber-50 p-3">
                            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
                            <p className="text-sm text-slate-700">Resolve expiring reagent and anomaly alerts before starting dependent protocols.</p>
                        </div>
                        <div className="flex gap-3 rounded-lg bg-slate-50 p-3">
                            <Search className="mt-0.5 h-5 w-5 text-slate-700" />
                            <p className="text-sm text-slate-700">Use global search for protocols, papers, experiments, and inventory names.</p>
                        </div>
                    </div>
                </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                <Card className="space-y-5 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500">Activity Feed</p>
                            <p className="text-base text-slate-700">Last 20 actions from team members.</p>
                        </div>
                    </div>
                    <ActivityFeed />
                </Card>

                <Card className="space-y-4 rounded-lg">
                    <div>
                        <p className="text-sm font-semibold text-slate-500">Quick Access</p>
                        <p className="text-base text-slate-700">Open key modules in one click.</p>
                    </div>
                    <QuickAccess />
                </Card>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                <Card className="rounded-lg">
                    <ShieldCheck className="h-5 w-5 text-emerald-700" />
                    <p className="mt-3 font-semibold text-slate-950">Safety register</p>
                    <p className="mt-1 text-sm text-slate-600">Chemical notes and compatibility warnings stay visible from the home view.</p>
                </Card>
                <Card className="rounded-lg">
                    <Boxes className="h-5 w-5 text-emerald-700" />
                    <p className="mt-3 font-semibold text-slate-950">Expiry watch</p>
                    <p className="mt-1 text-sm text-slate-600">Inventory records feed dashboard alerts for short-dated reagents.</p>
                </Card>
                <Card className="rounded-lg">
                    <FlaskRound className="h-5 w-5 text-emerald-700" />
                    <p className="mt-3 font-semibold text-slate-950">Experiment review</p>
                    <p className="mt-1 text-sm text-slate-600">Experiment entries can be tracked alongside SOPs and reagent usage.</p>
                </Card>
            </section>
        </div>
    );
}
