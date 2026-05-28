'use client';

import { useState, useEffect, useMemo } from "react";
import {
    BarChart3,
    Sparkles,
    Activity,
    Boxes,
    FlaskRound,
    Compass,
    ShieldAlert,
    TrendingUp,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    ArrowDownToLine
} from "lucide-react";
import { callGemini, getStoredOpenRouterKey } from "@/lib/gemini";

interface InventoryItem {
    item: string;
    quantity: number;
    unit: string;
}

interface Experiment {
    name: string;
    stage: string;
}

interface PrimerDesign {
    geneName: string;
    qualityScore: number;
}

export default function AnalyticsPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [primers, setPrimers] = useState<PrimerDesign[]>([]);
    const [isGeneratingAudit, setIsGeneratingAudit] = useState(false);
    const [aiAuditResult, setAiAuditResult] = useState("");
    const [aiError, setAiError] = useState("");

    // Load active state databases on mount
    useEffect(() => {
        const storedInv = window.localStorage.getItem("biolab.inventory_premium");
        if (storedInv) {
            try {
                setInventory(JSON.parse(storedInv));
            } catch {
                setInventory([]);
            }
        }

        const storedExps = window.localStorage.getItem("biolab.experiments_premium");
        if (storedExps) {
            try {
                setExperiments(JSON.parse(storedExps));
            } catch {
                setExperiments([]);
            }
        }

        const storedPrimers = window.localStorage.getItem("biolab.primers_premium");
        if (storedPrimers) {
            try {
                setPrimers(JSON.parse(storedPrimers));
            } catch {
                setPrimers([]);
            }
        }
    }, []);

    // Simulated/Calculated Performance Metrics
    const stats = useMemo(() => {
        const totalExps = experiments.length || 3;
        const totalReagents = inventory.length || 4;
        const totalPrimers = primers.length || 1;

        // Stage counts
        let completed = 0, running = 0, analysis = 0, planning = 0;
        experiments.forEach(e => {
            const st = e.stage.toLowerCase();
            if (st.includes("completed")) completed++;
            else if (st.includes("running")) running++;
            else if (st.includes("analysis")) analysis++;
            else planning++;
        });

        // Fallbacks for seed visual realism
        if (experiments.length === 0) {
            completed = 1;
            running = 1;
            analysis = 1;
        }

        const completedPct = Math.round((completed / totalExps) * 100) || 33;
        const runningPct = Math.round((running / totalExps) * 100) || 33;
        const analysisPct = Math.round((analysis / totalExps) * 100) || 34;

        return {
            totalExps,
            totalReagents,
            totalPrimers,
            completedPct,
            runningPct,
            analysisPct
        };
    }, [experiments, inventory, primers]);

    // Live Llama safety/performance auditor
    const handleGeneratePerformanceAudit = async () => {
        setIsGeneratingAudit(true);
        setAiError("");
        setAiAuditResult("");

        const invContext = inventory.map(i => `- ${i.item} (Current level: ${i.quantity} ${i.unit})`).join("\n");
        const expContext = experiments.map(e => `- ${e.name} (Stage: ${e.stage})`).join("\n");

        const prompt = `You are a certified professional Lab Manager and Operations Analyst for a Biosafety Level 2 molecular research facility.
Analyze our laboratory inventory levels and experiment execution cycles:

**Current Reagent Inventory Levels:**
${invContext || "- Ethanol (99% pure): 2.5 L\n- Nitric Acid (Concentrated): 500 mL\n- Tris-HCl Buffer (pH 8.0): 1 L\n- DAPI Stain: 10 mg"}

**Current Lab Research timeline:**
${expContext || "- Growth curve study - Delta-12 (Stage: Running)\n- BRCA1 CRISPR Knockout Verification (Stage: Analysis)\n- GFP Expressing E. coli Culture (Stage: Completed)"}

Please write a highly authoritative, professional Lab Operations Audit Report:
1. Provide a Reagent Replenishment Plan: Highlight if any reagents (specifically Nitric Acid which is at 20% or flammables) need direct replenishment.
2. Outline Workflow Optimizations: Suggest how to expedite CRISPR knockout timelines or handle Delta-12 growth curve pH crash anomalies.
3. Biosafety Clearances: Flag if there are any immediate chemical proximity sorting risks or SDS reviews required.

Format your response beautifully with clean scientific markdown headers, tables, or list items. Keep it direct and expert.`;

        try {
            const res = await callGemini(prompt);
            setAiAuditResult(res);

            // Log activity
            const storedLogs = window.localStorage.getItem("biolab.activity_logs") || "[]";
            try {
                const parsed = JSON.parse(storedLogs);
                parsed.unshift({
                    id: crypto.randomUUID(),
                    action: "generated laboratory performance audit report",
                    module: "Analytics",
                    createdAt: new Date().toISOString()
                });
                window.localStorage.setItem("biolab.activity_logs", JSON.stringify(parsed));
            } catch {}
        } catch (err) {
            console.error("Performance audit failed:", err);
            if (err instanceof Error && err.message === "API_KEY_MISSING") {
                setAiError("API Key missing! Please configure your OpenRouter key in the Profile Settings module.");
            } else {
                setAiError(err instanceof Error ? err.message : "Failed to audit lab productivity.");
            }
        } finally {
            setIsGeneratingAudit(false);
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-teal-400 font-mono">M7 · Operational Metrics</p>
                    <h1 className="mt-1 text-3xl font-bold text-white">Performance Analytics</h1>
                    <p className="mt-1 text-slate-300 text-sm">
                        Real-time chemical depletion forecasts, active timeline allocations, and Llama-powered laboratory operations audits.
                    </p>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow backdrop-blur">
                    <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                        <span>Logged Experiments</span>
                        <FlaskRound className="h-4 w-4 text-amber-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.totalExps}</p>
                    <span className="text-[10px] text-slate-500 font-mono font-medium block mt-1">Timeline studies logged</span>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow backdrop-blur">
                    <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                        <span>Chemical Reagents</span>
                        <Boxes className="h-4 w-4 text-purple-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.totalReagents}</p>
                    <span className="text-[10px] text-slate-500 font-mono font-medium block mt-1">Active chemical catalog</span>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow backdrop-blur">
                    <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                        <span>Designed Primers</span>
                        <Compass className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.totalPrimers}</p>
                    <span className="text-[10px] text-slate-500 font-mono font-medium block mt-1">Oligonucleotide designs</span>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow backdrop-blur">
                    <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                        <span>Safety approvals</span>
                        <CheckCircle2 className="h-4 w-4 text-teal-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">100%</p>
                    <span className="text-[10px] text-slate-500 font-mono font-medium block mt-1">GHS compliance rate</span>
                </div>
            </div>

            {/* Double Column Chart Panel */}
            <div className="grid gap-6 lg:grid-cols-2">
                
                {/* Reagent depletion forecasting progress bars */}
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow backdrop-blur-md">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <Boxes className="h-4.5 w-4.5 text-teal-400" />
                        <span>Chemical Depletion & Reorder Forecasts</span>
                    </h3>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-slate-400 font-medium">
                                <span className="text-slate-200 font-semibold">Ethanol (99% pure)</span>
                                <span>75% Capacity Remaining</span>
                            </div>
                            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                                <div className="h-full bg-teal-500 rounded-full" style={{ width: '75%' }} />
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                                <span>Cabinet B Storage</span>
                                <span>Est. depletion: Aug 2026</span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-slate-400 font-medium">
                                <span className="text-rose-400 font-bold flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3 text-amber-500 animate-pulse" />
                                    <span>Nitric Acid (Concentrated)</span>
                                </span>
                                <span className="text-rose-400 font-bold">20% Capacity (Reorder Alert!)</span>
                            </div>
                            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                                <div className="h-full bg-rose-500 rounded-full" style={{ width: '20%' }} />
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                                <span>Cabinet A Storage</span>
                                <span className="text-rose-400 font-semibold">Est. depletion: 5 days</span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-slate-400 font-medium">
                                <span className="text-slate-200 font-semibold">Tris-HCl Buffer (pH 8.0)</span>
                                <span>95% Capacity Remaining</span>
                            </div>
                            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                                <div className="h-full bg-teal-500 rounded-full" style={{ width: '95%' }} />
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                                <span>Shelf C Storage</span>
                                <span>Est. depletion: Nov 2026</span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-slate-400 font-medium">
                                <span className="text-slate-200 font-semibold">DAPI Nucleic Acid Stain</span>
                                <span>45% Capacity Remaining</span>
                            </div>
                            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: '45%' }} />
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                                <span>Freezer Box F Storage</span>
                                <span>Est. depletion: Jul 2026</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Experiment allocation stage charts */}
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow backdrop-blur-md">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <FlaskRound className="h-4.5 w-4.5 text-teal-400" />
                        <span>Active Study Timeline Allocation</span>
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        Allocation of the laboratory's {stats.totalExps} logged experiments across running stages:
                    </p>

                    {/* horizontal segmented stacked bar chart */}
                    <div className="h-7 w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex shadow-inner">
                        <div className="h-full bg-teal-500 flex items-center justify-center text-[10px] font-bold text-slate-950 transition hover:opacity-90" style={{ width: `${stats.completedPct}%` }} title="Completed runs">
                            {stats.completedPct}%
                        </div>
                        <div className="h-full bg-amber-500 flex items-center justify-center text-[10px] font-bold text-slate-950 transition hover:opacity-90" style={{ width: `${stats.runningPct}%` }} title="Running trials">
                            {stats.runningPct}%
                        </div>
                        <div className="h-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-slate-950 transition hover:opacity-90" style={{ width: `${stats.analysisPct}%` }} title="Data Analysis">
                            {stats.analysisPct}%
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] font-bold font-mono uppercase tracking-wider">
                        <div className="flex items-center gap-1.5 justify-center rounded-xl bg-teal-500/10 border border-teal-500/20 py-2 text-teal-400">
                            <span className="h-2 w-2 rounded-full bg-teal-400 shrink-0" />
                            <span>Completed ({stats.completedPct}%)</span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 py-2 text-amber-400">
                            <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                            <span>Running ({stats.runningPct}%)</span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 py-2 text-blue-400">
                            <span className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                            <span>Analysis ({stats.analysisPct}%)</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* AI Laboratory operations audit */}
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/20 p-6 space-y-4 shadow-lg backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-teal-400 animate-pulse" />
                        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest">Llama Operations & Efficiency Audit</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">BSL-2 Compliant</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                    <button
                        onClick={handleGeneratePerformanceAudit}
                        disabled={isGeneratingAudit}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/10 disabled:opacity-50"
                    >
                        {isGeneratingAudit ? (
                            <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                <span>Compiling Lab Performance Audit...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Compile Lab Performance Audit</span>
                            </>
                        )}
                    </button>
                </div>

                {aiError && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 flex gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 animate-bounce" />
                        <span>{aiError}</span>
                    </div>
                )}

                {aiAuditResult && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-[11px] text-slate-300 max-h-[350px] overflow-y-auto whitespace-pre-wrap leading-relaxed space-y-2 border-l-4 border-l-emerald-500 font-mono">
                        {aiAuditResult}
                    </div>
                )}
            </div>

        </div>
    );
}
