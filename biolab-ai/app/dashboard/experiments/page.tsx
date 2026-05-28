'use client';

import { useState, useEffect, useMemo } from "react";
import {
    Plus,
    Calendar,
    User,
    FileText,
    TrendingUp,
    ShieldAlert,
    Sparkles,
    Trash2,
    Edit2,
    X,
    CheckCircle2,
    RefreshCw,
    Activity,
    AlertTriangle,
    Eye,
    ChevronRight,
    Printer,
    Check,
    Layers,
    ListTodo
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { callGemini } from "@/lib/gemini";

interface DailyLog {
    id: string;
    dayNumber: number;
    date: string;
    od600: number | string; // Optical Density
    ph: number | string;
    yieldPercent: number | string;
    notes: string;
}

interface Experiment {
    id: string;
    name: string;
    lead: string;
    date: string; // YYYY-MM-DD
    stage: "Planning" | "Running" | "Analysis" | "Completed";
    protocolLinked?: string;
    notes?: string;
    dailyLogs: DailyLog[];
    createdAt: string;
}



export default function ExperimentsPage() {
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);
    const [search, setSearch] = useState("");
    const [filterStage, setFilterStage] = useState<string>("All");

    // Modals
    const [showAddForm, setShowAddForm] = useState(false);
    const [showAddLogForm, setShowAddLogForm] = useState(false);
    const [showPrintPreview, setShowPrintPreview] = useState(false);

    // Form: New Experiment
    const [newExp, setNewExp] = useState({
        name: "",
        lead: "",
        date: "",
        stage: "Planning" as Experiment["stage"],
        protocolLinked: "",
        notes: ""
    });

    // Form: Daily Log
    const [newLog, setNewLog] = useState({
        od600: "",
        ph: "",
        yieldPercent: "",
        notes: ""
    });

    // AI States
    const [aiAnomalyResult, setAiAnomalyResult] = useState("");
    const [isDetecting, setIsDetecting] = useState(false);
    const [anomalyError, setAnomalyError] = useState("");

    const [aiSummaryResult, setAiSummaryResult] = useState("");
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summaryError, setSummaryError] = useState("");

    useEffect(() => {
        const hasSeeded = window.localStorage.getItem("biolab.seeding_premium_completed") === "true";
        const stored = window.localStorage.getItem("biolab.experiments_premium");

        if (stored) {
            // If seeding flag is absent, the stored data is legacy stale defaults — wipe it
            if (!hasSeeded) {
                window.localStorage.removeItem("biolab.experiments_premium");
                setExperiments([]);
            } else {
                try {
                    setExperiments(JSON.parse(stored));
                } catch {
                    setExperiments([]);
                }
            }
        } else {
            // No stored data: blank slate for new users
            setExperiments([]);
        }
    }, []);

    // Sync helper
    const saveExperiments = (nextExps: Experiment[]) => {
        setExperiments(nextExps);
        window.localStorage.setItem("biolab.experiments_premium", JSON.stringify(nextExps));

        // Sync with currently selected experiment details
        if (selectedExp) {
            const updated = nextExps.find(x => x.id === selectedExp.id);
            if (updated) setSelectedExp(updated);
        }
    };

    // Filter runs
    const filteredExperiments = useMemo(() => {
        return experiments.filter(exp => {
            const matchesSearch = exp.name.toLowerCase().includes(search.toLowerCase()) ||
                exp.lead.toLowerCase().includes(search.toLowerCase()) ||
                (exp.protocolLinked || "").toLowerCase().includes(search.toLowerCase());
            const matchesStage = filterStage === "All" || exp.stage === filterStage;
            return matchesSearch && matchesStage;
        });
    }, [experiments, search, filterStage]);

    // Stage counts
    const stageCounts = useMemo(() => {
        const counts = { Planning: 0, Running: 0, Analysis: 0, Completed: 0 };
        experiments.forEach(e => {
            if (counts[e.stage] !== undefined) counts[e.stage]++;
        });
        return counts;
    }, [experiments]);

    // Handle new experiment submit
    const handleAddExpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExp.name.trim()) return;

        const created: Experiment = {
            id: `exp-${Date.now()}`,
            ...newExp,
            dailyLogs: [],
            createdAt: new Date().toISOString()
        };

        saveExperiments([created, ...experiments]);
        setNewExp({
            name: "",
            lead: "",
            date: "",
            stage: "Planning",
            protocolLinked: "",
            notes: ""
        });
        setShowAddForm(false);
    };

    // Handle new daily log submit
    const handleAddLogSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExp) return;

        const dayNumber = selectedExp.dailyLogs.length + 1;
        const nowStr = new Date().toISOString().split("T")[0];

        const logEntry: DailyLog = {
            id: `log-${selectedExp.id}-${Date.now()}`,
            dayNumber,
            date: nowStr,
            od600: newLog.od600 || "—",
            ph: newLog.ph || "—",
            yieldPercent: newLog.yieldPercent || "—",
            notes: newLog.notes
        };

        const updatedExps = experiments.map(exp => {
            if (exp.id === selectedExp.id) {
                return { ...exp, dailyLogs: [...exp.dailyLogs, logEntry] };
            }
            return exp;
        });

        saveExperiments(updatedExps);

        // Record general Activity Log
        const storedLogs = window.localStorage.getItem("biolab.activity_logs") || "[]";
        try {
            const parsed = JSON.parse(storedLogs);
            parsed.unshift({
                id: crypto.randomUUID(),
                action: `logged Day ${dayNumber} results for ${selectedExp.name}`,
                module: "Experiments",
                createdAt: new Date().toISOString()
            });
            window.localStorage.setItem("biolab.activity_logs", JSON.stringify(parsed));
        } catch {}

        setNewLog({ od600: "", ph: "", yieldPercent: "", notes: "" });
        setShowAddLogForm(false);
    };

    // Delete experiment run
    const handleDeleteExp = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this experiment run? This will delete all its daily logs!")) {
            saveExperiments(experiments.filter(x => x.id !== id));
            if (selectedExp?.id === id) setSelectedExp(null);
        }
    };

    // Move experiment stage
    const moveExpStage = (id: string, stage: Experiment["stage"]) => {
        const next = experiments.map(x => {
            if (x.id === id) return { ...x, stage };
            return x;
        });
        saveExperiments(next);
    };

    // AI Anomaly Detector
    const runAIAnomalyDetector = async () => {
        if (!selectedExp) return;
        setIsDetecting(true);
        setAnomalyError("");
        setAiAnomalyResult("");

        const logsStr = selectedExp.dailyLogs
            .map(l => `- **Day ${l.dayNumber}** (Date: ${l.date}, OD600: ${l.od600}, pH: ${l.ph}, Yield: ${l.yieldPercent}%, Observation: ${l.notes})`)
            .join("\n");

        const prompt = `You are an advanced biology lab intelligence system specializing in microbiology, cell culture, and assay troubleshooting.
Analyze the following timeline logs for this biological experiment:

Experiment: ${selectedExp.name}
Lead: ${selectedExp.lead}
Linked Protocol: ${selectedExp.protocolLinked || "None"}
Run Description: ${selectedExp.notes || "None"}

**Timeline Logs:**
${logsStr || "No logs submitted yet."}

Perform a deep analysis:
1. Examine key trends: is cell optical density (OD600) scaling normally or stalling? Check for critical drops in pH (standard cell cultures should stay buffered).
2. Spot anomalies or abnormalities: Look for clues like a sudden crash in pH (indicative of lactic acid or organic acid bacterial contamination), stagnant growth curve, or off-spec physical observations (sour smell, media turbidity changes).
3. If an anomaly is spotted, explain what metabolic or physical events (e.g. contamination, media starvation, anaerobic shift) caused it.
4. Output a summary warning rating (Green/Normal, Amber/Caution, or Red/Contamination/Failure Warning) and outline lab troubleshooting adjustments.

Format with beautiful headings, bold bullet markers, and direct answers. Keep it scientific and practical.`;

        try {
            const res = await callGemini(prompt);
            setAiAnomalyResult(res);
        } catch (err) {
            console.error("Anomaly audit failed:", err);
            setAnomalyError(err instanceof Error ? err.message : "Failed to run anomaly audit.");
        } finally {
            setIsDetecting(false);
        }
    };

    // AI Research Summary generator
    const runAIResearchSummary = async () => {
        if (!selectedExp) return;
        setIsSummarizing(true);
        setSummaryError("");
        setAiSummaryResult("");

        const logsStr = selectedExp.dailyLogs
            .map(l => `Day ${l.dayNumber} [OD600: ${l.od600}, pH: ${l.ph}, Yield: ${l.yieldPercent}%]: ${l.notes}`)
            .join("\n");

        const prompt = `You are a molecular biology researcher compiling a formal progress summary report for a lab meeting.
Synthesize the following experiment data into an academic abstract and review:

Experiment Run: ${selectedExp.name}
Lead Scientist: ${selectedExp.lead}
Date Started: ${selectedExp.date}
Linked Protocol: ${selectedExp.protocolLinked || "None"}
Background Details: ${selectedExp.notes || "None"}

Daily Timeline Data:
${logsStr || "No timeline logs recorded."}

Provide a structured document containing:
- ## Executive Summary (Abstract)
- ## Growth Dynamic Analysis (Scientific commentary on the OD600 curve and parameter changes)
- ## Key Research Takeaways
- ## Proposed Next Phase Experiments

Format beautifully for inclusion in our lab documentation.`;

        try {
            const res = await callGemini(prompt);
            setAiSummaryResult(res);
        } catch (err) {
            console.error("AI Research Summary failed:", err);
            setSummaryError(err instanceof Error ? err.message : "Failed to generate research summary.");
        } finally {
            setIsSummarizing(false);
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-400">M4 · Lab Operations</p>
                    <h1 className="mt-1 text-3xl font-bold text-white">Experiment Logger</h1>
                    <p className="mt-1 text-slate-300 text-sm">Log daily parameters (pH, cell growth, yields), track run pipelines, and run AI anomaly checks.</p>
                    <p className="mt-2.5 text-xs text-slate-400 italic max-w-3xl leading-relaxed">
                        The Experiment Logger is a digital lab notebook and analytics workspace that compiles raw replication data, visualizes cell growth trends, and runs Llama-powered diagnostics to instantly spot culture contamination.
                    </p>
                </div>
                <div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-bold text-slate-950 transition shadow-lg shadow-amber-500/20"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Log New Run</span>
                    </button>
                </div>
            </div>

            {/* Pipeline Stage Tabs overview */}
            <div className="grid gap-3 sm:grid-cols-4">
                {(["Planning", "Running", "Analysis", "Completed"] as const).map(stage => {
                    const active = filterStage === stage;
                    return (
                        <button
                            key={stage}
                            onClick={() => setFilterStage(active ? "All" : stage)}
                            className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between h-20 ${
                                active
                                    ? "bg-amber-500/10 border-amber-500 text-amber-400 font-bold"
                                    : "bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700"
                            }`}
                        >
                            <span className="text-xs font-semibold uppercase tracking-wider">{stage} Runs</span>
                            <span className="text-2xl font-bold text-white mt-1">{stageCounts[stage]}</span>
                        </button>
                    );
                })}
            </div>

            {/* Split View */}
            <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
                {/* Left side: Experiment list list */}
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 space-y-4 h-[700px] overflow-y-auto flex flex-col backdrop-blur-md shadow-lg shadow-slate-950/50">
                    <div className="relative">
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search runs, leads, SOPs..."
                            className="w-full text-xs"
                        />
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto">
                        {filteredExperiments.length === 0 ? (
                            <p className="text-slate-500 text-xs text-center py-8">No experiment runs matching filters.</p>
                        ) : (
                            filteredExperiments.map(exp => {
                                const selected = selectedExp?.id === exp.id;
                                return (
                                    <div
                                        key={exp.id}
                                        onClick={() => {
                                            setSelectedExp(exp);
                                            setAiAnomalyResult("");
                                            setAiSummaryResult("");
                                        }}
                                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                                            selected
                                                ? "bg-slate-800/60 border-amber-500/80"
                                                : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                                        }`}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{exp.name}</h4>
                                            <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                                exp.stage === "Planning" ? "bg-slate-500/10 text-slate-400 border border-slate-500/20" :
                                                exp.stage === "Running" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                                exp.stage === "Analysis" ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" :
                                                "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                            }`}>
                                                {exp.stage}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between mt-3 text-[10px] text-slate-300">
                                            <div className="flex items-center gap-1.5">
                                                <User className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="font-semibold text-slate-200">{exp.lead}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="font-semibold text-slate-200">{exp.date}</span>
                                            </div>
                                        </div>

                                        {exp.dailyLogs.length > 0 && (
                                            <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                                                <Activity className="h-3 w-3 text-amber-400" />
                                                <span>{exp.dailyLogs.length} days logged</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right side: Detailed View */}
                {selectedExp ? (
                    <div className="space-y-6">
                        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-6 backdrop-blur-md shadow-lg shadow-slate-950/50">
                            {/* Run Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="text-xl font-bold text-slate-100">{selectedExp.name}</h2>
                                        <Badge variant="success">{selectedExp.stage}</Badge>
                                    </div>
                                    <p className="text-xs text-slate-300">
                                        Lead Scientist: <span className="text-white font-semibold">{selectedExp.lead}</span> | Started: <span className="text-white font-semibold">{selectedExp.date}</span>
                                    </p>
                                    {selectedExp.protocolLinked && (
                                        <p className="text-xs text-slate-400 flex items-center gap-1">
                                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                                            <span>Linked SOP: <span className="text-teal-400 underline font-semibold">{selectedExp.protocolLinked}</span></span>
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {/* Move stage selector */}
                                    <select
                                        value={selectedExp.stage}
                                        onChange={(e) => moveExpStage(selectedExp.id, e.target.value as any)}
                                        className="rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100 outline-none"
                                    >
                                        <option value="Planning">Set to Planning</option>
                                        <option value="Running">Set to Running</option>
                                        <option value="Analysis">Set to Analysis</option>
                                        <option value="Completed">Set to Completed</option>
                                    </select>

                                    <button
                                        onClick={() => setShowPrintPreview(true)}
                                        className="rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 p-2 text-slate-400 hover:text-slate-200 transition"
                                        title="Print Report"
                                    >
                                        <Printer className="h-4 w-4" />
                                    </button>

                                    <button
                                        onClick={(e) => handleDeleteExp(selectedExp.id, e)}
                                        className="rounded-xl border border-slate-700 bg-slate-950 hover:border-rose-500/20 hover:text-rose-400 p-2 text-slate-400 transition"
                                        title="Delete Run"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Run description */}
                            {selectedExp.notes && (
                                <div className="rounded-2xl bg-slate-950/80 p-4 border border-slate-800/80">
                                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Run Overview / Objective</h5>
                                    <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">{selectedExp.notes}</p>
                                </div>
                            )}

                            {/* Daily Logs Timeline Table */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                        <TrendingUp className="h-4 w-4 text-amber-400" />
                                        <span>Daily Logs & Quantitative Parameters</span>
                                    </h4>
                                    {selectedExp.stage === "Running" && (
                                        <button
                                            onClick={() => setShowAddLogForm(true)}
                                            className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/25 px-2.5 py-1 text-[11px] font-bold text-amber-400 transition"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            <span>Add Day Log</span>
                                        </button>
                                    )}
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-800">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-950 text-slate-200 text-[10px] font-semibold uppercase tracking-wider border-b border-slate-800">
                                                <th className="p-3">Day</th>
                                                <th className="p-3">Log Date</th>
                                                <th className="p-3 text-center">OD600 (Cell Density)</th>
                                                <th className="p-3 text-center">pH Level</th>
                                                <th className="p-3 text-center">Product Yield</th>
                                                <th className="p-3">Notes & Observations</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedExp.dailyLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="p-6 text-center text-slate-500 text-xs">
                                                        No results logged yet. Click "Add Day Log" to record today's measurements.
                                                    </td>
                                                </tr>
                                            ) : (
                                                selectedExp.dailyLogs.map(log => (
                                                    <tr key={log.id} className="border-b border-slate-800/40 text-slate-200 hover:bg-slate-800/5 text-xs transition">
                                                        <td className="p-3 font-bold text-amber-400">Day {log.dayNumber}</td>
                                                        <td className="p-3 text-slate-400 text-[11px]">{log.date}</td>
                                                        <td className="p-3 text-center font-mono font-semibold text-slate-100">{log.od600}</td>
                                                        <td className="p-3 text-center font-mono font-semibold text-slate-100">{log.ph}</td>
                                                        <td className="p-3 text-center font-mono font-semibold text-slate-100">
                                                            {log.yieldPercent !== "—" ? `${log.yieldPercent}%` : "—"}
                                                        </td>
                                                        <td className="p-3 text-slate-200 italic">{log.notes}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* AI Split Panel: Anomaly Detector & weekly Summary */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* AI Anomaly Detector Panel */}
                            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/20 p-6 space-y-4 backdrop-blur-md shadow-lg shadow-slate-950/50">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert className="h-5 w-5 text-rose-400" />
                                    <h3 className="text-sm font-bold text-slate-100">AI Biological Anomaly Detector</h3>
                                    <Sparkles className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Run parameter checks across OD600 curves and pH fluctuations to automatically identify biological contaminants or metabolic collapse.
                                </p>

                                <button
                                    onClick={runAIAnomalyDetector}
                                    disabled={isDetecting || selectedExp.dailyLogs.length === 0}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:from-rose-600 hover:to-red-700 shadow-md shadow-rose-500/10 disabled:opacity-50"
                                >
                                    {isDetecting ? (
                                        <>
                                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                            <span>Running Biological Diagnostics...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-3.5 w-3.5" />
                                            <span>Scan for Biological Anomalies</span>
                                        </>
                                    )}
                                </button>

                                {anomalyError && (
                                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 flex gap-2">
                                        <AlertTriangle className="h-4 w-4 shrink-0" />
                                        <span>{anomalyError}</span>
                                    </div>
                                )}

                                {aiAnomalyResult && (
                                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-[11px] text-slate-300 max-h-[300px] overflow-y-auto whitespace-pre-wrap leading-relaxed border-l-4 border-l-rose-500">
                                        {aiAnomalyResult}
                                    </div>
                                )}
                            </div>

                            {/* AI Progress Summary Card */}
                            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 backdrop-blur-md shadow-lg shadow-slate-950/50">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-amber-400" />
                                    <h3 className="text-sm font-bold text-slate-100">AI Progress Reviewer</h3>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Compile daily logs into a formal, structured academic progress review suitable for inclusion in literature references.
                                </p>

                                <button
                                    onClick={runAIResearchSummary}
                                    disabled={isSummarizing || selectedExp.dailyLogs.length === 0}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 transition disabled:opacity-50"
                                >
                                    {isSummarizing ? (
                                        <>
                                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                            <span>Formulating Scientific Report...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Generate Research Progress Review</span>
                                        </>
                                    )}
                                </button>

                                {summaryError && (
                                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 flex gap-2">
                                        <AlertTriangle className="h-4 w-4 shrink-0" />
                                        <span>{summaryError}</span>
                                    </div>
                                )}

                                {aiSummaryResult && (
                                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-[11px] text-slate-300 max-h-[300px] overflow-y-auto whitespace-pre-wrap leading-relaxed border-l-4 border-l-amber-500">
                                        {aiSummaryResult}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-[700px] items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center backdrop-blur-md shadow-lg shadow-slate-950/40">
                        <div className="max-w-sm space-y-3">
                            <Activity className="h-10 w-10 text-slate-600 mx-auto animate-pulse" />
                            <h3 className="text-sm font-bold text-slate-300">No Experiment Selected</h3>
                            <p className="text-xs text-slate-500">
                                Select an active experiment run from the sidebar panel to view parameters, add day logs, or run AI growth anomaly scans.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Log New Run */}
            {showAddForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl relative">
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 transition"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                            <Plus className="h-5 w-5 text-amber-400" />
                            <span>Log New Experiment Run</span>
                        </h3>
                        <form onSubmit={handleAddExpSubmit} className="space-y-4 pt-2">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="space-y-1 block sm:col-span-2">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Experiment Name</span>
                                    <Input
                                        value={newExp.name}
                                        onChange={(e) => setNewExp({ ...newExp, name: e.target.value })}
                                        placeholder="E.g. E. Coli Expression Assay"
                                        required
                                    />
                                </label>

                                <label className="space-y-1 block">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Lead Scientist</span>
                                    <Input
                                        value={newExp.lead}
                                        onChange={(e) => setNewExp({ ...newExp, lead: e.target.value })}
                                        placeholder="Researcher Name"
                                        required
                                    />
                                </label>

                                <label className="space-y-1 block">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Start Date</span>
                                    <Input
                                        type="date"
                                        value={newExp.date}
                                        onChange={(e) => setNewExp({ ...newExp, date: e.target.value })}
                                        required
                                    />
                                </label>

                                <label className="space-y-1 block">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Initial Pipeline Stage</span>
                                    <select
                                        value={newExp.stage}
                                        onChange={(e) => setNewExp({ ...newExp, stage: e.target.value as any })}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                                    >
                                        <option value="Planning">Planning</option>
                                        <option value="Running">Running</option>
                                        <option value="Analysis">Analysis</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </label>

                                <label className="space-y-1 block">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Linked Protocol SOP (Optional)</span>
                                    <Input
                                        value={newExp.protocolLinked}
                                        onChange={(e) => setNewExp({ ...newExp, protocolLinked: e.target.value })}
                                        placeholder="Western blot protocol v2"
                                    />
                                </label>
                            </div>

                            <label className="space-y-1 block">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Background / Objectives</span>
                                <textarea
                                    value={newExp.notes}
                                    onChange={(e) => setNewExp({ ...newExp, notes: e.target.value })}
                                    placeholder="Outline the primary assay variables, cell lines, target concentrations..."
                                    className="min-h-16 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-amber-500"
                                />
                            </label>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="rounded-xl border border-slate-700 bg-transparent hover:bg-slate-800 px-5 py-2 text-xs font-bold text-slate-300 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-amber-500 hover:bg-amber-600 px-6 py-2 text-xs font-bold text-slate-950 transition shadow-lg shadow-amber-500/20"
                                >
                                    Create Run
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Add Day Log */}
            {showAddLogForm && selectedExp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl relative">
                        <button
                            onClick={() => setShowAddLogForm(false)}
                            className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 transition"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                            <Plus className="h-5 w-5 text-amber-400" />
                            <span>Log Day {selectedExp.dailyLogs.length + 1} Metrics</span>
                        </h3>
                        <form onSubmit={handleAddLogSubmit} className="space-y-4 pt-2">
                            <div className="grid gap-3 grid-cols-3">
                                <label className="space-y-1 block">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">OD600 (Density)</span>
                                    <Input
                                        type="text"
                                        value={newLog.od600}
                                        onChange={(e) => setNewLog({ ...newLog, od600: e.target.value })}
                                        placeholder="0.45"
                                    />
                                </label>
                                <label className="space-y-1 block">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">pH Level</span>
                                    <Input
                                        type="text"
                                        value={newLog.ph}
                                        onChange={(e) => setNewLog({ ...newLog, ph: e.target.value })}
                                        placeholder="7.2"
                                    />
                                </label>
                                <label className="space-y-1 block">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Yield %</span>
                                    <Input
                                        type="text"
                                        value={newLog.yieldPercent}
                                        onChange={(e) => setNewLog({ ...newLog, yieldPercent: e.target.value })}
                                        placeholder="12"
                                    />
                                </label>
                            </div>

                            <label className="space-y-1 block">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Observations & Notes</span>
                                <textarea
                                    value={newLog.notes}
                                    onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                                    placeholder="Observations (broth color, physical changes, smell, anomalies)..."
                                    className="min-h-16 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-amber-500"
                                    required
                                />
                            </label>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowAddLogForm(false)}
                                    className="rounded-xl border border-slate-700 bg-transparent hover:bg-slate-800 px-5 py-2 text-xs font-bold text-slate-300 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-amber-500 hover:bg-amber-600 px-6 py-2 text-xs font-bold text-slate-950 transition shadow-lg shadow-amber-500/20"
                                >
                                    Append Day Log
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Academic Printable / Export Layout */}
            {showPrintPreview && selectedExp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 bg-opacity-95 p-4 overflow-y-auto">
                    <div className="w-full max-w-4xl bg-white text-slate-950 rounded-3xl p-8 my-8 shadow-2xl relative flex flex-col gap-6">
                        <button
                            onClick={() => setShowPrintPreview(false)}
                            className="absolute right-6 top-6 bg-slate-100 hover:bg-slate-200 p-2 rounded-full text-slate-700 print:hidden transition"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Printable Print Header */}
                        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-end">
                            <div>
                                <h1 className="text-2xl font-bold font-serif tracking-tight">BIOLAB AI PLATFORM</h1>
                                <p className="text-xs uppercase tracking-widest text-slate-500">Research & Technology Laboratory Run Report</p>
                            </div>
                            <div className="text-right text-[10px] text-slate-400 print:hidden">
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white rounded-xl transition"
                                >
                                    <Printer className="h-4 w-4" />
                                    <span>Print / Export PDF</span>
                                </button>
                            </div>
                        </div>

                        {/* Metadata grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl text-xs border border-slate-200">
                            <div>
                                <span className="font-semibold text-slate-500 uppercase tracking-wider block text-[9px]">Experiment Name</span>
                                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{selectedExp.name}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-slate-500 uppercase tracking-wider block text-[9px]">Lead Scientist</span>
                                <span className="font-bold text-slate-950 block mt-0.5">{selectedExp.lead}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-slate-500 uppercase tracking-wider block text-[9px]">Run Date Started</span>
                                <span className="font-bold text-slate-950 block mt-0.5">{selectedExp.date}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-slate-500 uppercase tracking-wider block text-[9px]">Linked SOP Manual</span>
                                <span className="font-bold text-slate-950 block mt-0.5">{selectedExp.protocolLinked || "None"}</span>
                            </div>
                        </div>

                        {/* Objectives */}
                        {selectedExp.notes && (
                            <div className="space-y-1.5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-1">Run Overview & Directives</h3>
                                <p className="text-xs text-slate-700 leading-relaxed font-serif">{selectedExp.notes}</p>
                            </div>
                        )}

                        {/* Timeline */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-1">Day-by-Day Measurement Log</h3>
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                                        <th className="p-3.5">Day Number</th>
                                        <th className="p-3.5">Log Date</th>
                                        <th className="p-3.5 text-center">OD600 Density</th>
                                        <th className="p-3.5 text-center">pH Value</th>
                                        <th className="p-3.5 text-center">Product Yield</th>
                                        <th className="p-3.5">Observations / Physical Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedExp.dailyLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-6 text-center text-slate-400 italic">No measurement logs registered yet.</td>
                                        </tr>
                                    ) : (
                                        selectedExp.dailyLogs.map(log => (
                                            <tr key={log.id} className="border-b border-slate-200 hover:bg-slate-50 text-slate-800">
                                                <td className="p-3 font-bold text-slate-900">Day {log.dayNumber}</td>
                                                <td className="p-3 text-slate-500">{log.date}</td>
                                                <td className="p-3 text-center font-mono font-semibold text-slate-900">{log.od600}</td>
                                                <td className="p-3 text-center font-mono font-semibold text-slate-900">{log.ph}</td>
                                                <td className="p-3 text-center font-mono font-semibold text-slate-900">
                                                    {log.yieldPercent !== "—" ? `${log.yieldPercent}%` : "—"}
                                                </td>
                                                <td className="p-3 italic text-slate-600 leading-relaxed font-serif">{log.notes}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Signatures printable */}
                        <div className="mt-8 pt-8 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-[11px] text-slate-600">
                            <div className="space-y-12">
                                <div className="border-b border-slate-400 w-48 h-8"></div>
                                <span>Lead Researcher Signature</span>
                            </div>
                            <div className="space-y-12 text-right">
                                <div className="border-b border-slate-400 w-48 h-8 ml-auto"></div>
                                <span>Lab Supervisor Verification Signature</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
