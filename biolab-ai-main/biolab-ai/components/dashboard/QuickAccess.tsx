import Link from "next/link";
import {
    FileText,
    BookOpen,
    Boxes,
    FlaskRound,
    Droplet,
    ShieldCheck,
    BarChart3,
    User,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface ModuleItem {
    label: string;
    href: string;
    icon: typeof FileText;
    description: string;
    comingSoon?: boolean;
}

const items: ModuleItem[] = [
    {
        label: "Protocol",
        href: "/dashboard/protocol",
        icon: FileText,
        description: "Create and manage lab protocols with AI assistance.",
    },
    {
        label: "Papers",
        href: "/dashboard/papers",
        icon: BookOpen,
        description: "Review and summarize recent literature.",
        comingSoon: true,
    },
    {
        label: "Inventory",
        href: "/dashboard/inventory",
        icon: Boxes,
        description: "Track reagent stock levels.",
        comingSoon: true,
    },
    {
        label: "Experiments",
        href: "/dashboard/experiments",
        icon: FlaskRound,
        description: "Monitor current experiments.",
        comingSoon: true,
    },
    {
        label: "Primers",
        href: "/dashboard/primers",
        icon: Droplet,
        description: "Design and store primer sets.",
        comingSoon: true,
    },
    {
        label: "Safety",
        href: "/dashboard/safety",
        icon: ShieldCheck,
        description: "View safety alerts and incidents.",
        comingSoon: true,
    },
    {
        label: "Analytics",
        href: "/dashboard/analytics",
        icon: BarChart3,
        description: "Capture weekly trends and reports.",
        comingSoon: true,
    },
    {
        label: "Profile",
        href: "/dashboard/profile",
        icon: User,
        description: "Keep your affiliation details current.",
        comingSoon: true,
    },
];

export function QuickAccess() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            {items.map((item) => {
                const Icon = item.icon;
                return (
                    <Link
                        key={item.href}
                        href={item.comingSoon ? "#" : item.href}
                        className={`group block rounded-lg border transition ${item.comingSoon
                                ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-60"
                                : "border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50"
                            } p-4`}
                        onClick={(e) => item.comingSoon && e.preventDefault()}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${item.comingSoon
                                        ? "bg-slate-200 text-slate-600"
                                        : "bg-teal-500 text-white group-hover:bg-teal-600"
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-base font-semibold text-slate-950">
                                    {item.label}
                                </h2>
                                <p className="text-xs text-slate-600">
                                    {item.description}
                                </p>
                            </div>
                            {item.comingSoon && (
                                <Badge className="text-xs bg-amber-100 text-amber-800">
                                    Coming soon
                                </Badge>
                            )}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
