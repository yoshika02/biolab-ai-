import Link from "next/link";
import { FileText, BookOpen, Boxes, FlaskRound, Droplet, ShieldCheck, BarChart3, User } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

const items = [
    { label: "Protocol", href: "/dashboard/protocol", icon: FileText, description: "SOPs, steps, reagents", status: "Active" },
    { label: "Papers", href: "/dashboard/papers", icon: BookOpen, description: "DOI, PubMed, PDF notes", status: "Workspace" },
    { label: "Inventory", href: "/dashboard/inventory", icon: Boxes, description: "Quantity, expiry, location", status: "Workspace" },
    { label: "Experiments", href: "/dashboard/experiments", icon: FlaskRound, description: "Runs, entries, results", status: "Workspace" },
    { label: "Primers", href: "/dashboard/primers", icon: Droplet, description: "Primer pairs and scores", status: "Workspace" },
    { label: "Safety", href: "/dashboard/safety", icon: ShieldCheck, description: "Hazards and compatibility", status: "Workspace" },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, description: "Trends and weekly digest", status: "Workspace" },
    { label: "Profile", href: "/dashboard/profile", icon: User, description: "Role and affiliation", status: "Ready" },
];

export function QuickAccess() {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            {items.map((item) => {
                const Icon = item.icon;
                return (
                    <Link key={item.href} href={item.href} className="group block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-teal-500 hover:bg-teal-50">
                        <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal-500 text-white transition group-hover:bg-teal-600">
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <h2 className="text-base font-semibold text-slate-950">{item.label}</h2>
                                    <Badge variant={item.status === "Active" ? "success" : "default"}>{item.status}</Badge>
                                </div>
                                <p className="text-sm text-slate-500">{item.description}</p>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
