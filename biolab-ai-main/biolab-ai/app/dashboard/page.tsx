import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { QuickAccess } from "@/components/dashboard/QuickAccess";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { Card } from "@/components/ui/Card";
import {
    BarChart3,
    Beaker,
    AlertCircle,
    BookOpen,
} from "lucide-react";

const stats = [
    {
        label: "Active experiments",
        value: "8",
        description: "Ongoing experiments across the lab.",
        highlight: "Live",
        icon: Beaker,
        trend: { direction: "up" as const, percentage: 12 },
    },
    {
        label: "Reagents low / expiring",
        value: "12",
        description: "Items below threshold or expiring soon.",
        highlight: "Inventory",
        icon: AlertCircle,
        trend: { direction: "down" as const, percentage: 8 },
    },
    {
        label: "Papers summarized",
        value: "5",
        description: "Papers summarized this week.",
        highlight: "Research",
        icon: BookOpen,
        trend: { direction: "up" as const, percentage: 25 },
    },
    {
        label: "Anomalies detected",
        value: "3",
        description: "Unresolved abnormal observations.",
        highlight: "Alerts",
        icon: AlertCircle,
        trend: { direction: "up" as const, percentage: 3 },
    },
];

export default function DashboardHome() {
    return (
        <div className="space-y-6">
            <AlertBanner />

            <div className="grid gap-4 xl:grid-cols-4">
                {stats.map((stat) => (
                    <StatCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        description={stat.description}
                        highlight={stat.highlight}
                        icon={stat.icon}
                        trend={stat.trend}
                    />
                ))}
            </div>

            <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                <Card className="space-y-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500">
                                Activity Feed
                            </p>
                            <p className="text-base text-slate-700">
                                Last 20 actions from team members.
                            </p>
                        </div>
                    </div>
                    <ActivityFeed />
                </Card>

                <Card className="space-y-4">
                    <div>
                        <p className="text-sm font-semibold text-slate-500">
                            Quick Access
                        </p>
                        <p className="text-base text-slate-700">
                            Open key modules in one click.
                        </p>
                    </div>
                    <QuickAccess />
                </Card>
            </section>
        </div>
    );
}
