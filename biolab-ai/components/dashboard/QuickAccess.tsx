import Link from "next/link";
import { FileText, BookOpen, Boxes, FlaskRound, Droplet, ShieldCheck } from "lucide-react";

const items = [
    { label: "Protocol", href: "/dashboard/protocol", icon: FileText, description: "Create and manage lab protocols." },
    { label: "Papers", href: "/dashboard/papers", icon: BookOpen, description: "Review and summarize recent literature." },
    { label: "Inventory", href: "/dashboard/inventory", icon: Boxes, description: "Track reagent stock levels." },
    { label: "Experiments", href: "/dashboard/experiments", icon: FlaskRound, description: "Monitor current experiments." },
    { label: "Primers", href: "/dashboard/primers", icon: Droplet, description: "Design and store primer sets." },
    { label: "Safety", href: "/dashboard/safety", icon: ShieldCheck, description: "View safety alerts and incidents." },
];

export function QuickAccess() {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            {items.map((item) => {
                const Icon = item.icon;
                return (
                    <Link key={item.href} href={item.href} className="group block rounded-3xl border border-slate-200 bg-white p-6 transition hover:border-teal-500 hover:bg-teal-50">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500 text-white transition group-hover:bg-teal-600">
                                <Icon className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-950">{item.label}</h2>
                                <p className="text-sm text-slate-500">{item.description}</p>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
