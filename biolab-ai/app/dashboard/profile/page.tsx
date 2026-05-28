'use client';

import { useState, useEffect } from "react";
import {
    User,
    Shield,
    Key,
    Database,
    CheckCircle2,
    RefreshCw,
    Download,
    Eye,
    EyeOff,
    Award,
    Mail,
    MapPin,
    AlertCircle,
    Sliders,
    Save
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import {
    getStoredOpenRouterKey,
    setStoredOpenRouterKey,
    getStoredLlamaModel,
    setStoredLlamaModel
} from "@/lib/gemini";

export default function ProfilePage() {
    const [apiKey, setApiKey] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [selectedModel, setSelectedModel] = useState("meta-llama/llama-3.3-70b-instruct");
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // User bio information
    const userProfile = {
        name: "Dr. Yoshika",
        role: "Principal Investigator & Laboratory Director",
        institution: "BioGen Molecular Institute",
        email: "yoshika@biogen-molecular.org",
        location: "Gene Design Suite, Bay 4",
        researchFocus: "CRISPR-Cas9 Specificity & Chemical Toxicity Mitigation Systems",
        certificates: [
            { name: "BSL-2 Lab Safety Director", authority: "Federal Biosafety Board", date: "Verified" },
            { name: "GHS Chemical Compliance Auditor", authority: "OSHA Safety Authority", date: "Verified" },
            { name: "CRISPR Genome Editing License", authority: "Biotech Control Council", date: "Verified" }
        ]
    };

    // Load active settings from helpers on mount
    useEffect(() => {
        setApiKey(getStoredOpenRouterKey());
        setSelectedModel(getStoredLlamaModel());
    }, []);

    // Save platform credentials
    const handleSaveCredentials = () => {
        setIsSaving(true);
        setSaveSuccess(false);

        setTimeout(() => {
            setStoredOpenRouterKey(apiKey);
            setStoredLlamaModel(selectedModel);
            setIsSaving(false);
            setSaveSuccess(true);

            // Log activity
            const storedLogs = window.localStorage.getItem("biolab.activity_logs") || "[]";
            try {
                const parsed = JSON.parse(storedLogs);
                parsed.unshift({
                    id: crypto.randomUUID(),
                    action: "updated openrouter platform credentials",
                    module: "Profile",
                    createdAt: new Date().toISOString()
                });
                window.localStorage.setItem("biolab.activity_logs", JSON.stringify(parsed));
            } catch {}

            setTimeout(() => setSaveSuccess(false), 3000);
        }, 800);
    };

    // Database Reset utility
    const handleResetDatabase = () => {
        if (confirm("WARNING: This will permanently wipe all local storage data (inventory, logged experiments, and designed primers) and re-initialize it with the pristine seed data database. Proceed?")) {
            window.localStorage.removeItem("biolab.seeding_premium_completed");
            window.localStorage.removeItem("biolab.inventory_premium");
            window.localStorage.removeItem("biolab.experiments_premium");
            window.localStorage.removeItem("biolab.primers_premium");
            window.localStorage.removeItem("biolab.activity_logs");
            window.localStorage.removeItem("biolab.risk_register_reviews");
            
            // Reload page to trigger re-seeding
            window.location.reload();
        }
    };

    // Database Download JSON backup utility
    const handleDownloadBackup = () => {
        const backupData: Record<string, string | null> = {
            inventory: window.localStorage.getItem("biolab.inventory_premium"),
            experiments: window.localStorage.getItem("biolab.experiments_premium"),
            primers: window.localStorage.getItem("biolab.primers_premium"),
            activityLogs: window.localStorage.getItem("biolab.activity_logs"),
            safetyReviews: window.localStorage.getItem("biolab.risk_register_reviews")
        };

        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 4))}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", jsonString);
        downloadAnchor.setAttribute("download", `biolab_db_backup_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div>
                <p className="text-xs font-bold uppercase tracking-widest text-teal-400 font-mono">M8 · Platform Profile</p>
                <h1 className="mt-1 text-3xl font-bold text-white">Researcher Profile & Settings</h1>
                <p className="mt-1 text-slate-300 text-sm">
                    Configure laboratory credentials, edit biosafety licenses, toggle OpenRouter key targets, and execute database backups.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_450px]">
                
                {/* Left Column: API settings, model configurator, DB tools */}
                <div className="space-y-6">
                    
                    {/* API keys credentials form */}
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-lg backdrop-blur-md">
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            <Key className="h-4.5 w-4.5 text-teal-400" />
                            <span>AI Services & LLM Settings</span>
                        </h3>

                        <div className="space-y-4">
                            <label className="space-y-1 block relative">
                                <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                    <span>OpenRouter API Key</span>
                                    <button
                                        onClick={() => setShowKey(!showKey)}
                                        className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-bold"
                                    >
                                        {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                        <span>{showKey ? "Hide" : "Show"}</span>
                                    </button>
                                </div>
                                <Input
                                    type={showKey ? "text" : "password"}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="sk-or-v1-..."
                                    className="font-mono text-xs"
                                />
                                <span className="text-[10px] text-slate-500 font-medium leading-relaxed block mt-1">
                                    Required for AI protocol searches, PCR Oligo reviews, and active Chemical Safety compatibility checks. Saved locally to your browser.
                                </span>
                            </label>

                            <label className="space-y-1 block">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Llama Model Target</span>
                                <select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-teal-500 font-semibold"
                                >
                                    <option value="meta-llama/llama-3.3-70b-instruct">Llama 3.3 70B Instruct (Default recommended)</option>
                                    <option value="meta-llama/llama-3.1-405b-instruct">Llama 3.1 405B Instruct (Ultra Rigorous Molecular Analysis)</option>
                                    <option value="meta-llama/llama-3.1-8b-instruct">Llama 3.1 8B Instruct (Light & Fast responses)</option>
                                </select>
                            </label>
                        </div>

                        {saveSuccess && (
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex gap-2">
                                <CheckCircle2 className="h-4 w-4 shrink-0 animate-bounce" />
                                <span>Platform configurations updated successfully!</span>
                            </div>
                        )}

                        <button
                            onClick={handleSaveCredentials}
                            disabled={isSaving}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 text-xs font-bold text-slate-950 transition hover:bg-teal-600 shadow-md disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    <span>Syncing platform credentials...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="h-3.5 w-3.5" />
                                    <span>Save Platform Credentials</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Database management tools */}
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-lg backdrop-blur-md">
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            <Database className="h-4.5 w-4.5 text-teal-400" />
                            <span>Database Backup & Management</span>
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                            Manage the persistent BioLab AI state machine. Export raw JSON dumps containing logged experiments, material stocks, and designed PCR oligos.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-3 pt-2">
                            <button
                                onClick={handleDownloadBackup}
                                className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-bold text-slate-300 hover:bg-slate-900 hover:text-white transition"
                            >
                                <Download className="h-4 w-4 text-emerald-400" />
                                <span>Download Lab JSON</span>
                            </button>
                            <button
                                onClick={handleResetDatabase}
                                className="flex items-center justify-center gap-2 rounded-xl border border-slate-850 bg-rose-950/20 text-rose-400 p-3 text-xs font-bold hover:bg-rose-950/40 transition"
                            >
                                <RefreshCw className="h-4 w-4 text-rose-500 animate-spin" style={{ animationDuration: '6s' }} />
                                <span>Reset Lab Database</span>
                            </button>
                        </div>
                    </div>

                </div>

                {/* Right Column: Profile & certified biosafety badges */}
                <div className="space-y-6">
                    
                    {/* Researcher Bio */}
                    <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 space-y-5 shadow-lg">
                        <div className="flex flex-col items-center text-center pb-4 border-b border-slate-900">
                            <div className="h-20 w-20 rounded-full border border-teal-500/40 bg-teal-500/10 flex items-center justify-center text-teal-400 shadow-md">
                                <User className="h-10 w-10" />
                            </div>
                            <h2 className="mt-3 text-lg font-bold text-white">{userProfile.name}</h2>
                            <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mt-0.5">{userProfile.role}</p>
                            <p className="text-[10px] font-mono text-slate-500 mt-1">{userProfile.institution}</p>
                        </div>

                        <div className="space-y-3.5 text-[11px] font-medium text-slate-300">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                                <span className="text-slate-400">{userProfile.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                                <span className="text-slate-400">{userProfile.location}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Primary Core Research</span>
                                <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">{userProfile.researchFocus}</p>
                            </div>
                        </div>
                    </div>

                    {/* Verified licenses */}
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-lg backdrop-blur-md">
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            <Award className="h-4.5 w-4.5 text-teal-400" />
                            <span>Biosafety Verifications</span>
                        </h3>

                        <div className="space-y-2.5">
                            {userProfile.certificates.map(cert => (
                                <div key={cert.name} className="flex items-center justify-between rounded-xl border border-slate-900 bg-slate-950 p-3 hover:border-slate-800 transition">
                                    <div>
                                        <div className="text-xs font-bold text-slate-200">{cert.name}</div>
                                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">{cert.authority}</div>
                                    </div>
                                    <span className="rounded bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                                        <CheckCircle2 className="h-2.5 w-2.5" />
                                        <span>{cert.date}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
