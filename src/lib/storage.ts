// lib/storage.ts — localStorage helpers

import type { PipelineConfig, Prospect, Template } from "@/types";
import {
  CONFIG_STORAGE_KEY,
  DEFAULT_PIPELINE_CONFIG,
  PROSPECTS_MAX,
  PROSPECTS_STORAGE_KEY,
  TEMPLATES_STORAGE_KEY,
} from "@/types";

// ─── Prospects ────────────────────────────────────────────────────────────────

export function loadProspects(): Prospect[] {
  try {
    const raw = localStorage.getItem(PROSPECTS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Prospect[]) : [];
  } catch {
    return [];
  }
}

/** Only persists completed/failed prospects — in-progress ones don't survive reload. */
export function saveProspects(prospects: Prospect[]): void {
  try {
    const toSave = prospects
      .filter((p) => p.status === "completed" || p.status === "failed")
      .slice(0, PROSPECTS_MAX);
    localStorage.setItem(PROSPECTS_STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // quota exceeded — fail silently
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

export function loadConfig(): PipelineConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    return raw
      ? { ...DEFAULT_PIPELINE_CONFIG, ...JSON.parse(raw) }
      : DEFAULT_PIPELINE_CONFIG;
  } catch {
    return DEFAULT_PIPELINE_CONFIG;
  }
}

export function saveConfig(config: PipelineConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // fail silently
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

export function loadTemplates(): Template[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Template[]) : [];
  } catch {
    return [];
  }
}

export function saveTemplates(templates: Template[]): void {
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // fail silently
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days}d`;
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
}
