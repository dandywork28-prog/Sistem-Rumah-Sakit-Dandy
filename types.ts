export enum AgentType {
  ORCHESTRATOR = 'Central Manager',
  ADMISSION = 'PatientAdmissionAgent',
  SCHEDULING = 'AppointmentSchedulingAgent',
  PHARMACY = 'PharmacyManagementAgent',
  BILLING = 'BillingAndFinanceAgent',
}

export interface GeneratedDocumentData {
  title: string;
  type: 'INVOICE' | 'PRESCRIPTION' | 'ADMISSION_FORM' | 'MEMO';
  content: Record<string, string | number>;
  footer: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sender: AgentType | 'User';
  timestamp: Date;
  // Optional: If the agent generated a document tool call
  documentData?: GeneratedDocumentData;
  // Optional: Grounding sources from search
  groundingSources?: Array<{ uri: string; title: string }>;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  agent: AgentType;
  action: string;
  status: 'SUCCESS' | 'PENDING' | 'DENIED';
}