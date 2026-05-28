'use client';

import { useState, useEffect, useMemo, useRef } from "react";
import {
    ShieldAlert,
    Sparkles,
    Send,
    AlertTriangle,
    RefreshCw,
    X,
    FileText,
    Check,
    CheckCircle2,
    Shield,
    Trash2,
    BookOpen,
    ArrowDownToLine,
    Info,
    AlertCircle,
    UserCheck,
    Skull,
    Flame,
    Eye
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { callGemini, getStoredOpenRouterKey } from "@/lib/gemini";

interface InventoryItem {
    id: string;
    item: string;
    category: string;
    quantity: number;
    unit: string;
    location: string;
}

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
}

interface ChemicalSafetyRecord {
    name: string;
    casNumber: string;
    formula: string;
    ghsClass: string;
    pictograms: string[]; // e.g. "Flame", "Corrosive", "Skull"
    ppeRequired: string[]; // e.g. "Double Nitrile Gloves", "Splash Goggles", "Fume Hood"
    exposureRisk: string;
    mitigation: string;
}

// Pre-seeded compliance safety records for common lab chemicals
const CHEMICAL_SDS_DATABASE: Record<string, ChemicalSafetyRecord> = {
    "Ethanol (99% pure)": {
        name: "Ethanol (99% pure)",
        casNumber: "64-17-5",
        formula: "C2H5OH",
        ghsClass: "Flammable Liquid - Category 2",
        pictograms: ["Flame"],
        ppeRequired: ["Nitrile Gloves", "Splash Goggles", "Lab Coat"],
        exposureRisk: "High fire hazard. Vapors may travel to ignition sources. Inhalation causes drowsiness.",
        mitigation: "Store in dedicated flammables cabinet. Keep away from heat, open flames, and strong oxidizers."
    },
    "Nitric Acid (Concentrated)": {
        name: "Nitric Acid (Concentrated)",
        casNumber: "7697-37-2",
        formula: "HNO3",
        ghsClass: "Oxidizer - Category 3, Corrosive - Category 1A",
        pictograms: ["Flame", "Corrosive"],
        ppeRequired: ["Acid-resistant Gloves", "Full Face Shield", "Fume Hood", "Lab Apron"],
        exposureRisk: "Severe skin burns and eye damage. Oxidizer; reacts violently with combustible organic liquids.",
        mitigation: "Store in dedicated acid cabinet. Never mix directly with active flammables or organic solvents."
    },
    "Tris-HCl Buffer (pH 8.0)": {
        name: "Tris-HCl Buffer (pH 8.0)",
        casNumber: "1185-53-1",
        formula: "C4H11NO3·HCl",
        ghsClass: "Mild Skin & Eye Irritant",
        pictograms: ["General Warning"],
        ppeRequired: ["Standard Lab Gloves", "Goggles", "Lab Coat"],
        exposureRisk: "Low toxicity. May cause mild respiratory, skin, or eye irritation.",
        mitigation: "Keep in a cool dry storage area. Clean spills immediately with water."
    },
    "DAPI Nucleic Acid Stain": {
        name: "DAPI Nucleic Acid Stain",
        casNumber: "28718-90-3",
        formula: "C16H15N5·2HCl",
        ghsClass: "Mutagenic Warning, Mild Irritant",
        pictograms: ["Skull"],
        ppeRequired: ["Double Nitrile Gloves", "Goggles", "Lab Coat"],
        exposureRisk: "Potential mutagen. Light sensitive. Hazardous if absorbed through skin or ingested.",
        mitigation: "Store in dark freezer box at -20°C. Dispose in designated biohazard solid waste."
    },
    "Taq Polymerase PCR Kit": {
        name: "Taq Polymerase PCR Kit",
        casNumber: "9012-90-2",
        formula: "Biomolecule Buffer",
        ghsClass: "Non-hazardous",
        pictograms: [],
        ppeRequired: ["Standard Gloves", "Lab Coat"],
        exposureRisk: "Non-toxic under typical experimental applications.",
        mitigation: "Store at -20°C. No specific GHS hazards reported."
    },
    "Falcon Tubes (15mL)": {
        name: "Falcon Tubes (15mL)",
        casNumber: "Plasticware",
        formula: "Polypropylene",
        ghsClass: "Non-hazardous",
        pictograms: [],
        ppeRequired: ["None required"],
        exposureRisk: "Non-hazardous consumable.",
        mitigation: "Store in standard inventory cabinets. Avoid direct high-temperature heat sources."
    }
};

const SUGGESTED_PROMPTS = [
    "Review safety compatibility of my current stock cabinet storage.",
    "Show GHS hazards and chemical precautions for Nitric Acid.",
    "Is it safe to store Ethanol next to Nitric Acid?",
    "Give me standard emergency spill protocols for concentrated acids."
];

export default function SafetyPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputQuery, setInputQuery] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [reviews, setReviews] = useState<Record<string, { date: string; user: string }>>({});
    const [showPrintView, setShowPrintView] = useState(false);
    const [chatError, setChatError] = useState("");
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial seed load
    useEffect(() => {
        const storedInv = window.localStorage.getItem("biolab.inventory_premium");
        if (storedInv) {
            try {
                setInventory(JSON.parse(storedInv));
            } catch {
                setInventory([]);
            }
        }

        const storedReviews = window.localStorage.getItem("biolab.risk_register_reviews");
        if (storedReviews) {
            try {
                setReviews(JSON.parse(storedReviews));
            } catch {
                setReviews({});
            }
        }

        // Setup hello message from safety compliance officer
        setMessages([
            {
                id: "welcome",
                role: "assistant",
                content: "Hello! I am your **BioLab AI Chemical Safety Compliance Officer**. I have scanned your current laboratory inventory stock list.\n\nYou can ask me questions about **chemical compatibility warnings**, GHS classification hazards, required protective equipment (PPE), and safe laboratory cabinet sorting guidelines. What can I help you check today?",
                createdAt: new Date().toISOString()
            }
        ]);
    }, []);

    // Scroll to chat bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Save reviews
    const toggleReview = (itemName: string) => {
        const nextReviews = { ...reviews };
        if (nextReviews[itemName]) {
            delete nextReviews[itemName];
        } else {
            nextReviews[itemName] = {
                date: new Date().toLocaleDateString(),
                user: "Dr. Yoshi (Lab Head)"
            };
        }
        setReviews(nextReviews);
        window.localStorage.setItem("biolab.risk_register_reviews", JSON.stringify(nextReviews));
    };

    // Chat processor
    const handleSendQuery = async (queryText: string) => {
        if (!queryText.trim() || isSending) return;
        setIsSending(true);
        setChatError("");

        const userMsg: ChatMessage = {
            id: `msg-${Date.now()}-user`,
            role: "user",
            content: queryText,
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputQuery("");

        // Format lab inventory for AI context injection
        const inventoryContext = inventory
            .map(x => `- **${x.item}** (Stored at: ${x.location}, Category: ${x.category})`)
            .join("\n");

        const prompt = `You are a certified professional Chemical Safety Officer, Biosafety Expert, and SDS compliance auditor for a molecular biology laboratory.
You have scanning rights to the current lab storage inventory details:

**Active Lab Inventory Stock:**
${inventoryContext || "No chemicals currently in inventory."}

**User safety query:**
"${queryText}"

Provide a comprehensive, authoritative, and direct compliance audit answer:
1. Address the chemical safety concern exactly, stating any direct storage warnings or reaction hazards (especially incompatibilities like flammables near acids or oxidizers).
2. If specific reagents in the lab inventory are mentioned or relevant, call them out.
3. List explicit hazard labels (GHS) and required Personal Protective Equipment (PPE) that must be worn at the bench.
4. Keep the style scientific, warning-oriented, and structured with clear markdown headings, bullet lists, and warnings. Use bold red markers for immediate hazard conditions.`;

        try {
            const reply = await callGemini(prompt);
            const assistantMsg: ChatMessage = {
                id: `msg-${Date.now()}-ai`,
                role: "assistant",
                content: reply,
                createdAt: new Date().toISOString()
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (err) {
            console.error("Safety Chatbot failed:", err);
            if (err instanceof Error && err.message === "API_KEY_MISSING") {
                setChatError("API Key missing! Please configure your OpenRouter key in the Settings (top-right corner).");
            } else {
                setChatError(err instanceof Error ? err.message : "Failed to communicate with safety officer.");
            }
        } finally {
            setIsSending(false);
        }
    };

    // Compiling chemical risk record cross reference from inventory
    const crossReferencedRegister = useMemo(() => {
        return inventory.map(item => {
            const sdsRecord = CHEMICAL_SDS_DATABASE[item.item] || {
                name: item.item,
                casNumber: "Unavailable",
                formula: "Unknown",
                ghsClass: "Standard lab material. Refer to manufacturer SDS.",
                pictograms: [],
                ppeRequired: ["Standard Gloves", "Goggles", "Lab Coat"],
                exposureRisk: "Refer to standard lab protocol safeguards.",
                mitigation: `Stored at: ${item.location}. Maintain general safety storage practices.`
            };
            return {
                id: item.id,
                item: item.item,
                location: item.location,
                sds: sdsRecord
            };
        });
    }, [inventory]);

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* Print Header styling block (Visible ONLY during print) */}
            {showPrintView ? (
                <div className="fixed inset-0 z-50 bg-white text-slate-900 p-8 overflow-y-auto space-y-6 print:absolute print:inset-0">
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                        <div>
                            <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">BioLab AI Compliance Safety Report</h1>
                            <p className="text-xs text-slate-600 font-mono mt-1">Generated: {new Date().toLocaleDateString()} | Active Laboratory Compliance</p>
                        </div>
                        <button
                            onClick={() => setShowPrintView(false)}
                            className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded transition hover:bg-slate-800 print:hidden"
                        >
                            Back to Dashboard
                        </button>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-sm font-bold uppercase text-slate-800">1. Certified Lab Risk Register</h2>
                        <table className="w-full text-left text-xs border-collapse border border-slate-300">
                            <thead>
                                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                                    <th className="p-2 border border-slate-300">Chemical Name</th>
                                    <th className="p-2 border border-slate-300">CAS Number</th>
                                    <th className="p-2 border border-slate-300">GHS Classification</th>
                                    <th className="p-2 border border-slate-300">PPE Controls</th>
                                    <th className="p-2 border border-slate-300">Storage Location</th>
                                    <th className="p-2 border border-slate-300 text-right">Lab Head Sign-off</th>
                                </tr>
                            </thead>
                            <tbody>
                                {crossReferencedRegister.map(row => (
                                    <tr key={row.id} className="border-b border-slate-200">
                                        <td className="p-2 border border-slate-300 font-semibold">{row.item}</td>
                                        <td className="p-2 border border-slate-300 font-mono">{row.sds.casNumber}</td>
                                        <td className="p-2 border border-slate-300 text-slate-600">{row.sds.ghsClass}</td>
                                        <td className="p-2 border border-slate-300">{row.sds.ppeRequired.join(", ")}</td>
                                        <td className="p-2 border border-slate-300">{row.location}</td>
                                        <td className="p-2 border border-slate-300 text-right font-mono font-semibold text-[10px]">
                                            {reviews[row.item] ? `SIGNED: ${reviews[row.item].date}` : "PENDING REVIEW"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pt-12 grid grid-cols-2 gap-8 text-xs">
                        <div className="border-t border-slate-900 pt-3">
                            <p className="font-bold">Compliance Officer Signature</p>
                            <p className="text-slate-500 font-mono mt-1">BioLab AI Compliance Agent</p>
                        </div>
                        <div className="border-t border-slate-900 pt-3">
                            <p className="font-bold">Lab Director / Head Approval</p>
                            <p className="text-slate-500 font-mono mt-1">Date: ________________________</p>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Standard Dashboard view */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">M6 · Lab Safety</p>
                    <h1 className="mt-1 text-3xl font-bold text-white">Chemical Safety Console</h1>
                    <p className="mt-1 text-slate-300 text-sm">
                        Verify reagent compatibilities, query safety chatbots with live inventory awareness, and manage compliance approvals.
                    </p>
                </div>
                <button
                    onClick={() => setShowPrintView(true)}
                    className="flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-slate-900 shadow-md shadow-slate-950/20 shrink-0"
                >
                    <ArrowDownToLine className="h-4 w-4 text-emerald-400" />
                    <span>Print Safety Compliance Report</span>
                </button>
            </div>

            {/* Two Column Console split */}
            <div className="grid gap-6 lg:grid-cols-[1fr_450px]">
                
                {/* Chatbox section */}
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between shadow-lg backdrop-blur-md min-h-[600px]">
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                <Shield className="h-4.5 w-4.5 text-emerald-400" />
                                <span>AI Safety Officer Chat</span>
                            </h3>
                            <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded">Inventory Aware</span>
                        </div>

                        {/* Message log */}
                        <div className="flex-1 overflow-y-auto max-h-[420px] space-y-4 pr-2 py-2">
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 max-w-[85%] ${
                                        msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                                    }`}
                                >
                                    <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'bg-emerald-500 text-slate-950 font-semibold rounded-tr-none'
                                            : 'bg-slate-950 text-slate-200 rounded-tl-none border border-slate-800 whitespace-pre-wrap font-mono'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Error warning */}
                        {chatError && (
                            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 flex gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span>{chatError}</span>
                            </div>
                        )}

                        {/* Quick Prompts */}
                        <div className="space-y-2 pt-2 border-t border-slate-850">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Suggestions:</div>
                            <div className="flex flex-wrap gap-1.5">
                                {SUGGESTED_PROMPTS.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => handleSendQuery(p)}
                                        className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[10px] font-medium text-slate-400 hover:text-slate-200 hover:border-slate-700 transition"
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Chat Input */}
                    <div className="mt-4 flex gap-2.5">
                        <Input
                            value={inputQuery}
                            onChange={(e) => setInputQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendQuery(inputQuery)}
                            placeholder="Ask safety inquiries about chemical storage, hazards, or reactions..."
                            disabled={isSending}
                            className="flex-1"
                        />
                        <button
                            onClick={() => handleSendQuery(inputQuery)}
                            disabled={isSending || !inputQuery.trim()}
                            className="flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-slate-950 transition hover:bg-emerald-600 disabled:opacity-50"
                        >
                            {isSending ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Risk assessment SDS sidebar list */}
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-lg backdrop-blur-md">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            <ShieldAlert className="h-4.5 w-4.5 text-emerald-400" />
                            <span>Risk Registry Register</span>
                        </h3>
                        <span className="text-[10px] text-slate-400 font-bold">
                            {crossReferencedRegister.length} materials in lab
                        </span>
                    </div>

                    {crossReferencedRegister.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-850 p-12 text-center text-slate-500 text-sm">
                            Add items to inventory to compile SDS risk assessment records automatically.
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                            {crossReferencedRegister.map(row => (
                                <div key={row.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3 transition hover:border-slate-700">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="font-bold text-slate-100 text-xs">{row.item}</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">CAS #: {row.sds.casNumber} | {row.sds.formula}</div>
                                        </div>

                                        {/* Review approval button */}
                                        <button
                                            onClick={() => toggleReview(row.item)}
                                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold border transition ${
                                                reviews[row.item]
                                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/35"
                                                    : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                            }`}
                                        >
                                            {reviews[row.item] ? (
                                                <>
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    <span>Reviewed</span>
                                                </>
                                            ) : (
                                                <span>Mark Reviewed</span>
                                            )}
                                        </button>
                                    </div>

                                    {/* Pictogram warning list */}
                                    {row.sds.pictograms.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                                            {row.sds.pictograms.map(pic => (
                                                <span
                                                    key={pic}
                                                    className="inline-flex items-center gap-1 rounded bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-400"
                                                >
                                                    {pic === "Flame" ? <Flame className="h-2.5 w-2.5" /> : <Skull className="h-2.5 w-2.5" />}
                                                    <span>{pic}</span>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Hazard and PPE specifications */}
                                    <div className="space-y-1.5 text-[11px] text-slate-300 font-medium pt-1">
                                        <div>
                                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Exposure Hazard</span>
                                            <p className="text-slate-300 mt-0.5 leading-relaxed">{row.sds.exposureRisk}</p>
                                        </div>
                                        <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-900 mt-2 space-y-1">
                                            <span className="text-slate-500 block text-[9px] uppercase font-bold">Bench Controls Required (PPE)</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {row.sds.ppeRequired.map(ppe => (
                                                    <span key={ppe} className="rounded bg-slate-950 px-2 py-0.5 text-[9px] font-semibold text-teal-400 border border-slate-800">
                                                        {ppe}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
