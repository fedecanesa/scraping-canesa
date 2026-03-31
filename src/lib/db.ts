// lib/db.ts — Supabase DB operations para prospects

import { supabase } from "@/lib/supabase";
import type { Prospect } from "@/types";

// ─── Mapeo DB → Prospect ──────────────────────────────────────────────────────

function rowToProspect(row: Record<string, unknown>): Prospect {
  return {
    id: row.id as string,
    runId: (row.run_id as string | null) ?? null,
    url: row.url as string,
    domain: row.domain as string,
    status: row.status as Prospect["status"],
    objective: (row.objective as Prospect["objective"]) ?? "sell",
    createdAt: row.created_at as string,
    finishedAt: (row.finished_at as string | null) ?? null,
    profileData: (row.profile_data as Prospect["profileData"]) ?? null,
    messageVariants: (row.message_variants as Prospect["messageVariants"]) ?? null,
    finalEmail: (row.final_email as string | null) ?? null,
    error: (row.error as string | null) ?? null,
    currentStep: (row.current_step as string) ?? "",
    steps: (row.steps as Record<string, string>) ?? {},
    config: (row.config as Prospect["config"]) ?? {
      myServiceInfo: "",
      companyTone: "",
      maxCrawlPages: 1,
      skipCleaning: true,
      userType: "other",
    },
  };
}

// ─── Mapeo Prospect → DB row ──────────────────────────────────────────────────

function prospectToRow(p: Prospect, userId: string) {
  return {
    id: p.id,
    user_id: userId,
    run_id: p.runId,
    url: p.url,
    domain: p.domain,
    status: p.status,
    objective: p.objective,
    created_at: p.createdAt,
    finished_at: p.finishedAt,
    profile_data: p.profileData,
    message_variants: p.messageVariants,
    final_email: p.finalEmail,
    error: p.error,
    current_step: p.currentStep,
    steps: p.steps,
    config: p.config,
  };
}

// ─── API ──────────────────────────────────────────────────────────────────────

export async function fetchProspects(): Promise<Prospect[]> {
  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[db] fetchProspects error:", error.message);
    return [];
  }
  return (data ?? []).map(rowToProspect);
}

export async function upsertProspect(prospect: Prospect, userId: string): Promise<void> {
  const { error } = await supabase
    .from("prospects")
    .upsert(prospectToRow(prospect, userId), { onConflict: "id" });

  if (error) {
    console.error("[db] upsertProspect error:", error.message);
  }
}

export async function deleteProspect(id: string): Promise<void> {
  const { error } = await supabase
    .from("prospects")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[db] deleteProspect error:", error.message);
  }
}
