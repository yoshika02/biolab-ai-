'use client';

import { useEffect, useState } from "react";
import { BookOpen, Boxes, FileText, FlaskRound, ShieldAlert, Sparkles } from "lucide-react";

interface ActivityEntry {
    id: string;
    action: string;
    module: string;
    createdAt: string;
}

export function ActivityFeed() {
    const [recentLog, setRecentLog] = useState<ActivityEntry[]>([]);

    useEffect(() => {
        const loadLogs = () => {
            const stored = window.localStorage.getItem("biolab.activity_logs");
            if (stored) {
                try {
                    setRecentLog(JSON.parse(stored).slice(0, 4));
                } catch {
                    setRecentLog([]);
                }
            }
        };

        loadLogs();
        // Check logs every 5s for snappy interactions
        const interval = setInterval(loadLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    const fallbackLog: ActivityEntry[] = [
        { id: "fallback-1", action: "prepared protocol workspace for SOP queries", module: "Protocol", createdAt: new Date(Date.now() - 15 * 60000).toISOString() },
        { id: "fallback-2", action: "logged daily measurements for Delta-12", module: "Experiment", createdAt: new Date(Date.now() - 60 * 60000).toISOString() },
        { id: "fallback-3", action: "designed PCR primers for GFP-Reporter", module: "Primer", createdAt: new Date(Date.now() - 120 * 60000).toISOString() },
    ];
    const visibleLog = recentLog.length ? recentLog : fallbackLog;

    return (
        <div className="space-y-3">
            {visibleLog.map((entry) => {
                const Icon = getActivityIcon(entry.module);
                const timeStr = new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                    <div key={entry.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:border-slate-700">
                        <div className="flex gap-3.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-teal-400">
                                <Icon className="h-4.5 w-4.5" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-200 leading-relaxed">
                                    <span className="font-bold text-slate-100 font-mono text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider mr-1.5">{entry.module}</span>
                                    <span>{entry.action}</span>
                                </p>
                                <div className="mt-1.5 text-[9px] font-bold text-slate-500 font-mono">
                                    <span>{timeStr}</span>
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
    if (normalized.includes("safety")) return ShieldAlert;
    if (normalized.includes("primer")) return Sparkles;
    return FlaskRound;
}
