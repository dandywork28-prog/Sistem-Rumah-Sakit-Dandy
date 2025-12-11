import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { AgentType, GeneratedDocumentData } from "../types";

// Initialize Gemini Client
// NOTE: In a real production environment, ensure strict backend proxying for keys.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Tool Definitions ---

// Tool 1: Generate Document (Used by Admission, Pharmacy, Billing)
const generateDocumentFunction: FunctionDeclaration = {
  name: 'generate_document',
  description: 'Generates an official hospital document (Invoice, Prescription, Admission Form). REQUIRED for any formal request.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      docType: {
        type: Type.STRING,
        description: 'Type of document: INVOICE, PRESCRIPTION, ADMISSION_FORM, MEMO',
        enum: ['INVOICE', 'PRESCRIPTION', 'ADMISSION_FORM', 'MEMO']
      },
      title: { type: Type.STRING, description: 'Title of the document' },
      fields: {
        type: Type.OBJECT,
        description: 'Key-value pairs of the document content (e.g., Patient Name, Cost, Drug Name)',
        additionalProperties: true, // Allow dynamic fields
      },
      complianceNote: { type: Type.STRING, description: 'HIPAA or Audit compliance footer note' }
    },
    required: ['docType', 'title', 'fields', 'complianceNote']
  }
};

/**
 * PHASE 1: ORCHESTRATOR
 * Decides which agent handles the request.
 */
export const orchestrateRequest = async (userQuery: string): Promise<{ agent: AgentType; reasoning: string }> => {
  const model = "gemini-2.5-flash";
  
  const systemInstruction = `
    ROLE: You are the Central Manager (Orchestrator) for the MHO (Manage Hospital Operations) system.
    GOAL: Analyze the user request and delegate it to the single most appropriate Sub-Agent.
    
    SUB-AGENTS:
    1. PatientAdmissionAgent: Registration, EHR updates, admission/discharge.
    2. AppointmentSchedulingAgent: New appointments, rescheduling, doctor availability.
    3. PharmacyManagementAgent: Medication requests, drug interactions, prescriptions.
    4. BillingAndFinanceAgent: Invoices (Faktur), Insurance Claims (Klaim), Revenue Cycle Management (RCM).
    
    OUTPUT: Return a JSON object ONLY.
    {
      "agent": "PatientAdmissionAgent" | "AppointmentSchedulingAgent" | "PharmacyManagementAgent" | "BillingAndFinanceAgent",
      "reasoning": "Brief explanation of why"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: userQuery,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.1 // Low temperature for deterministic routing
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Orchestrator");
    
    const result = JSON.parse(text);
    return {
      agent: result.agent as AgentType,
      reasoning: result.reasoning
    };

  } catch (error) {
    console.error("Orchestration Failed:", error);
    // Fallback to a safe default or re-throw
    return { agent: AgentType.ADMISSION, reasoning: "Fallback due to error." };
  }
};

/**
 * PHASE 2: SUB-AGENT EXECUTION
 * Executes the request using the specific persona and tools.
 */
export const executeAgentTask = async (
  agent: AgentType, 
  userQuery: string,
  history: string // Simplistic history context
): Promise<{ 
  text: string; 
  document?: GeneratedDocumentData; 
  groundingSources?: Array<{uri: string, title: string}> 
}> => {

  const model = "gemini-2.5-flash";
  let tools: Tool[] = [];
  let systemInstruction = "";

  // Configure specific agent personas and tools
  switch (agent) {
    case AgentType.ADMISSION:
      systemInstruction = `Role: PatientAdmissionAgent. 
      Task: Handle patient registration and EHR updates. 
      Compliance: Ensure HIPAA compliance. Use 'generate_document' if the user needs an Admission Form.`;
      tools = [{ functionDeclarations: [generateDocumentFunction] }];
      break;

    case AgentType.SCHEDULING:
      systemInstruction = `Role: AppointmentSchedulingAgent. 
      Task: Check doctor availability and schedule appointments. 
      Tools: Use Google Search to find doctor schedules or general medical dept info if implied.`;
      tools = [{ googleSearch: {} }];
      break;

    case AgentType.PHARMACY:
      systemInstruction = `Role: PharmacyManagementAgent. 
      Task: Check drug interactions and issue prescriptions.
      Tools: Use Google Search to verify drug contraindications. Use 'generate_document' to issue a PRESCRIPTION.`;
      tools = [{ googleSearch: {} }, { functionDeclarations: [generateDocumentFunction] }];
      break;

    case AgentType.BILLING:
      systemInstruction = `Role: BillingAndFinanceAgent (RCM Focus). 
      Task: Manage invoices, insurance claims, and financial audits.
      Tone: Professional, precise, audit-ready.
      Tools: You MUST use 'generate_document' if the user asks for an invoice (Faktur) or claim status report.`;
      tools = [{ functionDeclarations: [generateDocumentFunction] }];
      break;
      
    default:
      systemInstruction = "You are a helpful hospital assistant.";
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Context: ${history}\n\nCurrent Request: ${userQuery}`,
      config: {
        systemInstruction,
        tools,
        temperature: 0.3,
      }
    });

    let outputText = "";
    let generatedDoc: GeneratedDocumentData | undefined;
    let sources: Array<{uri: string, title: string}> = [];

    // Check for Grounding (Search Results)
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      sources = response.candidates[0].groundingMetadata.groundingChunks
        .map((chunk: any) => chunk.web)
        .filter((web: any) => web)
        .map((web: any) => ({ uri: web.uri, title: web.title }));
    }

    // Handle Function Calls (Tool Usage)
    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === 'generate_document') {
        const args = call.args as any;
        generatedDoc = {
          type: args.docType,
          title: args.title,
          content: args.fields,
          footer: args.complianceNote
        };
        outputText = `I have generated the ${args.docType} document for you. Please verify the details below.`;
      }
    } else {
      outputText = response.text || "Processed request.";
    }

    // If text is empty but we have a doc (rare edge case), provide default text
    if (!outputText && generatedDoc) {
      outputText = "Document generated.";
    }

    return {
      text: outputText,
      document: generatedDoc,
      groundingSources: sources
    };

  } catch (error) {
    console.error("Agent Execution Failed:", error);
    return { text: "I encountered a system error processing your request. Please contact IT support." };
  }
};
