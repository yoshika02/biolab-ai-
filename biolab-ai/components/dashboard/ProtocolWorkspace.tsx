"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type DragEvent } from "react";
import {
    FileText, Plus, Sparkles, Trash2, Upload, X, CheckCircle2,
    ListChecks, TestTube2, FileUp, ChevronRight, Loader2, Key
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { Protocol, ProtocolAIResponse, ProtocolQueryType } from "@/lib/protocol-ai";
import {
    callGemini,
    getStoredOpenRouterKey,
    setStoredOpenRouterKey,
    getStoredLlamaModel,
    setStoredLlamaModel
} from "@/lib/gemini";

type StoredProtocol = Protocol & { id: string; createdAt: string; status: "Draft" | "Ready" | "Archived" };

const storageKey = "biolab.protocols";
const suggestedQuestions = [
    "Give me the full step-by-step breakdown",
    "List total reagents required",
    "Summarize this protocol",
    "What safety precautions are needed?",
];

function readProtocols(): StoredProtocol[] {
    if (typeof window === "undefined") return [];
    try {
        const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((p) => p?.name).map((p) => ({
            id: p.id || crypto.randomUUID(),
            createdAt: p.createdAt || new Date().toISOString(),
            status: p.status || "Draft",
            name: p.name,
            sampleType: p.sampleType || "",
            objective: p.objective || "",
            description: p.description || p.notes || "",
            steps: Array.isArray(p.steps) ? p.steps : [],
            reagents: Array.isArray(p.reagents) ? p.reagents : [],
        }));
    } catch { return []; }
}

async function extractTextFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            // Basic extraction: strip null bytes and non-printable chars for PDFs
            const cleaned = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, "\n").trim();
            resolve(cleaned.slice(0, 8000)); // limit context
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

export function ProtocolWorkspace() {
    const [protocols, setProtocols] = useState<StoredProtocol[]>([]);
    const [selectedId, setSelectedId] = useState("");
    const [query, setQuery] = useState("");
    const [queryType, setQueryType] = useState<ProtocolQueryType>("auto");
    const [aiResponse, setAiResponse] = useState<ProtocolAIResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [ready, setReady] = useState(false);
    const [draft, setDraft] = useState({ name: "", sampleType: "", objective: "", description: "" });
    const [showForm, setShowForm] = useState(false);

    // OpenRouter Settings State
    const [hasOpenRouterKey, setHasOpenRouterKey] = useState(false);
    const [inputOpenRouterKey, setInputOpenRouterKey] = useState("");
    const [llamaModel, setLlamaModel] = useState("meta-llama/llama-3.3-70b-instruct");
    const [showKeySetup, setShowKeySetup] = useState(false);

    useEffect(() => {
        const openrouterKey = getStoredOpenRouterKey();
        setHasOpenRouterKey(!!openrouterKey);
        setInputOpenRouterKey(openrouterKey);
        setLlamaModel(getStoredLlamaModel());
    }, []);

    function handleSaveEngineSettings(e: React.FormEvent) {
        e.preventDefault();
        
        // Save OpenRouter key
        setStoredOpenRouterKey(inputOpenRouterKey);
        setHasOpenRouterKey(!!inputOpenRouterKey.trim());

        // Save model settings
        setStoredLlamaModel(llamaModel);

        setShowKeySetup(false);
    }

    // PDF Upload state
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadedText, setUploadedText] = useState("");
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const saved = readProtocols();
        setProtocols(saved);
        setSelectedId(saved[0]?.id || "");
        setReady(true);
    }, []);


    useEffect(() => {
        if (!ready) return;
        window.localStorage.setItem(storageKey, JSON.stringify(protocols));
    }, [protocols, ready]);

    const selectedProtocol = useMemo(
        () => protocols.find((p) => p.id === selectedId) || null,
        [protocols, selectedId]
    );

    function createProtocol(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!draft.name.trim()) return;
        const p: StoredProtocol = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            status: "Draft",
            name: draft.name.trim(),
            sampleType: draft.sampleType.trim(),
            objective: draft.objective.trim(),
            description: draft.description.trim(),
            steps: [],
            reagents: [],
        };
        setProtocols((cur) => [p, ...cur]);
        setSelectedId(p.id);
        setDraft({ name: "", sampleType: "", objective: "", description: "" });
        setShowForm(false);
    }

    function updateSelected(next: StoredProtocol) {
        setProtocols((cur) => cur.map((p) => (p.id === next.id ? next : p)));
    }

    function deleteProtocol(id: string) {
        setProtocols((cur) => cur.filter((p) => p.id !== id));
        setSelectedId((cur) => (cur === id ? protocols.find((p) => p.id !== id)?.id || "" : cur));
    }

    async function processUploadedFile(file: File) {
        setUploadLoading(true);
        setUploadError("");
        setUploadedText("");
        setUploadedFile(file);
        try {
            const text = await extractTextFromFile(file);
            if (!text || text.length < 30) throw new Error("Could not extract readable text. Try a plain-text PDF or .txt file.");
            setUploadedText(text);
            // Auto-create a protocol from the file
            const p: StoredProtocol = {
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                status: "Draft",
                name: file.name.replace(/\.[^/.]+$/, ""),
                sampleType: "",
                objective: "Imported from document",
                description: text.slice(0, 300),
                steps: [],
                reagents: [],
            };
            setProtocols((cur) => [p, ...cur]);
            setSelectedId(p.id);
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : "Failed to read file.");
        } finally {
            setUploadLoading(false);
        }
    }

    function handleFileDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files[0];
        if (file) processUploadedFile(file);
    }

    function handleFileInput(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (file) processUploadedFile(file);
    }

    async function askAI(event?: FormEvent<HTMLFormElement>, forcedQuestion?: string) {
        event?.preventDefault();
        const question = forcedQuestion || query;
        if (!question.trim()) return;
        setLoading(true);
        setError("");
        setAiResponse(null);

        try {
            // Build the protocol context — use uploaded text if available
            const protocol: Protocol = selectedProtocol
                ? { ...selectedProtocol, description: uploadedText || selectedProtocol.description }
                : { name: uploadedFile?.name || "Uploaded Document", description: uploadedText };

            const steps = (protocol.steps || [])
                .map((s, i) => `${i + 1}. ${s.instruction}${s.duration_min ? ` (${s.duration_min} min)` : ""}${s.notes ? ` — ${s.notes}` : ""}`)
                .join("\n");
            const reagents = (protocol.reagents || [])
                .map((r) => `- ${r.name}${r.quantity ? ` ${r.quantity}${r.unit || ""}` : ""}${r.supplier ? ` (${r.supplier})` : ""}`)
                .join("\n");

            const prompt = `You are an expert biomedical lab assistant helping a researcher with their lab protocol.

Protocol Name: ${protocol.name}
${protocol.objective ? `Objective: ${protocol.objective}` : ""}
${protocol.sampleType ? `Sample Type: ${protocol.sampleType}` : ""}
${protocol.description ? `Description: ${protocol.description}` : ""}
${steps ? `\nProtocol Steps:\n${steps}` : "No steps defined yet."}
${reagents ? `\nReagents/Materials:\n${reagents}` : "No reagents defined yet."}

User Question: ${question}

Provide a thorough, structured, practical answer. Use ## headings, bullet points (- ), and numbered lists where appropriate. Be specific to this protocol.`;

            const content = await callGemini(prompt);
            setAiResponse({ type: "instructions", content });
            setQuery(question);
        } catch (err) {
            if (err instanceof Error && err.message === 'API_KEY_MISSING') {
                setShowKeySetup(true);
                setError("Please configure your OpenRouter API Key first.");
            } else {
                setError(err instanceof Error ? err.message : "Failed to generate response");
            }
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
            {/* ── Left sidebar ── */}
            <aside className="space-y-4">
                {/* PDF Upload Zone */}
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 space-y-3">
                    <div className="flex items-center gap-2">
                        <FileUp className="h-4 w-4 text-teal-400" />
                        <p className="text-sm font-semibold text-slate-200">Import Document</p>
                    </div>
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleFileDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition ${
                            isDragging ? "border-teal-500 bg-teal-500/10" : "border-slate-700 bg-slate-800/50 hover:border-teal-500/50 hover:bg-teal-500/5"
                        }`}
                    >
                        <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.csv,.doc,.docx" className="hidden" onChange={handleFileInput} />
                        {uploadLoading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 text-teal-500 animate-spin" />
                                <p className="text-xs text-slate-400">Reading document…</p>
                            </div>
                        ) : uploadedFile && uploadedText ? (
                            <div className="flex flex-col items-center gap-2">
                                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                <p className="text-xs font-semibold text-slate-200">{uploadedFile.name}</p>
                                <p className="text-xs text-slate-500">{uploadedText.length.toLocaleString()} chars extracted</p>
                                <button onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setUploadedText(""); }} className="text-xs text-rose-500 hover:underline flex items-center gap-1">
                                    <X className="h-3 w-3" /> Remove
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Upload className="h-8 w-8 text-slate-600" />
                                <p className="text-xs font-medium text-slate-400">Drag & drop or click</p>
                                <p className="text-xs text-slate-600">PDF, TXT, MD, CSV, DOC</p>
                            </div>
                        )}
                    </div>
                    {uploadError && <p className="text-xs text-rose-400 bg-rose-500/10 rounded-xl px-3 py-2">{uploadError}</p>}
                    {uploadedText && (
                        <p className="text-xs text-slate-500 italic line-clamp-3">"{uploadedText.slice(0, 150)}…"</p>
                    )}
                </div>

                {/* Protocol Library */}
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-200">Protocol Library</p>
                        <button onClick={() => setShowForm((v) => !v)} className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500 text-white hover:bg-teal-600 transition">
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>

                    {showForm && (
                        <form onSubmit={createProtocol} className="space-y-2 border-t border-slate-800 pt-3">
                            <Input placeholder="Protocol name *" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
                            <Input placeholder="Sample type" value={draft.sampleType} onChange={(e) => setDraft({ ...draft, sampleType: e.target.value })} />
                            <Input placeholder="Objective" value={draft.objective} onChange={(e) => setDraft({ ...draft, objective: e.target.value })} />
                            <textarea
                                className="min-h-16 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                                placeholder="Short SOP description"
                                value={draft.description}
                                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                            />
                            <div className="flex gap-2">
                                <Button type="submit" className="flex-1 gap-2 text-sm"><Plus className="h-4 w-4" />Add</Button>
                                <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="text-sm">Cancel</Button>
                            </div>
                        </form>
                    )}

                    <div className="space-y-2">
                        {protocols.length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-4">No protocols yet. Upload a document or create one above.</p>
                        )}
                        {protocols.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedId(p.id)}
                                className={`group w-full rounded-2xl border p-3 text-left transition ${selectedId === p.id ? "border-teal-500 bg-teal-500/10" : "border-slate-800 bg-slate-800/50 hover:border-slate-700"}`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-100">{p.name}</p>
                                        <p className="truncate text-xs text-slate-500">{p.sampleType || "No sample type"}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Badge variant={p.status === "Ready" ? "success" : "default"}>{p.status}</Badge>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); deleteProtocol(p.id); }} className="opacity-0 group-hover:opacity-100 rounded-full p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* ── Main content ── */}
            <main className="space-y-6">
                {/* AI Query Panel */}
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">M1 · Protocol Assistant</p>
                            <h2 className="text-lg font-bold text-white">
                                {selectedProtocol ? selectedProtocol.name : uploadedFile ? uploadedFile.name : "AI Protocol Analyzer"}
                            </h2>
                        </div>
                        {selectedProtocol && (
                            <div className="ml-auto flex gap-2">
                                <Badge>{selectedProtocol.steps?.length || 0} steps</Badge>
                                <Badge>{selectedProtocol.reagents?.length || 0} reagents</Badge>
                            </div>
                        )}
                        <button
                            onClick={() => setShowKeySetup(!showKeySetup)}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold border transition ${
                                hasOpenRouterKey
                                    ? 'border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20' 
                                    : 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                            }`}
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>
                                OpenRouter Llama Configured
                            </span>
                        </button>
                    </div>

                    {/* API Key / Engine Settings Setup Panel */}
                    {(!hasOpenRouterKey || showKeySetup) && (
                        <div className="rounded-3xl border border-teal-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/20 p-6 space-y-6 shadow-2xl transition duration-300">
                            {/* Panel Header */}
                            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                                <div className="flex gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-100">AI Model Settings</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Configure your OpenRouter API key and select a Llama model.
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setShowKeySetup(false)} 
                                    className="rounded-full p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveEngineSettings} className="space-y-5">
                                {/* 1. API Key Input */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">OpenRouter API Key (Llama)</label>
                                        <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-[10px] text-teal-400 hover:underline">Get Key</a>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={inputOpenRouterKey}
                                            onChange={(e) => setInputOpenRouterKey(e.target.value)}
                                            placeholder="sk-or-... (Saved in Local Storage)"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none"
                                            required
                                        />
                                        {hasOpenRouterKey && (
                                            <span className="absolute right-3 top-2.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">Configured</span>
                                        )}
                                    </div>
                                </div>

                                {/* 2. Llama Model selection */}
                                <div className="space-y-2 pt-1">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Llama Model Engine</label>
                                    <select
                                        value={llamaModel}
                                        onChange={(e) => setLlamaModel(e.target.value)}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-teal-500"
                                    >
                                        <option value="meta-llama/llama-3.3-70b-instruct">Meta Llama 3.3 70B Instruct (Recommended)</option>
                                        <option value="meta-llama/llama-3.1-8b-instruct:free">Meta Llama 3.1 8B Instruct (Free)</option>
                                        <option value="meta-llama/llama-3-8b-instruct:free">Meta Llama 3 8B Instruct (Free)</option>
                                    </select>
                                </div>

                                {/* Form Action Buttons */}
                                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowKeySetup(false)} 
                                        className="rounded-xl border border-slate-700 bg-transparent hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-300 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="rounded-xl bg-teal-500 hover:bg-teal-600 px-6 py-2.5 text-xs font-bold text-slate-950 transition shadow-lg shadow-teal-500/20"
                                    >
                                        Apply Settings
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {!selectedProtocol && !uploadedText && (
                        <div className="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-800/30 p-8 text-center space-y-2">
                            <FileText className="h-10 w-10 text-slate-600 mx-auto" />
                            <p className="text-sm font-medium text-slate-400">Upload a document or select a protocol to start querying</p>
                            <p className="text-xs text-slate-600">Supports PDF, TXT, DOC, and manually created SOPs</p>
                        </div>
                    )}

                    {(selectedProtocol || uploadedText) && (
                        <>
                            <form onSubmit={askAI} className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
                                <select
                                    className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-teal-500"
                                    value={queryType}
                                    onChange={(e) => setQueryType(e.target.value as ProtocolQueryType)}
                                >
                                    <option value="auto">Auto detect</option>
                                    <option value="steps">Steps breakdown</option>
                                    <option value="reagents">Total reagents</option>
                                    <option value="instructions">Instructions</option>
                                    <option value="summary">Summary</option>
                                </select>
                                <Input
                                    placeholder={uploadedText ? "Ask anything about the uploaded document…" : "Ask for steps, reagents, instructions, or a summary"}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <Button type="submit" disabled={loading} className="gap-2 whitespace-nowrap">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                    {loading ? "Analyzing…" : "Ask AI"}
                                </Button>
                            </form>

                            <div className="flex flex-wrap gap-2">
                                {suggestedQuestions.map((q) => (
                                    <button
                                        key={q}
                                        type="button"
                                        onClick={() => askAI(undefined, q)}
                                        className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-teal-500/50 hover:bg-teal-500/10 hover:text-teal-400"
                                    >
                                        <ChevronRight className="h-3 w-3" />{q}
                                    </button>
                                ))}
                            </div>

                            {error && <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-sm text-rose-400">{error}</div>}

                            {aiResponse && (
                                <div className="rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 to-slate-900 p-6 space-y-3">
                                    <div className="flex items-center gap-2 mb-4">
                                        {aiResponse.type === "reagents"
                                            ? <TestTube2 className="h-5 w-5 text-teal-600" />
                                            : <ListChecks className="h-5 w-5 text-teal-600" />}
                                        <Badge variant="success">{aiResponse.type}</Badge>
                                        <span className="text-xs text-slate-400 ml-auto">AI Generated · Gemini</span>
                                    </div>
                                    <div className="space-y-2">
                                        {aiResponse.content.split('\n').map((line, i) => {
                                            if (line.startsWith('## ')) return <h3 key={i} className="text-base font-bold text-slate-100 mt-4 mb-1">{line.slice(3)}</h3>;
                                            if (line.startsWith('# ')) return <h2 key={i} className="text-lg font-bold text-white mt-4 mb-2">{line.slice(2)}</h2>;
                                            if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-slate-200">{line.slice(2, -2)}</p>;
                                            if (line.startsWith('- ') || line.startsWith('* ')) return <div key={i} className="flex gap-2 text-slate-300 text-sm"><span className="text-teal-400 mt-0.5 shrink-0">•</span><span>{line.slice(2)}</span></div>;
                                            if (/^\d+\.\s/.test(line)) return <div key={i} className="flex gap-2 text-slate-300 text-sm ml-1"><span className="font-semibold text-teal-400 shrink-0">{line.match(/^\d+/)?.[0]}.</span><span>{line.replace(/^\d+\.\s/, '')}</span></div>;
                                            if (!line.trim()) return <div key={i} className="h-1" />;
                                            return <p key={i} className="text-slate-300 text-sm leading-relaxed">{line}</p>;
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Steps & Reagents */}
                {selectedProtocol && (
                    <div className="grid gap-6 xl:grid-cols-2">
                        <ProtocolSteps protocol={selectedProtocol} onChange={updateSelected} />
                        <ProtocolReagents protocol={selectedProtocol} onChange={updateSelected} />
                    </div>
                )}
            </main>
        </div>
    );
}

function ProtocolSteps({ protocol, onChange }: { protocol: StoredProtocol; onChange: (p: StoredProtocol) => void }) {
    const steps = protocol.steps || [];
    function addStep() {
        onChange({ ...protocol, steps: [...steps, { order_num: steps.length + 1, instruction: "", duration_min: undefined, notes: "" }] });
    }
    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-100">Step Viewer</h3>
                <Button type="button" variant="secondary" onClick={addStep} className="gap-2 text-sm"><Plus className="h-4 w-4" />Add Step</Button>
            </div>
            <div className="space-y-3">
                {steps.map((step, i) => (
                    <div key={i} className="rounded-2xl border border-slate-800 bg-slate-800/50 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-xs font-bold text-teal-400">{i + 1}</span>
                            <Input
                                placeholder="Instruction"
                                value={step.instruction}
                                onChange={(e) => {
                                    const next = [...steps];
                                    next[i] = { ...step, instruction: e.target.value };
                                    onChange({ ...protocol, steps: next });
                                }}
                            />
                            <button type="button" onClick={() => onChange({ ...protocol, steps: steps.filter((_, j) => j !== i).map((s, j) => ({ ...s, order_num: j + 1 })) })} className="rounded-full p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 pl-9">
                            <Input type="number" placeholder="Minutes" value={step.duration_min ?? ""} onChange={(e) => {
                                const next = [...steps];
                                next[i] = { ...step, duration_min: e.target.value ? Number(e.target.value) : undefined };
                                onChange({ ...protocol, steps: next });
                            }} />
                            <Input placeholder="Notes / precautions" value={step.notes || ""} onChange={(e) => {
                                const next = [...steps];
                                next[i] = { ...step, notes: e.target.value };
                                onChange({ ...protocol, steps: next });
                            }} />
                        </div>
                    </div>
                ))}
                {!steps.length && <p className="text-sm text-slate-500 text-center py-4">No steps yet. Add the first step above.</p>}
            </div>
        </div>
    );
}

function ProtocolReagents({ protocol, onChange }: { protocol: StoredProtocol; onChange: (p: StoredProtocol) => void }) {
    const reagents = protocol.reagents || [];
    function addReagent() {
        onChange({ ...protocol, reagents: [...reagents, { name: "", quantity: undefined, unit: "ml", supplier: "", notes: "" }] });
    }
    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-100">Reagents</h3>
                <Button type="button" variant="secondary" onClick={addReagent} className="gap-2 text-sm"><Plus className="h-4 w-4" />Add Reagent</Button>
            </div>
            <div className="space-y-3">
                {reagents.map((reagent, i) => (
                    <div key={i} className="rounded-2xl border border-slate-800 bg-slate-800/50 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                            <Input placeholder="Reagent name" value={reagent.name} onChange={(e) => {
                                const next = [...reagents];
                                next[i] = { ...reagent, name: e.target.value };
                                onChange({ ...protocol, reagents: next });
                            }} />
                            <button type="button" onClick={() => onChange({ ...protocol, reagents: reagents.filter((_, j) => j !== i) })} className="rounded-full p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                            <Input type="number" placeholder="Quantity" value={reagent.quantity ?? ""} onChange={(e) => {
                                const next = [...reagents];
                                next[i] = { ...reagent, quantity: e.target.value ? Number(e.target.value) : undefined };
                                onChange({ ...protocol, reagents: next });
                            }} />
                            <Input placeholder="Unit (ml, g…)" value={reagent.unit || ""} onChange={(e) => {
                                const next = [...reagents];
                                next[i] = { ...reagent, unit: e.target.value };
                                onChange({ ...protocol, reagents: next });
                            }} />
                            <Input placeholder="Supplier" value={reagent.supplier || ""} onChange={(e) => {
                                const next = [...reagents];
                                next[i] = { ...reagent, supplier: e.target.value };
                                onChange({ ...protocol, reagents: next });
                            }} />
                        </div>
                    </div>
                ))}
                {!reagents.length && <p className="text-sm text-slate-500 text-center py-4">No reagents yet. Add materials above.</p>}
            </div>
        </div>
    );
}
