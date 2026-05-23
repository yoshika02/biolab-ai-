export type WorkspaceFieldType = "text" | "number" | "date" | "textarea" | "select";

export interface WorkspaceField {
    name: string;
    label: string;
    type?: WorkspaceFieldType;
    placeholder?: string;
    options?: string[];
    required?: boolean;
    span?: "full" | "half";
}

export interface WorkspaceConfig {
    storageKey: string;
    title: string;
    eyebrow: string;
    description: string;
    actionLabel: string;
    fields: WorkspaceField[];
    emptyLabel: string;
    accent: string;
}

export const workspaceConfigs: Record<string, WorkspaceConfig> = {
    protocol: {
        storageKey: "biolab.protocols",
        title: "Protocol Builder",
        eyebrow: "M1 Protocol Assistant",
        description: "Capture SOPs, annotate steps, and keep the latest protocol version in one place.",
        actionLabel: "Save protocol",
        emptyLabel: "No protocols saved yet.",
        accent: "from-teal-500 to-cyan-500",
        fields: [
            { name: "name", label: "Protocol name", placeholder: "Western blot workflow" },
            { name: "sampleType", label: "Sample type", placeholder: "Protein lysate" },
            { name: "owner", label: "Owner", placeholder: "Research team" },
            { name: "status", label: "Status", type: "select", options: ["Draft", "Active", "Archived"], required: true },
            { name: "notes", label: "Notes", type: "textarea", placeholder: "Critical steps, wash conditions, temperature notes." },
        ],
    },
    papers: {
        storageKey: "biolab.papers",
        title: "Paper Summarizer",
        eyebrow: "M2 Literature Review",
        description: "Log DOI, source, and takeaways from papers you want to keep close to experiments.",
        actionLabel: "Save paper",
        emptyLabel: "No paper notes saved yet.",
        accent: "from-blue-500 to-indigo-500",
        fields: [
            { name: "title", label: "Paper title", placeholder: "Cell stress response in bacteria" },
            { name: "doi", label: "DOI / PMID", placeholder: "10.1038/..." },
            { name: "source", label: "Source", placeholder: "Nature / PubMed" },
            { name: "focus", label: "Key focus", placeholder: "Methodology, limitations, next steps" },
            { name: "summary", label: "Summary", type: "textarea", placeholder: "Short summary for team reference." },
        ],
    },
    inventory: {
        storageKey: "biolab.inventory",
        title: "Inventory Tracker",
        eyebrow: "M3 Inventory",
        description: "Track reagents, stock counts, expiry dates, and where each item is stored.",
        actionLabel: "Add item",
        emptyLabel: "No inventory items saved yet.",
        accent: "from-emerald-500 to-lime-500",
        fields: [
            { name: "item", label: "Item name", placeholder: "Tris buffer" },
            { name: "category", label: "Category", type: "select", options: ["Reagent", "Chemical", "Kit", "Consumable", "Instrument"], required: true },
            { name: "quantity", label: "Quantity", type: "number", placeholder: "12" },
            { name: "location", label: "Storage location", placeholder: "Fridge 2 / Shelf B" },
            { name: "expiry", label: "Expiry date", type: "date" },
            { name: "notes", label: "Notes", type: "textarea", placeholder: "Hazards, reorder threshold, linked experiments." },
        ],
    },
    experiments: {
        storageKey: "biolab.experiments",
        title: "Experiment Logger",
        eyebrow: "M4 Experiment Logger",
        description: "Record experiment progress, results, and the next action for every run.",
        actionLabel: "Log experiment",
        emptyLabel: "No experiments logged yet.",
        accent: "from-amber-500 to-orange-500",
        fields: [
            { name: "name", label: "Experiment name", placeholder: "Growth curve study" },
            { name: "lead", label: "Lead scientist", placeholder: "Team member" },
            { name: "date", label: "Experiment date", type: "date" },
            { name: "stage", label: "Stage", type: "select", options: ["Planning", "Running", "Analysis", "Completed"], required: true },
            { name: "result", label: "Result", placeholder: "Yield increased by 8%" },
            { name: "notes", label: "Notes", type: "textarea", placeholder: "Observations, anomalies, attachments." },
        ],
    },
    primers: {
        storageKey: "biolab.primers",
        title: "Primer Designer",
        eyebrow: "M5 Primer Designer",
        description: "Capture primer pairs, target genes, and the screening notes you want to keep handy.",
        actionLabel: "Save primer set",
        emptyLabel: "No primer sets saved yet.",
        accent: "from-fuchsia-500 to-pink-500",
        fields: [
            { name: "gene", label: "Target gene", placeholder: "lacZ" },
            { name: "forward", label: "Forward primer", placeholder: "5'-ATG...-3'" },
            { name: "reverse", label: "Reverse primer", placeholder: "5'-TCA...-3'" },
            { name: "tm", label: "Tm (deg C)", type: "number", placeholder: "60" },
            { name: "gc", label: "GC %", type: "number", placeholder: "52" },
            { name: "notes", label: "Notes", type: "textarea", placeholder: "Off-target notes, product size, ranking score." },
        ],
    },
    safety: {
        storageKey: "biolab.safety",
        title: "Safety Chat",
        eyebrow: "M6 Chemical Safety",
        description: "Store chemical safety notes, compatibility warnings, and emergency steps for the bench.",
        actionLabel: "Save safety note",
        emptyLabel: "No safety notes saved yet.",
        accent: "from-rose-500 to-red-500",
        fields: [
            { name: "chemical", label: "Chemical name", placeholder: "Ethanol" },
            { name: "hazard", label: "Hazard class", placeholder: "Flammable liquid" },
            { name: "compatibility", label: "Compatibility", placeholder: "Avoid oxidizers" },
            { name: "action", label: "Action", placeholder: "Store in flammables cabinet" },
            { name: "notes", label: "Emergency notes", type: "textarea", placeholder: "SDS references, response instructions." },
        ],
    },
    analytics: {
        storageKey: "biolab.analytics",
        title: "Analytics Workspace",
        eyebrow: "M7 Analytics Dashboard",
        description: "Track your weekly digest, trends, and the reports the lab should review next.",
        actionLabel: "Save report note",
        emptyLabel: "No analytics notes saved yet.",
        accent: "from-slate-700 to-slate-900",
        fields: [
            { name: "report", label: "Report title", placeholder: "Weekly lab summary" },
            { name: "period", label: "Period", placeholder: "Week 21 / May 2026" },
            { name: "metric", label: "Core metric", placeholder: "Growth rate, inventory burn, paper count" },
            { name: "insight", label: "Insight", type: "textarea", placeholder: "What stood out and what needs attention." },
            { name: "nextStep", label: "Next step", placeholder: "Re-run experiment or reorder stock" },
        ],
    },
    profile: {
        storageKey: "biolab.profile",
        title: "Profile Settings",
        eyebrow: "Account Details",
        description: "Keep your personal lab profile, contact info, and affiliation details up to date.",
        actionLabel: "Save profile",
        emptyLabel: "No profile draft saved yet.",
        accent: "from-teal-600 to-emerald-600",
        fields: [
            { name: "displayName", label: "Display name", placeholder: "Priya Sharma" },
            { name: "phone", label: "Phone number", placeholder: "+91 9876543210" },
            { name: "department", label: "Department", placeholder: "Biotechnology" },
            { name: "institution", label: "Institution", placeholder: "IIT Delhi" },
            { name: "bio", label: "Bio", type: "textarea", placeholder: "Short description for your workspace profile." },
        ],
    },
};

export function getWorkspaceConfig(key: keyof typeof workspaceConfigs) {
    return workspaceConfigs[key];
}
