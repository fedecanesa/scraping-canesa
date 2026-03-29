// types.ts — Tipos compartidos para el contrato API ↔ Frontend

export type StepStatus = "pending" | "running" | "completed" | "failed";

export interface ProfileData {
  business_summary: string;
  pain_points: string[];
  technology: string[];
  opportunities: string[];
  ideal_customer: string;
}

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
    profile_data?: ProfileData;
    target_url?: string;
    run_id?: string;
  } | null;
  error: string | null;
}

/** Configuración del pipeline expuesta al usuario. */
export interface PipelineConfig {
  apiToken: string;
  myServiceInfo: string;
  companyTone: string;
  maxCrawlPages: number;
  skipCleaning: boolean;
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  apiToken: "",
  myServiceInfo: "Soluciones de IA para empresas",
  companyTone: "profesional y cercano",
  maxCrawlPages: 1,
  skipCleaning: true,
};

/** Template de configuración guardado por el usuario. */
export interface Template {
  id: string;
  name: string;
  myServiceInfo: string;
  companyTone: string;
}

// ─── Prospect (unidad central de la nueva arquitectura) ───────────────────────

export type ProspectStatus = "queued" | "analyzing" | "completed" | "failed";

export interface Prospect {
  id: string;           // ID estable del frontend (nunca cambia)
  runId: string | null; // run_id del backend (se asigna tras POST /process)
  url: string;
  domain: string;
  status: ProspectStatus;
  createdAt: string;
  finishedAt: string | null;
  finalEmail: string | null;
  profileData: ProfileData | null;
  error: string | null;
  currentStep: string;
  steps: Record<string, string>;
  config: {
    myServiceInfo: string;
    companyTone: string;
    maxCrawlPages: number;
    skipCleaning: boolean;
  };
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

export const PROSPECTS_STORAGE_KEY = "scraper_prospects_v2";
export const PROSPECTS_MAX = 100;
export const CONFIG_STORAGE_KEY = "scraper_config";
export const TEMPLATES_STORAGE_KEY = "scraper_templates";

// Legacy keys (kept for reference, no longer used)
export const HISTORY_STORAGE_KEY = "scraper_history";
