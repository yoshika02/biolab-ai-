"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { WorkspaceConfig } from "@/lib/dashboard-workspaces";

interface Protocol {
    id: string;
    name: string;
    sampleType?: string;
    status?: string;
    steps?: Array<{
        order_num: number;
        instruction: string;
        duration_min?: number;
        notes?: string;
    }>;
    reagents?: Array<{
        name: string;
        quantity: number;
        unit: string;
        supplier?: string;
    }>;
    createdAt: string;
}

interface AIResponse {
    type: "steps" | "reagents" | "instructions" | "summary";
    content: string;
    structured?: unknown;
}

export function ProtocolWorkspace({ config }: { config: WorkspaceConfig }) {
    const [protocols, setProtocols] = useState<Protocol[]>([]);
    const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(
        null
    );
    const [aiQuery, setAiQuery] = useState("");
    const [queryType, setQueryType] = useState<
        "steps" | "reagents" | "instructions" | "summary"
    >("steps");
    const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [newProtocol, setNewProtocol] = useState({
        name: "",
        sampleType: "",
    });
    const [showNewProtocolForm, setShowNewProtocolForm] = useState(false);

    // Load protocols from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(config.storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                const protocolArray = Array.isArray(parsed) ? parsed : [];
                setProtocols(protocolArray);
                if (protocolArray.length > 0) {
                    setSelectedProtocol(protocolArray[0]);
                }
            } catch {
                console.error("Failed to parse protocols");
            }
        }
    }, [config.storageKey]);

    const handleCreateProtocol = (e: FormEvent) => {
        e.preventDefault();
        if (!newProtocol.name.trim()) return;

        const protocol: Protocol = {
            id: `proto_${Date.now()}`,
            name: newProtocol.name,
            sampleType: newProtocol.sampleType,
            status: "draft",
            steps: [],
            reagents: [],
            createdAt: new Date().toISOString(),
        };

        const updated = [...protocols, protocol];
        setProtocols(updated);
        localStorage.setItem(config.storageKey, JSON.stringify(updated));
        setNewProtocol({ name: "", sampleType: "" });
        setShowNewProtocolForm(false);
        setSelectedProtocol(protocol);
    };

    const handleQueryAI = async (e: FormEvent) => {
        e.preventDefault();
        if (!aiQuery.trim() || !selectedProtocol) return;

        setLoading(true);
        setError("");
        setAiResponse(null);

        try {
            const response = await fetch("/api/protocol/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    protocolId: selectedProtocol.id,
                    query: aiQuery,
                    queryType,
                    protocol: selectedProtocol,
                }),
            });

            if (!response.ok) {
                const errorData = (await response.json()) as { error: string };
                throw new Error(errorData.error || "Failed to query AI");
            }

            const result = (await response.json()) as AIResponse;
            setAiResponse(result);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to get AI response"
            );
        } finally {
            setLoading(false);
        }
    };

    const addStep = () => {
        if (!selectedProtocol) return;
        const updated = [...protocols];
        const idx = updated.findIndex((p) => p.id === selectedProtocol.id);
        if (idx >= 0) {
            if (!updated[idx].steps) updated[idx].steps = [];
            updated[idx].steps!.push({
                order_num: (updated[idx].steps?.length || 0) + 1,
                instruction: "",
                duration_min: undefined,
                notes: undefined,
            });
            setProtocols(updated);
            localStorage.setItem(config.storageKey, JSON.stringify(updated));
            setSelectedProtocol(updated[idx]);
        }
    };

    const addReagent = () => {
        if (!selectedProtocol) return;
        const updated = [...protocols];
        const idx = updated.findIndex((p) => p.id === selectedProtocol.id);
        if (idx >= 0) {
            if (!updated[idx].reagents) updated[idx].reagents = [];
            updated[idx].reagents!.push({
                name: "",
                quantity: 0,
                unit: "ml",
                supplier: undefined,
            });
            setProtocols(updated);
            localStorage.setItem(config.storageKey, JSON.stringify(updated));
            setSelectedProtocol(updated[idx]);
        }
    };

    return (
        <div className="space-y-6">
            {/* Protocol List */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold">Protocols</h3>
                        <Button
                            onClick={() => setShowNewProtocolForm(!showNewProtocolForm)}
                            className="text-xs"
                        >
                            {showNewProtocolForm ? "Cancel" : "+ New"}
                        </Button>
                    </div>

                    {showNewProtocolForm && (
                        <Card className="p-4">
                            <form onSubmit={handleCreateProtocol} className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Protocol name"
                                    value={newProtocol.name}
                                    onChange={(e) =>
                                        setNewProtocol({ ...newProtocol, name: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Sample type"
                                    value={newProtocol.sampleType}
                                    onChange={(e) =>
                                        setNewProtocol({
                                            ...newProtocol,
                                            sampleType: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                />
                                <Button type="submit" className="w-full text-sm">
                                    Create
                                </Button>
                            </form>
                        </Card>
                    )}

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {protocols.map((protocol) => (
                            <Card
                                key={protocol.id}
                                className={`p-3 cursor-pointer transition-all ${selectedProtocol?.id === protocol.id
                                        ? "bg-blue-50 border-blue-300"
                                        : "hover:bg-gray-50"
                                    }`}
                                onClick={() => setSelectedProtocol(protocol)}
                            >
                                <div className="font-sm font-medium">{protocol.name}</div>
                                {protocol.sampleType && (
                                    <div className="text-xs text-gray-600">
                                        {protocol.sampleType}
                                    </div>
                                )}
                                <Badge className="mt-2 text-xs">
                                    {protocol.status || "draft"}
                                </Badge>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Main Protocol View */}
                <div className="lg:col-span-3 space-y-6">
                    {selectedProtocol ? (
                        <>
                            {/* AI Query Section */}
                            <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50">
                                <h2 className="text-lg font-semibold mb-4">AI Protocol Helper</h2>
                                <form onSubmit={handleQueryAI} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium">
                                            Query Type
                                        </label>
                                        <select
                                            value={queryType}
                                            onChange={(e) =>
                                                setQueryType(
                                                    e.target.value as
                                                    | "steps"
                                                    | "reagents"
                                                    | "instructions"
                                                    | "summary"
                                                )
                                            }
                                            className="w-full px-3 py-2 border rounded-lg"
                                        >
                                            <option value="steps">Steps Breakdown</option>
                                            <option value="reagents">Reagents List</option>
                                            <option value="instructions">Detailed Instructions</option>
                                            <option value="summary">Protocol Summary</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium">
                                            Your Question
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g., 'What are all the steps?' or 'List all reagents needed'"
                                            value={aiQuery}
                                            onChange={(e) => setAiQuery(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full"
                                    >
                                        {loading ? "Generating..." : "Ask AI"}
                                    </Button>
                                </form>

                                {error && (
                                    <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}

                                {aiResponse && (
                                    <div className="mt-4 p-4 bg-white rounded-lg border">
                                        <h3 className="font-semibold mb-2 text-sm">
                                            AI Response:
                                        </h3>
                                        <div className="text-sm whitespace-pre-wrap text-gray-700">
                                            {aiResponse.content}
                                        </div>
                                        {aiResponse.structured && (
                                            <div className="mt-3 pt-3 border-t">
                                                <p className="text-xs text-gray-500">
                                                    Structured Data: {typeof aiResponse.structured}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>

                            {/* Steps Section */}
                            <Card className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold">Steps</h3>
                                    <Button onClick={addStep} className="text-xs">
                                        + Add Step
                                    </Button>
                                </div>
                                {selectedProtocol.steps && selectedProtocol.steps.length > 0 ? (
                                    <ol className="space-y-2">
                                        {selectedProtocol.steps.map((step, idx) => (
                                            <li key={idx} className="text-sm">
                                                <strong>{step.order_num}.</strong> {step.instruction}
                                                {step.duration_min && (
                                                    <span className="text-gray-600 text-xs ml-2">
                                                        ({step.duration_min} min)
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <p className="text-sm text-gray-500">No steps yet</p>
                                )}
                            </Card>

                            {/* Reagents Section */}
                            <Card className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold">Reagents</h3>
                                    <Button onClick={addReagent} className="text-xs">
                                        + Add Reagent
                                    </Button>
                                </div>
                                {selectedProtocol.reagents &&
                                    selectedProtocol.reagents.length > 0 ? (
                                    <ul className="space-y-2">
                                        {selectedProtocol.reagents.map((reagent, idx) => (
                                            <li key={idx} className="text-sm">
                                                <strong>{reagent.name}</strong>: {reagent.quantity}{" "}
                                                {reagent.unit}
                                                {reagent.supplier && (
                                                    <span className="text-gray-600 text-xs ml-2">
                                                        ({reagent.supplier})
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500">No reagents yet</p>
                                )}
                            </Card>
                        </>
                    ) : (
                        <Card className="p-6 text-center text-gray-500">
                            No protocol selected. Create or select a protocol to get started.
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
