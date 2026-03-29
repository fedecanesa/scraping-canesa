// types.ts — Tipos compartidos para el contrato API ↔ Frontend (DeepReacher)

export type StepStatus = "pending" | "running" | "completed" | "failed";

// ─── Análisis del negocio ─────────────────────────────────────────────────────

export interface Opportunity {
  title: string;
  explanation: string;
  impact: string;
  solution: string;
}

export interface Issue {
  title: string;
  description: string;
}

export interface ProfileData {
  business_summary: string;
  what_they_do: string;
  business_model: string;
  what_doing_well: string[];
  pain_points: string[];
  technology: string[];
  issues: Issue[];
  opportunities: Opportunity[];
  ideal_customer: string;
  lead_score: number;
  lead_score_reason: string;
}

// ─── Mensajes ─────────────────────────────────────────────────────────────────

export interface MessageVariant {
  id: "main" | "variant_a" | "variant_b";
  label: string;
  content: string;
}

// ─── API contract ─────────────────────────────────────────────────────────────

export interface ProcessStartResponse {
  run_id: string;
  status: "started";
}

export interface ProcessStatusResponse {
  run_id: string;
  target_url: string;
  status: "running" | "completed" | "failed";
  current_step: string;
  steps: Record<string, StepStatus>;
  created_at: string;
  finished_at: string | null;
  result: {
    final_email?: string;
    message_variants?: MessageVariant[];
    profile_data?: ProfileData;
    target_url?: string;
    run_id?: string;
  } | null;
  error: string | null;
}

// ─── Configuración del pipeline ───────────────────────────────────────────────

export type Objective = "sell" | "partnership";
export type UserType = "marketing_agency" | "dev_agency" | "other";

export interface PipelineConfig {
  apiToken: string;
  myServiceInfo: string;
  companyTone: string;
  maxCrawlPages: number;
  skipCleaning: boolean;
  userType: UserType;
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  apiToken: "",
  myServiceInfo: "Soluciones de IA para empresas",
  companyTone: "profesional y cercano",
  maxCrawlPages: 1,
  skipCleaning: true,
  userType: "other",
};

/** Template de configuración guardado por el usuario. */
export interface Template {
  id: string;
  name: string;
  myServiceInfo: string;
  companyTone: string;
}

// ─── Prospect (unidad central) ────────────────────────────────────────────────

export type ProspectStatus = "queued" | "analyzing" | "completed" | "failed";

export interface Prospect {
  id: string;             // ID estable del frontend
  runId: string | null;   // run_id del backend
  url: string;
  domain: string;
  status: ProspectStatus;
  createdAt: string;
  finishedAt: string | null;
  finalEmail: string | null;       // compat: = main variant content
  messageVariants: MessageVariant[] | null;
  profileData: ProfileData | null;
  error: string | null;
  currentStep: string;
  steps: Record<string, string>;
  objective: Objective;
  config: {
    myServiceInfo: string;
    companyTone: string;
    maxCrawlPages: number;
    skipCleaning: boolean;
    userType: UserType;
  };
}

// ─── Discovery (Google Places) ───────────────────────────────────────────────

export interface PlaceResult {
  place_id: string;
  name: string;
  website: string | null;
  address: string | null;
  rating: number | null;
  rating_count: number | null;
}

export interface SearchResponse {
  results: PlaceResult[];
  total: number;
  query: string;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

export const PROSPECTS_STORAGE_KEY = "deepreacher_prospects_v1";
export const PROSPECTS_MAX = 100;
export const CONFIG_STORAGE_KEY = "deepreacher_config";
export const TEMPLATES_STORAGE_KEY = "deepreacher_templates";
