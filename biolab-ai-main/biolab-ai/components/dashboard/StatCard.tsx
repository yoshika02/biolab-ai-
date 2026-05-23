import { Card } from "@/components/ui/Card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    label: string;
    value: string | number;
    description: string;
    highlight?: string;
    icon?: LucideIcon;
    trend?: {
        direction: "up" | "down";
        percentage: number;
    };
}

export function StatCard({
    label,
    value,
    description,
    highlight,
    icon: Icon,
    trend,
}: StatCardProps) {
    return (
        <Card className="space-y-3 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {Icon && (
                        <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
                            <Icon className="h-4 w-4" />
                        </div>
                    )}
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                </div>
                {highlight ? (
                    <span className="rounded-full bg-teal-100 px-2 py-1 text-xs font-semibold text-teal-700">
                        {highlight}
                    </span>
                ) : null}
            </div>
            <div className="flex items-baseline gap-2">
                <p className="text-3xl font-semibold text-slate-950">{value}</p>
                {trend && (
                    <div
                        className={`text-sm font-medium ${trend.direction === "up"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                    >
                        {trend.direction === "up" ? "↑" : "↓"} {trend.percentage}%
                    </div>
                )}
            </div>
            <p className="text-sm text-slate-500">{description}</p>
        </Card>
    );
}
