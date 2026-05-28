'use client';

import { useState, useEffect } from "react";
import {
    User,
    Shield,
    Database,
    CheckCircle2,
    RefreshCw,
    Download,
    Award,
    Mail,
    MapPin,
    AlertCircle,
    Sliders,
    Save
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import {
    getStoredLlamaModel,
    setStoredLlamaModel
} from "@/lib/gemini";

export default function ProfilePage() {
    const [selectedModel, setSelectedModel] = useState("meta-llama/llama-3.3-70b-instruct");
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Dynamic profile state loaded from server session
    const [profile, setProfile] = useState<{
        name: string;
        role: string;
        institution: string;
        email: string;
        department: string;
        researchFocus: string;
        certificates: { name: string; authority: string; date: string }[];
    }>({
        name: "Loading...",
        role: "Researcher",
        institution: "BioLab Molecular Institute",
        email: "",
        department: "General Research",
        researchFocus: "Molecular Assay and Gene Replication Studies",
        certificates: []
    });

    // Load active settings from helpers on mount
    useEffect(() => {
        setSelectedModel(getStoredLlamaModel());

        // Fetch authenticated user data dynamically
        fetch("/api/user")
            .then(res => {
                if (res.ok) return res.json();
                throw new Error();
            })
            .then(data => {
                if (data?.user) {
                    const u = data.user;
                    const isYoshika = u.name?.toLowerCase().includes("yoshika");
                    const defaultCerts = isYoshika ? [
                        { name: "BSL-2 Lab Safety Director", authority: "Federal Biosafety Board", date: "Verified" },
                        { name: "GHS Chemical Compliance Auditor", authority: "OSHA Safety Authority", date: "Verified" },
                        { name: "CRISPR Genome Editing License", authority: "Biotech Control Council", date: "Verified" }
                    ] : [
                        { name: "General Laboratory Biosafety Level 1", authority: "Institutional Safety Council", date: "Verified" }
                    ];

                    const focus = isYoshika 
                        ? "CRISPR-Cas9 Specificity & Chemical Toxicity Mitigation Systems"
                        : `${u.role || "Research"} focus on ${u.department || "Molecular Biology"} investigations.`;

                    setProfile({
                        name: u.name || "Researcher",
                        role: u.role ? (u.role.charAt(0).toUpperCase() + u.role.slice(1)) : "Principal Researcher",
                        institution: u.institution || "BioGen Molecular Institute",
                        email: u.email || "",
                        department: u.department || "Molecular Engineering",
                        researchFocus: focus,
                        certificates: defaultCerts
                    });
                }
            })
            .catch(() => {
                setProfile({
                    name: "Guest Researcher",
                    role: "Visitor",
                    institution: "BioLab Institute",
                    email: "",
                    department: "Guest Access",
                    researchFocus: "System Walkthrough & Verification",
                    certificates: []
                });
            });
    }, []);

    // Save platform credentials
    const handleSaveCredentials = () => {
        setIsSaving(true);
        setSaveSuccess(false);

        setTimeout(() => {
            setStoredLlamaModel(selectedModel);
            setIsSaving(false);
            setSaveSuccess(true);

            // Log activity
            const storedLogs = window.localStorage.getItem("biolab.activity_logs") || "[]";
            try {
                const parsed = JSON.parse(storedLogs);
                parsed.unshift({
                    id: crypto.randomUUID(),
                    action: "updated laboratory model target configuration",
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
                    Configure laboratory models, edit biosafety licenses, and execute database backups.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_450px]">
                
                {/* Left Column: API settings, model configurator, DB tools */}
                <div className="space-y-6">
                    
                    {/* AI Assistant configuration panel */}
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-lg backdrop-blur-md">
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            <Sliders className="h-4.5 w-4.5 text-teal-400" />
                            <span>AI Assistant Settings</span>
                        </h3>

                        <div className="space-y-4">
                            <label className="space-y-1 block">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Assistant Intelligence Level</span>
                                <select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-teal-500 font-semibold"
                                >
                                    <option value="meta-llama/llama-3.3-70b-instruct">Standard Academic Focus (Default recommended)</option>
                                    <option value="meta-llama/llama-3.1-405b-instruct">Deep Research Focus (Ultra Rigorous Molecular Analysis)</option>
                                    <option value="meta-llama/llama-3.1-8b-instruct">High Speed Focus (Light & Fast responses)</option>
                                </select>
                            </label>
                        </div>

                        {saveSuccess && (
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex gap-2">
                                <CheckCircle2 className="h-4 w-4 shrink-0 animate-bounce" />
                                <span>AI Assistant configurations updated successfully!</span>
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
                                    <span>Syncing assistant configurations...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="h-3.5 w-3.5" />
                                    <span>Save AI Assistant Settings</span>
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
                            <h2 className="mt-3 text-lg font-bold text-white">{profile.name}</h2>
                            <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mt-0.5">{profile.role}</p>
                            <p className="text-[10px] font-mono text-slate-500 mt-1">{profile.institution}</p>
                        </div>

                        <div className="space-y-3.5 text-[11px] font-medium text-slate-300">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                                <span className="text-slate-400">{profile.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                                <span className="text-slate-400">{profile.department}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Primary Core Research</span>
                                <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">{profile.researchFocus}</p>
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
                            {profile.certificates.map(cert => (
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
