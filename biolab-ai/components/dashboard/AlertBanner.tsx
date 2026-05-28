'use client';

import { useState, useEffect } from "react";
import { AlertTriangle, X, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";

const SEEDED_ALERTS = [
    {
        id: "la1",
        title: "Acid Storage Incompatibility",
        message: "Highly corrosive Concentrated Nitric Acid must not be stored near flammables (Ethanol) in Cabinet A.",
    },
    {
        id: "la2",
        title: "Growth Log Metabolic Anomaly",
        message: "Experiment Growth curve study - Delta-12 reports a sour bacterial odor and severe pH crash (7.2 -> 5.1).",
    },
];

export function AlertBanner() {
    const [dismissed, setDismissed] = useState<string[]>([]);
    const [alerts, setAlerts] = useState<typeof SEEDED_ALERTS>([]);

    useEffect(() => {
        // Only show alerts if user has the seeded lab data (i.e., Yoshika's account)
        const hasSeededData = typeof window !== "undefined" &&
            window.localStorage.getItem("biolab.seeding_premium_completed") === "true";
        if (hasSeededData) {
            setAlerts(SEEDED_ALERTS);
        }
    }, []);

    const handleDismiss = async (alertId: string) => {
        setDismissed((prev) => [...prev, alertId]);
        try {
            await fetch(api.activity.dismissAlert, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ alertId }),
            });
        } catch {}
    };

    const visibleAlerts = alerts.filter((alert) => !dismissed.includes(alert.id));

    if (visibleAlerts.length === 0) {
        return null;
    }

    return (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-950/10 p-5 shadow-lg shadow-rose-950/20 backdrop-blur-md">
            <div className="flex items-start gap-4">
                <div className="mt-1 rounded-2xl bg-rose-500/20 p-2.5 text-rose-400 border border-rose-500/30 shrink-0 animate-pulse">
                    <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                    <h3 className="text-sm font-bold tracking-wider text-rose-200 uppercase">Critical Biosafety Warnings ({visibleAlerts.length})</h3>
                    <div className="mt-3 space-y-3 text-[11px] font-mono text-slate-300">
                        {visibleAlerts.map((alert) => (
                            <div key={alert.id} className="flex items-start justify-between gap-3 border-b border-rose-950/20 pb-2 last:border-b-0 last:pb-0">
                                <div>
                                    <p className="font-bold text-rose-300 flex items-center gap-1.5">
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                                        <span>{alert.title}</span>
                                    </p>
                                    <p className="mt-0.5 leading-relaxed text-slate-400">{alert.message}</p>
                                </div>
                                <button
                                    onClick={() => handleDismiss(alert.id)}
                                    className="ml-4 rounded-lg p-1 text-slate-500 hover:bg-slate-900 hover:text-slate-200 transition"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
