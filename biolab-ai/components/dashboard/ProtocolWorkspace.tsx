"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ListChecks, Plus, Sparkles, TestTube2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { Protocol, ProtocolAIResponse, ProtocolQueryType } from "@/lib/protocol-ai";

type StoredProtocol = Protocol & { id: string; createdAt: string; status: "Draft" | "Ready" | "Archived" };

const storageKey = "biolab.protocols";
const suggestedQuestions = [
    "Give me the full step-by-step breakdown",
    "List total reagents required",
    "Summarize this protocol",
];

function readProtocols(): StoredProtocol[] {
    if (typeof window === "undefined") return [];
    try {
        const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((protocol) => protocol?.name)
            .map((protocol) => ({
                id: protocol.id || crypto.randomUUID(),
                createdAt: protocol.createdAt || new Date().toISOString(),
                status: protocol.status || "Draft",
                name: protocol.name,
                sampleType: protocol.sampleType || "",
                objective: protocol.objective || "",
                description: protocol.description || protocol.notes || "",
                steps: Array.isArray(protocol.steps) ? protocol.steps : [],
                reagents: Array.isArray(protocol.reagents) ? protocol.reagents : [],
            }));
    } catch {
        return [];
    }
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
        () => protocols.find((protocol) => protocol.id === selectedId) || null,
        [protocols, selectedId]
    );

    function createProtocol(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!draft.name.trim()) return;

        const protocol: StoredProtocol = {
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

        setProtocols((current) => [protocol, ...current]);
        setSelectedId(protocol.id);
        setDraft({ name: "", sampleType: "", objective: "", description: "" });
    }

    function updateSelected(nextProtocol: StoredProtocol) {
        setProtocols((current) => current.map((protocol) => (protocol.id === nextProtocol.id ? nextProtocol : protocol)));
    }

    function addStep() {
        if (!selectedProtocol) return;
        const steps = selectedProtocol.steps || [];
        updateSelected({
            ...selectedProtocol,
            steps: [...steps, { order_num: steps.length + 1, instruction: "", duration_min: undefined, notes: "" }],
        });
    }

    function addReagent() {
        if (!selectedProtocol) return;
        updateSelected({
            ...selectedProtocol,
            reagents: [...(selectedProtocol.reagents || []), { name: "", quantity: undefined, unit: "ml", supplier: "", notes: "" }],
        });
    }

    async function askAI(event?: FormEvent<HTMLFormElement>, forcedQuestion?: string) {
        event?.preventDefault();
        const question = forcedQuestion || query;
        if (!selectedProtocol || !question.trim()) return;

        setLoading(true);
        setError("");
        setAiResponse(null);

        try {
            const response = await fetch("/api/protocol/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ protocol: selectedProtocol, query: question, queryType }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Failed to generate response");
            setAiResponse(result);
            setQuery(question);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate response");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
            <aside className="space-y-4">
                <Card className="space-y-4 rounded-lg">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">M1 Protocol Assistant</p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-950">Protocol Library</h2>
                    </div>
                    <form onSubmit={createProtocol} className="space-y-3">
                        <Input placeholder="Protocol name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required />
                        <Input placeholder="Sample type" value={draft.sampleType} onChange={(event) => setDraft({ ...draft, sampleType: event.target.value })} />
                        <Input placeholder="Objective" value={draft.objective} onChange={(event) => setDraft({ ...draft, objective: event.target.value })} />
                        <textarea
                            className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                            placeholder="Short SOP description"
                            value={draft.description}
                            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                        />
                        <Button type="submit" className="w-full gap-2"><Plus className="h-4 w-4" />New protocol</Button>
                    </form>
                </Card>

                <div className="space-y-2">
                    {protocols.map((protocol) => (
                        <button
                            key={protocol.id}
                            onClick={() => setSelectedId(protocol.id)}
                            className={`w-full rounded-lg border p-4 text-left transition ${selectedId === protocol.id ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-semibold text-slate-950">{protocol.name}</p>
                                    <p className="mt-1 text-sm text-slate-500">{protocol.sampleType || "No sample type"}</p>
                                </div>
                                <Badge variant={protocol.status === "Ready" ? "success" : "default"}>{protocol.status}</Badge>
                            </div>
                        </button>
                    ))}
                </div>
            </aside>

            {selectedProtocol ? (
                <main className="space-y-6">
                    <Card className="space-y-5 rounded-lg">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Selected SOP</p>
                                <h2 className="mt-1 text-2xl font-semibold text-slate-950">{selectedProtocol.name}</h2>
                                <p className="mt-2 max-w-3xl text-sm text-slate-600">{selectedProtocol.description || selectedProtocol.objective || "Add steps and reagents to make this protocol query-ready."}</p>
                            </div>
                            <div className="flex gap-2">
                                <Badge>{selectedProtocol.steps?.length || 0} steps</Badge>
                                <Badge>{selectedProtocol.reagents?.length || 0} reagents</Badge>
                            </div>
                        </div>

                        <form onSubmit={askAI} className="grid gap-3 lg:grid-cols-[180px_1fr_auto]">
                            <select
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                                value={queryType}
                                onChange={(event) => setQueryType(event.target.value as ProtocolQueryType)}
                            >
                                <option value="auto">Auto detect</option>
                                <option value="steps">Steps breakdown</option>
                                <option value="reagents">Total reagents</option>
                                <option value="instructions">Instructions</option>
                                <option value="summary">Summary</option>
                            </select>
                            <Input placeholder="Ask for steps, reagents, instructions, or a summary" value={query} onChange={(event) => setQuery(event.target.value)} />
                            <Button type="submit" disabled={loading} className="gap-2"><Sparkles className="h-4 w-4" />{loading ? "Generating" : "Ask"}</Button>
                        </form>

                        <div className="flex flex-wrap gap-2">
                            {suggestedQuestions.map((question) => (
                                <button key={question} type="button" onClick={() => askAI(undefined, question)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-teal-300 hover:bg-teal-50">
                                    {question}
                                </button>
                            ))}
                        </div>

                        {error && <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
                        {aiResponse && (
                            <div className="rounded-lg border border-teal-100 bg-teal-50/60 p-5">
                                <div className="mb-3 flex items-center gap-2">
                                    {aiResponse.type === "reagents" ? <TestTube2 className="h-5 w-5 text-teal-700" /> : <ListChecks className="h-5 w-5 text-teal-700" />}
                                    <Badge variant="success">{aiResponse.type}</Badge>
                                </div>
                                <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-slate-800">{aiResponse.content}</pre>
                            </div>
                        )}
                    </Card>

                    <section className="grid gap-6 xl:grid-cols-2">
                        <ProtocolSteps protocol={selectedProtocol} onChange={updateSelected} onAdd={addStep} />
                        <ProtocolReagents protocol={selectedProtocol} onChange={updateSelected} onAdd={addReagent} />
                    </section>
                </main>
            ) : (
                <Card className="rounded-lg text-center text-slate-500">Create a protocol to start building steps, reagents, and AI answers.</Card>
            )}
        </div>
    );
}

function ProtocolSteps({ protocol, onChange, onAdd }: { protocol: StoredProtocol; onChange: (protocol: StoredProtocol) => void; onAdd: () => void }) {
    const steps = protocol.steps || [];

    return (
        <Card className="space-y-4 rounded-lg">
            <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-950">Step Viewer</h3>
                <Button type="button" variant="secondary" onClick={onAdd} className="gap-2"><Plus className="h-4 w-4" />Step</Button>
            </div>
            <div className="space-y-3">
                {steps.map((step, index) => (
                    <div key={index} className="grid gap-2 rounded-lg border border-slate-200 p-3">
                        <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-800">{index + 1}</span>
                            <Input
                                placeholder="Instruction"
                                value={step.instruction}
                                onChange={(event) => {
                                    const next = [...steps];
                                    next[index] = { ...step, order_num: index + 1, instruction: event.target.value };
                                    onChange({ ...protocol, steps: next });
                                }}
                            />
                            <button type="button" className="rounded-full p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => onChange({ ...protocol, steps: steps.filter((_, stepIndex) => stepIndex !== index).map((item, stepIndex) => ({ ...item, order_num: stepIndex + 1 })) })}>
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <Input
                                type="number"
                                placeholder="Minutes"
                                value={step.duration_min ?? ""}
                                onChange={(event) => {
                                    const next = [...steps];
                                    next[index] = { ...step, duration_min: event.target.value ? Number(event.target.value) : undefined };
                                    onChange({ ...protocol, steps: next });
                                }}
                            />
                            <Input
                                placeholder="Notes or precautions"
                                value={step.notes || ""}
                                onChange={(event) => {
                                    const next = [...steps];
                                    next[index] = { ...step, notes: event.target.value };
                                    onChange({ ...protocol, steps: next });
                                }}
                            />
                        </div>
                    </div>
                ))}
                {!steps.length && <p className="text-sm text-slate-500">No steps saved yet.</p>}
            </div>
        </Card>
    );
}

function ProtocolReagents({ protocol, onChange, onAdd }: { protocol: StoredProtocol; onChange: (protocol: StoredProtocol) => void; onAdd: () => void }) {
    const reagents = protocol.reagents || [];

    return (
        <Card className="space-y-4 rounded-lg">
            <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-950">Total Reagents</h3>
                <Button type="button" variant="secondary" onClick={onAdd} className="gap-2"><Plus className="h-4 w-4" />Reagent</Button>
            </div>
            <div className="space-y-3">
                {reagents.map((reagent, index) => (
                    <div key={index} className="grid gap-2 rounded-lg border border-slate-200 p-3">
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Reagent name"
                                value={reagent.name}
                                onChange={(event) => {
                                    const next = [...reagents];
                                    next[index] = { ...reagent, name: event.target.value };
                                    onChange({ ...protocol, reagents: next });
                                }}
                            />
                            <button type="button" className="rounded-full p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => onChange({ ...protocol, reagents: reagents.filter((_, reagentIndex) => reagentIndex !== index) })}>
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                            <Input
                                type="number"
                                placeholder="Quantity"
                                value={reagent.quantity ?? ""}
                                onChange={(event) => {
                                    const next = [...reagents];
                                    next[index] = { ...reagent, quantity: event.target.value ? Number(event.target.value) : undefined };
                                    onChange({ ...protocol, reagents: next });
                                }}
                            />
                            <Input
                                placeholder="Unit"
                                value={reagent.unit || ""}
                                onChange={(event) => {
                                    const next = [...reagents];
                                    next[index] = { ...reagent, unit: event.target.value };
                                    onChange({ ...protocol, reagents: next });
                                }}
                            />
                            <Input
                                placeholder="Supplier"
                                value={reagent.supplier || ""}
                                onChange={(event) => {
                                    const next = [...reagents];
                                    next[index] = { ...reagent, supplier: event.target.value };
                                    onChange({ ...protocol, reagents: next });
                                }}
                            />
                        </div>
                    </div>
                ))}
                {!reagents.length && <p className="text-sm text-slate-500">No reagents saved yet.</p>}
            </div>
        </Card>
    );
}
