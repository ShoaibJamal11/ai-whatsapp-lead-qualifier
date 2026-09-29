// ─── Chat Messages ───────────────────────────────────────────────────

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Lead Qualification ──────────────────────────────────────────────

export type BudgetStatus =
  | "pending"
  | "disqualified"
  | "qualified";

export type Bottleneck =
  | "Creative decay"
  | "Attribution"
  | "Tracking"
  | "Scaling"
  | string;

export type LeadStatus =
  | "Unqualified"
  | "Qualifying"
  | "High-Intent Qualified";

export interface LeadQualification {
  estimatedSpend: string | null;
  bottleneck: Bottleneck | null;
  isQualified: boolean;
}

// ─── API ─────────────────────────────────────────────────────────────

export interface ChatApiResponse {
  reply: string;
  leadData: LeadQualification;
  showBookingCard: boolean;
}
