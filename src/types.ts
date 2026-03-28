// types.ts — Tipos compartidos para el contrato API ↔ Frontend

export type StepStatus = "pending" | "running" | "completed" | "failed";

export interface ProfileData {
  business_summary: string;
  pain_points: string[];
  technology: string[];
  opportunities: string[];
  ideal_customer: string;
}

export interface ProcessResult {
  final_email: string;
  profile_data: ProfileData | null;
  target_url: string;
  run_id: string | null;
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

/** Configuración del pipeline expuesta al usuario desde el RightPanel. */
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

/** Una entrada del historial de runs guardada en localStorage. */
export interface HistoryEntry {
  run_id: string;
  target_url: string;
  created_at: string;
  finished_at: string | null;
  status: "completed" | "failed";
  final_email: string | null;
  profile_data: ProfileData | null;
  config: {
    myServiceInfo: string;
    companyTone: string;
    maxCrawlPages: number;
    skipCleaning: boolean;
  };
}

export const HISTORY_STORAGE_KEY = "scraper_history";
export const HISTORY_MAX_ENTRIES = 50;
