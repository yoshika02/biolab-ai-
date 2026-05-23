'use client';

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { api } from "@/lib/api";

const alerts = [
    {
        id: "la1",
        title: "Reagent expiring soon",
        message: "Ethanol batch E-22 will expire in 4 days.",
    },
    {
        id: "la2",
        title: "Unresolved anomaly detected",
        message: "Anomaly reported in experiment Delta-12 needs review.",
    },
];

export function AlertBanner() {
    const [dismissed, setDismissed] = useState<string[]>([]);

    const handleDismiss = async (alertId: string) => {
        setDismissed((prev) => [...prev, alertId]);
        // Log dismissal to DB
        try {
            await fetch(api.activity.dismissAlert, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ alertId }),
            });
        } catch (error) {
            console.error("Failed to log alert dismissal:", error);
        }
    };

    const visibleAlerts = alerts.filter((alert) => !dismissed.includes(alert.id));

    if (visibleAlerts.length === 0) {
        return null;
    }

    return (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-start gap-4">
                <div className="mt-1 rounded-2xl bg-amber-100 p-3 text-amber-700">
                    <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <h3 className="text-base font-semibold text-slate-950">Priority Alerts</h3>
                    <div className="mt-3 space-y-3 text-sm text-slate-700">
                        {visibleAlerts.map((alert) => (
                            <div key={alert.id} className="flex items-start justify-between">
                                <div>
                                    <p className="font-semibold">{alert.title}</p>
                                    <p>{alert.message}</p>
                                </div>
                                <button
                                    onClick={() => handleDismiss(alert.id)}
                                    className="ml-4 rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
