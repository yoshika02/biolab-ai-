"use client";

import { useEffect, useState } from "react";
import { BookOpen, Boxes, FileText, FlaskRound } from "lucide-react";
import { api } from "@/lib/api";

interface ActivityEntry {
    id: string;
    user: string;
    action: string;
    module: string;
    time: string;
}

export function ActivityFeed() {
    const [recentLog, setRecentLog] = useState<ActivityEntry[]>([]);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch(api.activity.logs);
                const data = await res.json();
                if (data.logs) setRecentLog(data.logs);
            } catch (error) {
                console.error("Failed to fetch activity logs:", error);
            }
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 60000);
        return () => clearInterval(interval);
    }, []);

    const fallbackLog: ActivityEntry[] = [
        { id: "fallback-protocol", user: "BioLab AI", action: "prepared protocol workspace for SOP queries", module: "Protocol", time: "Just now" },
        { id: "fallback-inventory", user: "Inventory", action: "is ready for reagent expiry tracking", module: "Inventory", time: "Today" },
        { id: "fallback-experiment", user: "Experiment Logger", action: "is ready for active run notes", module: "Experiments", time: "Today" },
    ];
    const visibleLog = recentLog.length ? recentLog : fallbackLog;

    return (
        <div className="space-y-4">
            {visibleLog.map((entry) => {
                const Icon = getActivityIcon(entry.module);
                return (
                    <div key={entry.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm">
                                <Icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-900">
                                    <span className="font-semibold">{entry.user}</span> {entry.action}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                                    <span>{entry.module}</span>
                                    <span>-</span>
                                    <span>{entry.time}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function getActivityIcon(moduleName: string) {
    const normalized = moduleName.toLowerCase();
    if (normalized.includes("protocol")) return FileText;
    if (normalized.includes("inventory")) return Boxes;
    if (normalized.includes("paper")) return BookOpen;
    return FlaskRound;
}
