'use client';

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { WorkspaceConfig, WorkspaceField } from "@/lib/dashboard-workspaces";

type Entry = Record<string, string> & { id: string; createdAt: string };

function readEntries(storageKey: string) {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function ModuleWorkspace({ config }: { config: WorkspaceConfig }) {
    const [ready, setReady] = useState(false);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [form, setForm] = useState<Record<string, string>>({});

    useEffect(() => {
        setEntries(readEntries(config.storageKey));
        const initial: Record<string, string> = {};
        config.fields.forEach((field) => {
            initial[field.name] = "";
        });
        setForm(initial);
        setReady(true);
    }, [config]);

    useEffect(() => {
        if (!ready) return;
        window.localStorage.setItem(config.storageKey, JSON.stringify(entries));
    }, [entries, ready, config.storageKey]);

    const stats = useMemo(() => {
        return [
            { label: "Saved items", value: String(entries.length) },
            { label: "Fields", value: String(config.fields.length) },
        ];
    }, [config.fields.length, entries.length]);

    function setField(name: string, value: string) {
        setForm((current) => ({ ...current, [name]: value }));
    }

    function submitForm(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const missingField = config.fields.find((field) => field.required && !form[field.name]?.trim());
        if (missingField) return;

        const nextEntry: Entry = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            ...form,
        };

        setEntries((current) => [nextEntry, ...current]);
        const resetState: Record<string, string> = {};
        config.fields.forEach((field) => {
            resetState[field.name] = "";
        });
        setForm(resetState);
    }

    return (
        <div className="space-y-6">
            <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
                <Card className="space-y-4 border-slate-200/80">
                    <div className={`rounded-3xl bg-gradient-to-r ${config.accent} p-6 text-white`}>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/75">{config.eyebrow}</p>
                        <h2 className="mt-2 text-2xl font-semibold">{config.title}</h2>
                        <p className="mt-2 max-w-2xl text-sm text-white/85">{config.description}</p>
                    </div>

                    <form onSubmit={submitForm} className="grid gap-4 md:grid-cols-2">
                        {config.fields.map((field) => (
                            <FieldInput key={field.name} field={field} value={form[field.name] ?? ""} onChange={setField} />
                        ))}
                        <div className="md:col-span-2">
                            <Button type="submit" className="w-full sm:w-auto">{config.actionLabel}</Button>
                        </div>
                    </form>
                </Card>

                <Card className="space-y-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Workspace Stats</p>
                    <div className="grid gap-3">
                        {stats.map((item) => (
                            <div key={item.label} className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                                <p className="mt-1 text-2xl font-semibold text-slate-950">{item.value}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-sm text-slate-500">
                        Entries are stored locally in your browser for now, so the workspace works immediately while the backend grows.
                    </p>
                </Card>
            </section>

            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-500">Saved Entries</p>
                        <p className="text-sm text-slate-700">{entries.length ? "Latest items appear first." : config.emptyLabel}</p>
                    </div>
                    <Badge variant={entries.length ? "success" : "default"}>{entries.length} records</Badge>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    {entries.map((entry) => (
                        <Card key={entry.id} className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-base font-semibold text-slate-950">{entry.name || entry.title || entry.item || entry.chemical || entry.report || entry.displayName || "Saved entry"}</p>
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{new Date(entry.createdAt).toLocaleString()}</p>
                                </div>
                                <Badge variant="success">Saved</Badge>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {config.fields.map((field) => (
                                    <div key={field.name} className="rounded-2xl bg-slate-50 px-3 py-2">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{field.label}</p>
                                        <p className="mt-1 text-sm text-slate-900">{entry[field.name] || "-"}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
}

function FieldInput({ field, value, onChange }: {
    field: WorkspaceField;
    value: string;
    onChange: (name: string, value: string) => void;
}) {
    const wrapperClass = field.span === "full" || field.type === "textarea" ? "md:col-span-2" : "";

    return (
        <label className={`space-y-2 ${wrapperClass}`}>
            <span className="block text-sm font-medium text-slate-700">{field.label}</span>
            {field.type === "textarea" ? (
                <textarea
                    className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    placeholder={field.placeholder}
                    value={value}
                    onChange={(event) => onChange(field.name, event.target.value)}
                    required={field.required}
                />
            ) : field.type === "select" ? (
                <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    value={value}
                    onChange={(event) => onChange(field.name, event.target.value)}
                    required={field.required}
                >
                    <option value="">Select {field.label.toLowerCase()}</option>
                    {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
            ) : (
                <Input
                    type={field.type ?? "text"}
                    placeholder={field.placeholder}
                    value={value}
                    onChange={(event) => onChange(field.name, event.target.value)}
                    required={field.required}
                />
            )}
        </label>
    );
}
