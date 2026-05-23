'use client';

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { api } from "@/lib/api";

interface Alert {
    id: string;
    title: string;
    message: string;
    type?: "warning" | "error" | "info";
}

export function AlertBanner() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [dismissed, setDismissed] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Load alerts from localStorage for now, in production fetch from /api/alerts
    useEffect(() => {
        const loadAlerts = async () => {
            try {
                // For now, use hardcoded alerts, but structure is ready for API
                const defaultAlerts: Alert[] = [
                    {
                        id: "la1",
                        title: "Reagent expiring soon",
                        message: "Ethanol batch E-22 will expire in 4 days.",
                        type: "warning",
                    },
                    {
                        id: "la2",
                        title: "Unresolved anomaly detected",
                        message: "Anomaly reported in experiment Delta-12 needs review.",
                        type: "error",
                    },
                ];

                // Check localStorage for dismissed alerts
                const storedDismissed = localStorage.getItem("dismissedAlerts");
                if (storedDismissed) {
                    setDismissed(JSON.parse(storedDismissed));
                }

                setAlerts(defaultAlerts);
            } catch (error) {
                console.error("Failed to load alerts:", error);
            } finally {
                setLoading(false);
            }
        };

        loadAlerts();
    }, []);

    const handleDismiss = async (alertId: string) => {
        const newDismissed = [...dismissed, alertId];
        setDismissed(newDismissed);
        localStorage.setItem("dismissedAlerts", JSON.stringify(newDismissed));

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

    if (loading || visibleAlerts.length === 0) {
        return null;
    }

    return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-start gap-4">
                <div className="mt-1 rounded-lg bg-amber-100 p-3 text-amber-700">
                    <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <h3 className="text-base font-semibold text-slate-950">
                        Priority Alerts
                    </h3>
                    <div className="mt-3 space-y-3 text-sm text-slate-700">
                        {visibleAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                className="flex items-start justify-between gap-2"
                            >
                                <div>
                                    <p className="font-semibold">{alert.title}</p>
                                    <p className="text-slate-600">{alert.message}</p>
                                </div>
                                <button
                                    onClick={() => handleDismiss(alert.id)}
                                    className="ml-4 rounded-full p-1 text-slate-500 transition hover:bg-amber-100 hover:text-slate-900 flex-shrink-0"
                                    aria-label={`Dismiss ${alert.title}`}
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
