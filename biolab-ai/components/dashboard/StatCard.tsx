import { Card } from "@/components/ui/Card";

interface StatCardProps {
    label: string;
    value: string;
    description: string;
    highlight?: string;
}

export function StatCard({ label, value, description, highlight }: StatCardProps) {
    return (
        <Card className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                {highlight ? <span className="rounded-full bg-teal-100 px-2 py-1 text-xs font-semibold text-teal-700">{highlight}</span> : null}
            </div>
            <p className="text-3xl font-semibold text-slate-950">{value}</p>
            <p className="text-sm text-slate-500">{description}</p>
        </Card>
    );
}
