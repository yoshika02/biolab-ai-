import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export const metadata: Metadata = {
    title: "BioLab AI Dashboard",
    description: "A secure research lab operations dashboard.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen">
            <Sidebar />
            <div className="ml-0 pt-4 sm:ml-60">
                <main className="min-h-screen bg-slate-50 px-4 pb-10 pt-4 sm:px-8">
                    <Topbar />
                    <div className="mt-6">{children}</div>
                </main>
            </div>
        </div>
    );
}
