'use client';

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface Notification {
    id: string;
    type: "info" | "warning" | "error";
    title: string;
    message?: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

export function NotificationPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load notifications from localStorage for now
        const loadNotifications = async () => {
            setLoading(true);
            try {
                // In production, fetch from /api/notifications
                const stored = localStorage.getItem("notifications");
                if (stored) {
                    const notifs = JSON.parse(stored);
                    setNotifications(notifs);
                    setUnreadCount(notifs.filter((n: Notification) => !n.is_read).length);
                }
            } catch (error) {
                console.error("Failed to load notifications:", error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            loadNotifications();
        }
    }, [isOpen]);

    const markAsRead = (notificationId: string) => {
        const updated = notifications.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
        );
        setNotifications(updated);
        localStorage.setItem("notifications", JSON.stringify(updated));
        setUnreadCount(updated.filter((n) => !n.is_read).length);
    };

    const markAllAsRead = () => {
        const updated = notifications.map((n) => ({ ...n, is_read: true }));
        setNotifications(updated);
        localStorage.setItem("notifications", JSON.stringify(updated));
        setUnreadCount(0);
    };

    const deleteNotification = (notificationId: string) => {
        const updated = notifications.filter((n) => n.id !== notificationId);
        setNotifications(updated);
        localStorage.setItem("notifications", JSON.stringify(updated));
        setUnreadCount(updated.filter((n) => !n.is_read).length);
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case "error":
                return "bg-red-50 border-red-200";
            case "warning":
                return "bg-amber-50 border-amber-200";
            default:
                return "bg-blue-50 border-blue-200";
        }
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-semibold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 p-4">
                        <h3 className="font-semibold text-slate-950">
                            Notifications
                        </h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs font-medium text-teal-600 hover:text-teal-700"
                                >
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-sm text-slate-500">
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-500">
                                No notifications
                            </div>
                        ) : (
                            <div className="space-y-2 p-2">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`rounded-lg border p-3 cursor-pointer transition ${getNotificationColor(
                                            notification.type
                                        )} ${!notification.is_read
                                                ? "border-opacity-100"
                                                : "border-opacity-50 opacity-75"
                                            }`}
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className="font-medium text-sm text-slate-900">
                                                    {notification.title}
                                                </h4>
                                                {notification.message && (
                                                    <p className="text-xs text-slate-600 mt-1">
                                                        {notification.message}
                                                    </p>
                                                )}
                                                <p className="text-xs text-slate-500 mt-2">
                                                    {new Date(
                                                        notification.created_at
                                                    ).toRelativeTime?.() ||
                                                        new Date(
                                                            notification.created_at
                                                        ).toLocaleString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(
                                                        notification.id
                                                    );
                                                }}
                                                className="rounded p-1 text-slate-400 hover:bg-slate-200 flex-shrink-0"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="border-t border-slate-200 p-3 text-center">
                            <a
                                href="/dashboard/notifications"
                                className="text-sm font-medium text-teal-600 hover:text-teal-700"
                            >
                                View all notifications →
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
