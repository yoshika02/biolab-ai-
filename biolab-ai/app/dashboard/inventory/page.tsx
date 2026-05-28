'use client';

import { useState, useEffect, useMemo } from "react";
import {
    Plus,
    Search,
    Trash2,
    Edit2,
    ShieldAlert,
    Sparkles,
    ArrowRight,
    Upload,
    RefreshCw,
    X,
    AlertTriangle,
    Info,
    Check,
    CheckCircle2,
    Calendar,
    MapPin,
    Layers,
    FileText
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { callGemini, getStoredOpenRouterKey } from "@/lib/gemini";

interface InventoryItem {
    id: string;
    item: string;
    category: "Reagent" | "Chemical" | "Kit" | "Consumable" | "Instrument";
    quantity: number;
    unit: string;
    location: string;
    expiry: string; // YYYY-MM-DD
    notes?: string;
    createdAt: string;
}

interface Experiment {
    id: string;
    name: string;
    stage: string;
}

const DEFAULT_INVENTORY: InventoryItem[] = [
    {
        id: "inv-1",
        item: "Ethanol (99% pure)",
        category: "Chemical",
        quantity: 500,
        unit: "mL",
        location: "Shelf C (Flammables Cabinet)",
        expiry: "2026-12-15",
        notes: "Highly flammable solvent. Keep away from heat.",
        createdAt: new Date().toISOString()
    },
    {
        id: "inv-2",
        item: "Nitric Acid (Concentrated)",
        category: "Chemical",
        quantity: 100,
        unit: "mL",
        location: "Shelf B (Acid Cabinet)",
        expiry: "2026-08-20",
        notes: "Corrosive oxidizer. Do not store near flammables.",
        createdAt: new Date().toISOString()
    },
    {
        id: "inv-3",
        item: "Tris-HCl Buffer (pH 8.0)",
        category: "Reagent",
        quantity: 120,
        unit: "mL",
        location: "Fridge 2 - Shelf A",
        expiry: "2026-06-10",
        notes: "General biochemical reagent. Keep chilled.",
        createdAt: new Date().toISOString()
    },
    {
        id: "inv-4",
        item: "DAPI Nucleic Acid Stain",
        category: "Reagent",
        quantity: 2,
        unit: "mL",
        location: "Freezer 1 - Box B",
        expiry: "2025-12-01",
        notes: "Light sensitive fluorescent dye. Expired.",
        createdAt: new Date().toISOString()
    },
    {
        id: "inv-5",
        item: "Taq Polymerase PCR Kit",
        category: "Kit",
        quantity: 1,
        unit: "Kit",
        location: "Freezer 2 - Box A",
        expiry: "2027-01-10",
        notes: "Store at -20C. Critical enzyme reagent.",
        createdAt: new Date().toISOString()
    },
    {
        id: "inv-6",
        item: "Falcon Tubes (15mL)",
        category: "Consumable",
        quantity: 250,
        unit: "Units",
        location: "Cabinet 3 - Bin C",
        expiry: "",
        notes: "Sterile centrifugal tubes.",
        createdAt: new Date().toISOString()
    }
];

export default function InventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("All");

    // Modal state
    const [showAddForm, setShowAddForm] = useState(false);
    const [showCSVImport, setShowCSVImport] = useState(false);
    const [showUseStockForm, setShowUseStockForm] = useState(false);

    // Form inputs
    const [newItem, setNewItem] = useState({
        item: "",
        category: "Reagent" as InventoryItem["category"],
        quantity: 100,
        unit: "mL",
        location: "",
        expiry: "",
        notes: ""
    });

    const [csvInput, setCsvInput] = useState("");
    const [selectedItemForUse, setSelectedItemForUse] = useState<InventoryItem | null>(null);
    const [useQuantity, setUseQuantity] = useState(10);
    const [linkedExperimentId, setLinkedExperimentId] = useState("");

    // AI Safety & Predictor states
    const [aiAuditResult, setAiAuditResult] = useState<string>("");
    const [isAuditing, setIsAuditing] = useState(false);
    const [aiPredictResult, setAiPredictResult] = useState<string>("");
    const [isPredicting, setIsPredicting] = useState(false);
    const [auditError, setAuditError] = useState("");
    const [predictError, setPredictError] = useState("");

    useEffect(() => {
        // Load inventory from localstorage or seed defaults
        const storedInv = window.localStorage.getItem("biolab.inventory_premium");
        if (storedInv) {
            try {
                setInventory(JSON.parse(storedInv));
            } catch {
                setInventory(DEFAULT_INVENTORY);
            }
        } else {
            setInventory(DEFAULT_INVENTORY);
        }

        // Fetch experiments for dropdown
        const storedExps = window.localStorage.getItem("biolab.experiments_premium");
        if (storedExps) {
            try {
                const parsed = JSON.parse(storedExps);
                setExperiments(parsed.map((e: any) => ({ id: e.id, name: e.name, stage: e.stage })));
            } catch {
                setExperiments([]);
            }
        }
    }, []);

    // Save to local storage
    const saveInventory = (nextInv: InventoryItem[]) => {
        setInventory(nextInv);
        window.localStorage.setItem("biolab.inventory_premium", JSON.stringify(nextInv));
    };

    const categories = ["All", "Reagent", "Chemical", "Kit", "Consumable", "Instrument"];

    // Filtered items
    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            const matchesSearch = item.item.toLowerCase().includes(search.toLowerCase()) ||
                item.location.toLowerCase().includes(search.toLowerCase()) ||
                (item.notes || "").toLowerCase().includes(search.toLowerCase());
            const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [inventory, search, selectedCategory]);

    // Expiry statistics
    const expiryStats = useMemo(() => {
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        let expired = 0;
        let warning = 0;

        inventory.forEach(item => {
            if (!item.expiry) return;
            const expDate = new Date(item.expiry);
            if (expDate < now) {
                expired++;
            } else if (expDate <= thirtyDaysFromNow) {
                warning++;
            }
        });

        return { expired, warning };
    }, [inventory]);

    // Expiry color resolver
    const getExpiryBadge = (expiryStr: string) => {
        if (!expiryStr) return <span className="text-slate-500 text-xs">—</span>;
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);
        const expDate = new Date(expiryStr);

        if (expDate < now) {
            return <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">Expired</span>;
        } else if (expDate <= thirtyDaysFromNow) {
            return <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">Expiring soon</span>;
        }
        return <span className="text-slate-300 text-xs font-medium">{expiryStr}</span>;
    };

    // Quantity color resolver
    const getQuantityIndicator = (qty: number, category: string) => {
        let isLow = false;
        if (category === "Chemical" && qty <= 50) isLow = true;
        if (category === "Reagent" && qty <= 10) isLow = true;
        if (category === "Kit" && qty <= 0) isLow = true;
        if (category === "Consumable" && qty <= 30) isLow = true;

        if (qty <= 0) {
            return (
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                    <span className="text-rose-400 font-bold text-xs">Out of Stock</span>
                </div>
            );
        }
        if (isLow) {
            return (
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="text-amber-400 font-bold text-xs">Low Stock</span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-emerald-400 font-bold text-xs">Adequate</span>
            </div>
        );
    };

    // Add form submission
    const handleAddReagent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.item.trim()) return;

        const createdItem: InventoryItem = {
            id: `inv-${Date.now()}`,
            ...newItem,
            createdAt: new Date().toISOString()
        };

        saveInventory([createdItem, ...inventory]);
        setNewItem({
            item: "",
            category: "Reagent",
            quantity: 100,
            unit: "mL",
            location: "",
            expiry: "",
            notes: ""
        });
        setShowAddForm(false);
    };

    // CSV parser
    const handleCSVImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!csvInput.trim()) return;

        const lines = csvInput.split("\n");
        const importedItems: InventoryItem[] = [];

        lines.forEach(line => {
            if (!line.trim()) return;
            const parts = line.split(",").map(p => p.trim());
            // Format expectation: Name, Category, Quantity, Unit, Location, Expiry (optional), Notes (optional)
            if (parts.length >= 4) {
                const name = parts[0];
                const cat = (parts[1] || "Reagent") as InventoryItem["category"];
                const qty = parseFloat(parts[2]) || 0;
                const unit = parts[3] || "units";
                const loc = parts[4] || "General Storage";
                const exp = parts[5] || "";
                const note = parts[6] || "";

                importedItems.push({
                    id: `inv-${Math.random().toString(36).substr(2, 9)}`,
                    item: name,
                    category: ["Reagent", "Chemical", "Kit", "Consumable", "Instrument"].includes(cat) ? cat : "Reagent",
                    quantity: qty,
                    unit: unit,
                    location: loc,
                    expiry: exp,
                    notes: note,
                    createdAt: new Date().toISOString()
                });
            }
        });

        if (importedItems.length > 0) {
            saveInventory([...importedItems, ...inventory]);
            setCsvInput("");
            setShowCSVImport(false);
        }
    };

    // Log Stock Consumption & deduct
    const handleUseStockSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItemForUse) return;

        const nextInv = inventory.map(item => {
            if (item.id === selectedItemForUse.id) {
                const deductedQty = Math.max(0, item.quantity - useQuantity);
                return { ...item, quantity: deductedQty };
            }
            return item;
        });

        saveInventory(nextInv);

        // Record a nice in-app notification or activity if desired
        const selectedExpName = experiments.find(x => x.id === linkedExperimentId)?.name || "Unspecified Experiment";

        // Push an entry to our general activity log helper
        const storedLogs = window.localStorage.getItem("biolab.activity_logs") || "[]";
        try {
            const parsed = JSON.parse(storedLogs);
            parsed.unshift({
                id: crypto.randomUUID(),
                action: `consumed ${useQuantity} ${selectedItemForUse.unit} of ${selectedItemForUse.item} for ${selectedExpName}`,
                module: "Inventory",
                createdAt: new Date().toISOString()
            });
            window.localStorage.setItem("biolab.activity_logs", JSON.stringify(parsed));
        } catch {}

        setShowUseStockForm(false);
        setSelectedItemForUse(null);
    };

    // Delete Reagent
    const handleDeleteItem = (id: string) => {
        if (confirm("Are you sure you want to delete this inventory item?")) {
            saveInventory(inventory.filter(item => item.id !== id));
        }
    };

    // AI Safety & Proximity Auditor
    const runAISafetyAudit = async () => {
        setIsAuditing(true);
        setAuditError("");
        setAiAuditResult("");

        // Format chemical storage details to send to Llama
        const chemicalListStr = inventory
            .map(item => `- **${item.item}** (Category: ${item.category}, Stored at: ${item.location})`)
            .join("\n");

        const prompt = `You are a professional chemical safety expert and biosafety officer.
Review the following list of reagents and chemicals along with their reported storage locations:

${chemicalListStr}

Perform a rigorous compatibility analysis:
1. Identify any incompatible storage violations (e.g. putting strong acids next to active flammables, strong oxidizers next to organic solvents, or chemicals that react violently).
2. Look specifically at flammables stored near oxidizers or corrosive acids.
3. Recommend exact storage corrections in a structured, actionable layout.
4. Output a summary safety rating (Green/Safe, Amber/Caution, or Red/Immediate Hazard).

Format your response beautiful with ## headings, bold markers, and clean bullet points. Keep it clear, concise, and direct.`;

        try {
            const res = await callGemini(prompt);
            setAiAuditResult(res);
        } catch (err) {
            console.error("AI Safety audit failed:", err);
            if (err instanceof Error && err.message === "API_KEY_MISSING") {
                setAuditError("API Key missing! Please configure your OpenRouter key in the Settings (top-right corner).");
            } else {
                setAuditError(err instanceof Error ? err.message : "Failed to run safety audit.");
            }
        } finally {
            setIsAuditing(false);
        }
    };

    // AI Expiry & Usage Predictions
    const runAIPrediction = async () => {
        setIsPredicting(true);
        setPredictError("");
        setAiPredictResult("");

        const itemsStr = inventory
            .map(item => `- **${item.item}** (Category: ${item.category}, Current Qty: ${item.quantity} ${item.unit}, Expiry: ${item.expiry || "None"}, Notes: ${item.notes || ""})`)
            .join("\n");

        const prompt = `You are a biolab logistics auditor. Review this inventory list:

${itemsStr}

1. Evaluate each item's current stock and notes.
2. Based on typical biological experiment usage rates, forecast which reagents are likely to run dry in the next 15-30 days.
3. Highlight items that are already expired or expire within 30 days, explaining why expired items are unsafe/unusable for quantitative work.
4. Generate a clean list of Reorder Recommendations.

Format with beautiful headings and bold markers. Keep it actionable.`;

        try {
            const res = await callGemini(prompt);
            setAiPredictResult(res);
        } catch (err) {
            console.error("AI prediction failed:", err);
            if (err instanceof Error && err.message === "API_KEY_MISSING") {
                setPredictError("API Key missing! Please configure your OpenRouter key in the Settings (top-right corner).");
            } else {
                setPredictError(err instanceof Error ? err.message : "Failed to generate AI predictions.");
            }
        } finally {
            setIsPredicting(false);
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-teal-400">M3 · Lab Operations</p>
                    <h1 className="mt-1 text-3xl font-bold text-white">Inventory Tracker</h1>
                    <p className="mt-1 text-slate-300 text-sm">Keep stock counts, storage locations, expiry reminders, and safety audits unified.</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                    <button
                        onClick={() => setShowCSVImport(true)}
                        className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
                    >
                        <Upload className="h-4 w-4" />
                        <span>Bulk Import CSV</span>
                    </button>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-teal-600 shadow-lg shadow-teal-500/20"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Reagent</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/40">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Items</p>
                    <p className="mt-1.5 text-2xl font-bold text-white">{inventory.length}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/40">
                    <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">Expired Items</p>
                    <p className="mt-1.5 text-2xl font-bold text-rose-400">{expiryStats.expired}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/40">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Expiring in 30d</p>
                    <p className="mt-1.5 text-2xl font-bold text-amber-400">{expiryStats.warning}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/40">
                    <p className="text-xs font-semibold uppercase tracking-wider text-teal-400">Low Stock Alert</p>
                    <p className="mt-1.5 text-2xl font-bold text-teal-400">
                        {inventory.filter(item => item.quantity <= 50 && item.category !== "Consumable").length}
                    </p>
                </div>
            </div>

            {/* Layout Split */}
            <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
                {/* Inventory Table Section */}
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col gap-5 shadow-lg backdrop-blur-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Search */}
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search reagents, locations..."
                                className="pl-9 pr-4"
                            />
                        </div>
                        {/* Category filter tabs */}
                        <div className="flex flex-wrap gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800 w-fit">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                                        selectedCategory === cat
                                            ? "bg-teal-500 text-slate-950 font-bold"
                                            : "text-slate-400 hover:text-slate-200"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950 text-slate-200 text-xs font-semibold border-b border-slate-800">
                                    <th className="p-4">Item Name</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Location</th>
                                    <th className="p-4">Stock Level</th>
                                    <th className="p-4">Expiry Date</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInventory.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                                            No materials found matching criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInventory.map(item => (
                                        <tr key={item.id} className="border-b border-slate-800/60 hover:bg-slate-800/10 text-slate-200 transition">
                                            <td className="p-4">
                                                <div className="font-semibold text-slate-100">{item.item}</div>
                                                {item.notes && <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{item.notes}</div>}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                                    item.category === 'Chemical' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                    item.category === 'Reagent' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                                                    item.category === 'Kit' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' :
                                                    item.category === 'Consumable' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                                                    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                                }`}>
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-300 text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                    <span className="font-medium">{item.location}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs font-semibold">
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-slate-100 font-bold">{item.quantity} {item.unit}</div>
                                                    {getQuantityIndicator(item.quantity, item.category)}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {getExpiryBadge(item.expiry)}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedItemForUse(item);
                                                            setUseQuantity(Math.min(item.quantity, 10));
                                                            setShowUseStockForm(true);
                                                        }}
                                                        disabled={item.quantity <= 0}
                                                        className="rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 px-2 py-1 text-[11px] font-bold transition hover:bg-teal-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Deduct
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="rounded-lg border border-slate-700 bg-slate-900/60 p-1 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Sidebar: AI Audits & Expiry prediction */}
                <div className="space-y-6">
                    {/* AI Safety Auditor Card */}
                    <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/20 p-6 space-y-4 backdrop-blur-md shadow-lg shadow-slate-950/50">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-emerald-400" />
                            <h3 className="text-sm font-bold text-slate-100">AI Safety Auditor</h3>
                            <Sparkles className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Audit storage proximity hazards automatically. Our AI reads location metadata and checks safe chemical rules.
                        </p>

                        <button
                            onClick={runAISafetyAudit}
                            disabled={isAuditing || inventory.length === 0}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/10 disabled:opacity-50"
                        >
                            {isAuditing ? (
                                <>
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    <span>Scanning Compatibility...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-3.5 w-3.5" />
                                    <span>Run AI Storage Safety Audit</span>
                                </>
                            )}
                        </button>

                        {auditError && (
                            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 flex gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span>{auditError}</span>
                            </div>
                        )}

                        {aiAuditResult && (
                            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-[11px] text-slate-300 max-h-[300px] overflow-y-auto whitespace-pre-wrap leading-relaxed space-y-2 border-l-4 border-l-emerald-500">
                                {aiAuditResult}
                            </div>
                        )}
                    </div>

                    {/* AI Expiry / Reorder Predictions Card */}
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 backdrop-blur-md shadow-lg shadow-slate-950/50 font-sans">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-teal-400" />
                            <h3 className="text-sm font-bold text-slate-100">AI Reorder Predictor</h3>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Analyze depletion rates based on common biological methods to forecast your stock burn rates.
                        </p>

                        <button
                            onClick={runAIPrediction}
                            disabled={isPredicting || inventory.length === 0}
                            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 transition disabled:opacity-50"
                        >
                            {isPredicting ? (
                                <>
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    <span>Calculating Depletion...</span>
                                </>
                            ) : (
                                <>
                                    <span>Forecast Consumption Rates</span>
                                </>
                            )}
                        </button>

                        {predictError && (
                            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 flex gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span>{predictError}</span>
                            </div>
                        )}

                        {aiPredictResult && (
                            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-[11px] text-slate-300 max-h-[300px] overflow-y-auto whitespace-pre-wrap leading-relaxed border-l-4 border-l-teal-500">
                                {aiPredictResult}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal: Add Reagent */}
            {showAddForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 transition"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                            <Plus className="h-5 w-5 text-teal-400" />
                            <span>Add Reagent to Inventory</span>
                        </h3>
                        <form onSubmit={handleAddReagent} className="space-y-4 pt-2">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="space-y-1 block sm:col-span-2">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Item Name</span>
                                    <Input
                                        value={newItem.item}
                                        onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
                                        placeholder="E.g. Tris buffer 1M"
                                        required
                                    />
                                </label>

                                <label className="space-y-1 block">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Category</span>
                                    <select
                                        value={newItem.category}
                                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-teal-500"
                                    >
                                        <option value="Reagent">Reagent</option>
                                        <option value="Chemical">Chemical</option>
                                        <option value="Kit">Kit</option>
                                        <option value="Consumable">Consumable</option>
                                        <option value="Instrument">Instrument</option>
                                    </select>
                                </label>

                                <div className="grid grid-cols-2 gap-2">
                                    <label className="space-y-1 block">
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Qty</span>
                                        <Input
                                            type="number"
                                            value={newItem.quantity}
                                            onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                                            min={0}
                                            required
                                        />
                                    </label>
                                    <label className="space-y-1 block">
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Unit</span>
                                        <Input
                                            value={newItem.unit}
                                            onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                                            placeholder="mL, g, units"
                                            required
                                        />
                                    </label>
                                </div>

                                <label className="space-y-1 block">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Storage Location</span>
                                    <Input
                                        value={newItem.location}
                                        onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                                        placeholder="Fridge 2 - Shelf B"
                                        required
                                    />
                                </label>

                                <label className="space-y-1 block">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Expiry Date</span>
                                    <Input
                                        type="date"
                                        value={newItem.expiry}
                                        onChange={(e) => setNewItem({ ...newItem, expiry: e.target.value })}
                                    />
                                </label>
                            </div>

                            <label className="space-y-1 block">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Notes</span>
                                <textarea
                                    value={newItem.notes}
                                    onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                                    placeholder="Chemical warnings, safety requirements, supplier link..."
                                    className="min-h-16 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-teal-500"
                                />
                            </label>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="rounded-xl border border-slate-700 bg-transparent hover:bg-slate-800 px-5 py-2 text-xs font-bold text-slate-300 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-teal-500 hover:bg-teal-600 px-6 py-2 text-xs font-bold text-slate-950 transition shadow-lg shadow-teal-500/20"
                                >
                                    Add Reagent
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Bulk CSV Import */}
            {showCSVImport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowCSVImport(false)}
                            className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 transition"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                            <Upload className="h-5 w-5 text-teal-400" />
                            <span>Bulk Reagent CSV Importer</span>
                        </h3>
                        <form onSubmit={handleCSVImportSubmit} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Paste raw CSV lines directly. Each line must represent one reagent matching this column layout:
                                </p>
                                <code className="block rounded-lg bg-slate-950 p-2.5 text-[11px] text-teal-400 font-mono">
                                    Item Name, Category, Quantity, Unit, Storage Location, Expiry (YYYY-MM-DD), Notes
                                </code>
                                <p className="text-[10px] text-slate-500 font-medium">
                                    Example: Ethanol 99%, Chemical, 500, mL, Shelf C (Flammables Cabinet), 2026-12-15, Flammable
                                </p>
                            </div>

                            <textarea
                                value={csvInput}
                                onChange={(e) => setCsvInput(e.target.value)}
                                placeholder="Ethanol 99%, Chemical, 500, mL, Shelf C, 2026-12-15, Flammable&#10;Tris Buffer, Reagent, 100, mL, Fridge 2, 2026-06-10"
                                className="min-h-40 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs text-slate-100 outline-none focus:border-teal-500 font-mono"
                                required
                            />

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowCSVImport(false)}
                                    className="rounded-xl border border-slate-700 bg-transparent hover:bg-slate-800 px-5 py-2 text-xs font-bold text-slate-300 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-teal-500 hover:bg-teal-600 px-6 py-2 text-xs font-bold text-slate-950 transition shadow-lg shadow-teal-500/20"
                                >
                                    Process & Import
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Use Stock / Deduct Reagent */}
            {showUseStockForm && selectedItemForUse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => {
                                setShowUseStockForm(false);
                                setSelectedItemForUse(null);
                            }}
                            className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 transition"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                            <Layers className="h-5 w-5 text-teal-400" />
                            <span>Log Material Consumption</span>
                        </h3>
                        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2">
                            <div className="text-xs text-slate-400">Selected Material:</div>
                            <div className="text-sm font-bold text-slate-200">{selectedItemForUse.item}</div>
                            <div className="text-xs text-slate-500 flex justify-between pt-1 font-medium">
                                <span>Current Stock: {selectedItemForUse.quantity} {selectedItemForUse.unit}</span>
                                <span>Location: {selectedItemForUse.location}</span>
                            </div>
                        </div>
                        <form onSubmit={handleUseStockSubmit} className="space-y-4 pt-2">
                            <div className="grid gap-4 grid-cols-2">
                                <label className="space-y-1 block col-span-2">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Quantity to Deduct ({selectedItemForUse.unit})</span>
                                    <Input
                                        type="number"
                                        value={useQuantity}
                                        onChange={(e) => setUseQuantity(Math.min(selectedItemForUse.quantity, Math.max(1, parseFloat(e.target.value) || 0)))}
                                        min={1}
                                        max={selectedItemForUse.quantity}
                                        required
                                    />
                                </label>

                                <label className="space-y-1 block col-span-2">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Link to Active Experiment</span>
                                    <select
                                        value={linkedExperimentId}
                                        onChange={(e) => setLinkedExperimentId(e.target.value)}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-teal-500"
                                        required
                                    >
                                        <option value="">Select Active Experiment</option>
                                        {experiments.map(exp => (
                                            <option key={exp.id} value={exp.id}>{exp.name} ({exp.stage})</option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUseStockForm(false);
                                        setSelectedItemForUse(null);
                                    }}
                                    className="rounded-xl border border-slate-700 bg-transparent hover:bg-slate-800 px-5 py-2 text-xs font-bold text-slate-300 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-teal-500 hover:bg-teal-600 px-6 py-2 text-xs font-bold text-slate-950 transition shadow-lg shadow-teal-500/20"
                                >
                                    Log Consumption
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
