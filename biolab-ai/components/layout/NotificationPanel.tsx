'use client';

import { X, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";

interface NotificationPanelProps {
    open: boolean;
    onClose: () => void;
}

const notifications = [
    { id: "1", type: "alert", title: "Reagent expiring soon", message: "Acetic acid batch A12 expires in 5 days." },
    { id: "2", type: "info", title: "Protocol updated", message: "Western blot protocol was updated by Priya." },
    { id: "3", type: "warning", title: "Anomaly detected", message: "Unresolved anomaly in experiment 23B." },
];

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
    return (
        <div className={`fixed inset-y-0 right-0 z-40 w-full max-w-md transform overflow-hidden bg-white shadow-2xl transition-all duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                    <p className="text-sm font-semibold text-slate-900">Notifications</p>
                    <p className="text-sm text-slate-500">Recent activity and alerts.</p>
                </div>
                <button onClick={onClose} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="space-y-4 p-6">
                {notifications.map((notification) => (
                    <div key={notification.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                                {notification.type === "alert" ? <AlertTriangle className="h-4 w-4" /> : notification.type === "warning" ? <Sparkles className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">{notification.title}</p>
                                <p className="text-sm text-slate-600">{notification.message}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
