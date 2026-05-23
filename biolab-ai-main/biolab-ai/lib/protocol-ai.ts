import Anthropic from "@anthropic-ai/sdk";

export interface Protocol {
    name: string;
    description?: string;
    sampleType?: string;
    objective?: string;
    steps?: Array<{
        order_num: number;
        instruction: string;
        duration_min?: number;
        notes?: string;
    }>;
    reagents?: Array<{
        name: string;
        quantity: number;
        unit: string;
        supplier?: string;
    }>;
}

export interface ProtocolAIResponse {
    type: "steps" | "reagents" | "instructions" | "summary";
    content: string;
    structured?: unknown;
}

const client = new Anthropic();

function formatProtocolContext(protocol: Protocol): string {
    let context = `## Protocol: ${protocol.name}\n`;
    if (protocol.description) context += `Description: ${protocol.description}\n`;
    if (protocol.sampleType) context += `Sample Type: ${protocol.sampleType}\n`;
    if (protocol.objective) context += `Objective: ${protocol.objective}\n`;

    if (protocol.steps && protocol.steps.length > 0) {
        context += "\n### Steps:\n";
        protocol.steps.forEach((step) => {
            context += `${step.order_num}. ${step.instruction}`;
            if (step.duration_min) context += ` (${step.duration_min} min)`;
            if (step.notes) context += ` - Note: ${step.notes}`;
            context += "\n";
        });
    }

    if (protocol.reagents && protocol.reagents.length > 0) {
        context += "\n### Reagents:\n";
        protocol.reagents.forEach((reagent) => {
            context += `- ${reagent.name}: ${reagent.quantity} ${reagent.unit}`;
            if (reagent.supplier) context += ` (${reagent.supplier})`;
            context += "\n";
        });
    }

    return context;
}

export async function queryProtocolAI(
    protocol: Protocol,
    query: string,
    queryType: "steps" | "reagents" | "instructions" | "summary"
): Promise<ProtocolAIResponse> {
    const protocolContext = formatProtocolContext(protocol);

    let systemPrompt = `You are a helpful laboratory protocol assistant. You provide accurate, clear, and practical guidance for laboratory procedures. 
You format responses in a clear, structured way that is easy to follow.`;

    let userPrompt = `${protocolContext}\n\n`;

    switch (queryType) {
        case "steps":
            systemPrompt += `\nWhen asked about steps, provide a clear, numbered breakdown of the procedure steps.
Format your response with:
- Step number and description
- Time required (if applicable)
- Important notes or precautions
- Expected outcomes`;
            userPrompt += `The user is asking about the protocol steps. Please provide a detailed breakdown.\n\nUser question: ${query}`;
            break;

        case "reagents":
            systemPrompt += `\nWhen asked about reagents, provide a comprehensive list of all required materials.
Format your response with:
- Complete reagent list with quantities
- Unit of measurement for each
- Supplier information (if available)
- Storage requirements
- Preparation notes (if needed)`;
            userPrompt += `The user is asking about reagents needed for this protocol. Please provide a complete reagent list.\n\nUser question: ${query}`;
            break;

        case "instructions":
            systemPrompt += `\nWhen asked about instructions, provide step-by-step detailed instructions that are clear and actionable.
Format your response with clear step numbers and ensure safety is emphasized.`;
            userPrompt += `The user is asking for detailed instructions. Please provide clear, step-by-step instructions.\n\nUser question: ${query}`;
            break;

        case "summary":
            systemPrompt += `\nProvide a concise summary of the protocol that captures the essential information.
Include the objective, key steps at a high level, main reagents, and expected outcomes.`;
            userPrompt += `Please provide a concise summary of this protocol.\n\nUser question: ${query}`;
            break;
    }

    try {
        const message = await client.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1024,
            system: systemPrompt,
            messages: [
                {
                    role: "user",
                    content: userPrompt,
                },
            ],
        });

        const content =
            message.content[0].type === "text" ? message.content[0].text : "";

        // Parse structured data if it's a reagents query
        let structured: unknown;
        if (queryType === "reagents") {
            structured = parseReagentsFromResponse(content);
        } else if (queryType === "steps") {
            structured = parseStepsFromResponse(content);
        }

        return {
            type: queryType,
            content,
            structured,
        };
    } catch (error) {
        console.error("Protocol AI query error:", error);
        throw new Error("Failed to generate protocol AI response");
    }
}

function parseReagentsFromResponse(
    content: string
): Array<{ name: string; quantity: string; unit: string }> {
    const reagents: Array<{ name: string; quantity: string; unit: string }> = [];

    // Simple regex-based parsing for common reagent formats
    const lines = content.split("\n");
    lines.forEach((line) => {
        // Match patterns like "- name: quantity unit" or "name (quantity unit)"
        const match = line.match(
            /[-•*]?\s*([^:0-9]+?):\s*([\d.]+)\s*([a-zA-Z/%]+)/
        );
        if (match) {
            reagents.push({
                name: match[1].trim(),
                quantity: match[2],
                unit: match[3].trim(),
            });
        }
    });

    return reagents;
}

function parseStepsFromResponse(
    content: string
): Array<{ number: number; instruction: string }> {
    const steps: Array<{ number: number; instruction: string }> = [];

    // Parse numbered steps
    const lines = content.split("\n");
    let currentStep = 0;

    lines.forEach((line) => {
        const match = line.match(/^(\d+)\.\s*(.+)/);
        if (match) {
            steps.push({
                number: parseInt(match[1]),
                instruction: match[2].trim(),
            });
        }
    });

    return steps;
}
