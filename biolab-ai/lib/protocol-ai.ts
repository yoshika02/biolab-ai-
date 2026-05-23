export interface ProtocolStep {
    order_num: number;
    instruction: string;
    duration_min?: number;
    notes?: string;
}

export interface ProtocolReagent {
    name: string;
    quantity?: number;
    unit?: string;
    supplier?: string;
    notes?: string;
}

export interface Protocol {
    id?: string;
    name: string;
    description?: string;
    sampleType?: string;
    objective?: string;
    steps?: ProtocolStep[];
    reagents?: ProtocolReagent[];
}

export type ProtocolQueryType = "auto" | "steps" | "reagents" | "instructions" | "summary";

export interface ProtocolAIResponse {
    type: Exclude<ProtocolQueryType, "auto">;
    content: string;
    structured?: ProtocolStep[] | ProtocolReagent[];
}

const stepWords = /\b(step|steps|procedure|protocol|breakdown|workflow|first|next|then|how)\b/i;
const reagentWords = /\b(reagent|reagents|material|materials|buffer|buffers|chemical|chemicals|solution|solutions|list|total|needed|required)\b/i;

export function classifyProtocolQuery(query: string, requestedType: ProtocolQueryType): Exclude<ProtocolQueryType, "auto"> {
    if (requestedType !== "auto") return requestedType;
    if (reagentWords.test(query)) return "reagents";
    if (stepWords.test(query)) return "steps";
    if (/\b(summary|overview|brief)\b/i.test(query)) return "summary";
    return "instructions";
}

export function buildProtocolResponse(protocol: Protocol, query: string, requestedType: ProtocolQueryType = "auto"): ProtocolAIResponse {
    const type = classifyProtocolQuery(query, requestedType);
    if (type === "reagents") return buildReagentResponse(protocol);
    if (type === "steps") return buildStepResponse(protocol);
    if (type === "summary") return buildSummaryResponse(protocol);
    return buildInstructionResponse(protocol, query);
}

function buildStepResponse(protocol: Protocol): ProtocolAIResponse {
    const steps = normalizeSteps(protocol.steps);
    if (!steps.length) {
        return {
            type: "steps",
            content: `Step breakdown for ${protocol.name}\n\nNo protocol steps are saved yet. Add the procedure steps in the Protocol Builder, then ask again and I will return a numbered bench-ready breakdown with timing, notes, and checkpoints.`,
            structured: [],
        };
    }

    const totalMinutes = steps.reduce((sum, step) => sum + (Number(step.duration_min) || 0), 0);
    const lines = [
        `Step breakdown for ${protocol.name}`,
        "",
        protocol.objective ? `Objective: ${protocol.objective}` : "",
        protocol.sampleType ? `Sample type: ${protocol.sampleType}` : "",
        totalMinutes ? `Estimated hands-on/run time: ${totalMinutes} minutes` : "",
        "",
        "Numbered procedure:",
        ...steps.map((step) => {
            const parts = [`${step.order_num}. ${step.instruction}`];
            if (step.duration_min) parts.push(`Time: ${step.duration_min} min`);
            if (step.notes) parts.push(`Note: ${step.notes}`);
            return parts.join("\n   ");
        }),
        "",
        "Bench check:",
        "- Confirm sample identity and labels before starting.",
        "- Prepare all reagents before step 1.",
        "- Record deviations, incubation times, and unexpected observations.",
    ].filter(Boolean);

    return { type: "steps", content: lines.join("\n"), structured: steps };
}

function buildReagentResponse(protocol: Protocol): ProtocolAIResponse {
    const reagents = normalizeReagents(protocol.reagents);
    if (!reagents.length) {
        return {
            type: "reagents",
            content: `Total reagent list for ${protocol.name}\n\nNo reagents are saved yet. Add reagents with quantity and unit, then ask again and I will return the complete materials list and preparation checklist.`,
            structured: [],
        };
    }

    const lines = [
        `Total reagent list for ${protocol.name}`,
        "",
        `Total unique reagents/materials: ${reagents.length}`,
        "",
        "Required reagents:",
        ...reagents.map((reagent, index) => {
            const amount = reagent.quantity ? `${reagent.quantity} ${reagent.unit || ""}`.trim() : "quantity not specified";
            const supplier = reagent.supplier ? `; supplier: ${reagent.supplier}` : "";
            const notes = reagent.notes ? `; note: ${reagent.notes}` : "";
            return `${index + 1}. ${reagent.name} - ${amount}${supplier}${notes}`;
        }),
        "",
        "Preparation checklist:",
        "- Verify expiry dates and storage conditions.",
        "- Label prepared buffers/solutions with concentration, date, and owner.",
        "- Keep cold-chain reagents on ice where the SOP requires it.",
    ];

    return { type: "reagents", content: lines.join("\n"), structured: reagents };
}

function buildInstructionResponse(protocol: Protocol, query: string): ProtocolAIResponse {
    const steps = normalizeSteps(protocol.steps);
    const reagents = normalizeReagents(protocol.reagents);
    const lines = [
        `Protocol guidance for ${protocol.name}`,
        "",
        protocol.objective ? `Objective: ${protocol.objective}` : "",
        `Question: ${query}`,
        "",
        steps.length
            ? `Start with step 1 and follow the saved ${steps.length}-step procedure in order. Ask for "steps" if you want the full numbered breakdown.`
            : "Add protocol steps to receive procedure-specific guidance.",
        reagents.length
            ? `There are ${reagents.length} saved reagents/materials for this protocol. Ask for "reagents" to see the full list.`
            : "Add reagents to receive a complete materials list.",
        "",
        "Quality guardrails:",
        "- Do not skip controls or labeling checks.",
        "- Document any deviation from the saved SOP.",
        "- Escalate unclear safety conditions before proceeding.",
    ].filter(Boolean);

    return { type: "instructions", content: lines.join("\n") };
}

function buildSummaryResponse(protocol: Protocol): ProtocolAIResponse {
    const steps = normalizeSteps(protocol.steps);
    const reagents = normalizeReagents(protocol.reagents);
    const lines = [
        `Protocol summary for ${protocol.name}`,
        "",
        protocol.description || protocol.objective || "No description saved yet.",
        "",
        `Saved steps: ${steps.length}`,
        `Saved reagents/materials: ${reagents.length}`,
        protocol.sampleType ? `Sample type: ${protocol.sampleType}` : "",
        "",
        steps.length ? `First step: ${steps[0].instruction}` : "Add steps to make this summary operational.",
        reagents.length ? `Key materials: ${reagents.slice(0, 5).map((item) => item.name).join(", ")}` : "Add reagents to complete the material summary.",
    ].filter(Boolean);

    return { type: "summary", content: lines.join("\n") };
}

function normalizeSteps(steps: ProtocolStep[] = []) {
    return steps
        .filter((step) => step.instruction.trim())
        .map((step, index) => ({ ...step, order_num: step.order_num || index + 1 }))
        .sort((a, b) => a.order_num - b.order_num);
}

function normalizeReagents(reagents: ProtocolReagent[] = []) {
    return reagents.filter((reagent) => reagent.name.trim());
}
