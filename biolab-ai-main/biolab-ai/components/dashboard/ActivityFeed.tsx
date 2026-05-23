'use client';

import { useState, useEffect } from "react";
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
        const interval = setInterval(fetchLogs, 60000); // Poll every 60 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-4">
            {recentLog.length > 0 ? recentLog.map((entry) => (
                <div key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-900">
                        <span className="font-semibold">{entry.user}</span> {entry.action}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span>{entry.module}</span>
                        <span>·</span>
                        <span>{entry.time}</span>
                    </div>
                </div>
            )) : (
                <p className="text-sm text-slate-500">No recent activity.</p>
            )}
        </div>
    );
}