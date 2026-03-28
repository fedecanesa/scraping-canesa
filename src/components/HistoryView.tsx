import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  FileDown,
  Globe,
  Mail,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { HistoryEntry } from "@/types";

interface HistoryViewProps {
  history: HistoryEntry[];
  onRelaunch: (entry: HistoryEntry) => void;
  onClearHistory: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateUrl(url: string, maxLen = 45): string {
  return url.length > maxLen ? url.slice(0, maxLen) + "…" : url;
}

function downloadTxt(entry: HistoryEntry): void {
  const lines = [
    `URL: ${entry.target_url}`,
    `Fecha: ${formatDate(entry.created_at)}`,
    `Run ID: ${entry.run_id}`,
    `Servicio: ${entry.config.myServiceInfo}`,
    `Tono: ${entry.config.companyTone}`,
    "",
    "--- EMAIL GENERADO ---",
    "",
    entry.final_email || "(sin email)",
    "",
  ];

  if (entry.profile_data) {
    lines.push(
      "--- PERFIL DEL NEGOCIO ---",
      "",
      `Resumen: ${entry.profile_data.business_summary || "-"}`,
      "",
      `Puntos de dolor:\n${entry.profile_data.pain_points?.map((p) => `  - ${p}`).join("\n") || "  -"}`,
      "",
      `Tecnología:\n${entry.profile_data.technology?.map((t) => `  - ${t}`).join("\n") || "  -"}`,
      "",
      `Oportunidades:\n${entry.profile_data.opportunities?.map((o) => `  - ${o}`).join("\n") || "  -"}`,
      "",
      `Cliente ideal: ${entry.profile_data.ideal_customer || "-"}`,
    );
  }

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `email_${entry.run_id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAllCSV(history: HistoryEntry[]): void {
  const headers = [
    "run_id",
    "url",
    "fecha",
    "estado",
    "tono",
    "paginas",
    "servicio",
    "email",
    "resumen_negocio",
  ];

  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;

  const rows = history.map((h) => [
    h.run_id,
    h.target_url,
    formatDate(h.created_at),
    h.status,
    h.config.companyTone,
    String(h.config.maxCrawlPages),
    escape(h.config.myServiceInfo),
    escape(h.final_email || ""),
    escape(h.profile_data?.business_summary || ""),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `scraper_historial_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function HistoryCard({
  entry,
  onRelaunch,
}: {
  entry: HistoryEntry;
  onRelaunch: (entry: HistoryEntry) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isOk = entry.status === "completed";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-xl border border-border bg-white shadow-sm"
    >
      {/* Card header */}
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Status icon */}
        <div
          className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
            isOk ? "bg-emerald-100" : "bg-red-100"
          }`}
        >
          {isOk ? (
            <Check size={14} className="text-emerald-600" />
          ) : (
            <XCircle size={14} className="text-red-500" />
          )}
        </div>

        {/* URL + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Globe size={12} className="flex-shrink-0 text-muted-foreground" />
            <span
              className="truncate text-sm font-medium text-foreground"
              title={entry.target_url}
            >
              {truncateUrl(entry.target_url)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock size={10} />
              {formatDate(entry.created_at)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {entry.config.companyTone} · {entry.config.maxCrawlPages}p
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                isOk
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {isOk ? "Completado" : "Fallido"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <button
            onClick={() => onRelaunch(entry)}
            title="Relanzar con esta URL y configuración"
            className="flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1.5 text-[11px] font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
          >
            <RefreshCw size={11} />
            Relanzar
          </button>
          {isOk && (
            <button
              onClick={() => downloadTxt(entry)}
              title="Descargar email como .txt"
              className="flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-200"
            >
              <Download size={11} />
              .txt
            </button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-slate-100"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && isOk && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-border px-4 py-4">
              {/* Email */}
              {entry.final_email && (
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Mail size={12} className="text-indigo-500" />
                    <p className="text-xs font-semibold text-indigo-700">
                      Email generado
                    </p>
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-indigo-100 bg-indigo-50/40 p-3 text-xs leading-relaxed whitespace-pre-wrap text-gray-700">
                    {entry.final_email}
                  </div>
                </div>
              )}

              {/* Profile summary */}
              {entry.profile_data?.business_summary && (
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Building2 size={12} className="text-amber-500" />
                    <p className="text-xs font-semibold text-amber-700">
                      Resumen del negocio
                    </p>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-600">
                    {entry.profile_data.business_summary}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
        {expanded && !isOk && (
          <motion.div
            key="expanded-failed"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 py-3">
              <p className="text-xs text-red-600">
                Este run falló. Podés relanzarlo con la misma URL.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function HistoryView({
  history,
  onRelaunch,
  onClearHistory,
}: HistoryViewProps) {
  const completedCount = history.filter((h) => h.status === "completed").length;

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="max-w-[780px]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <span className="h-7 w-1 rounded-full bg-indigo-500" />
              Historial
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {history.length === 0
                ? "Todavía no hay runs guardados."
                : `${history.length} run${history.length !== 1 ? "s" : ""} · ${completedCount} completado${completedCount !== 1 ? "s" : ""}`}
            </p>
          </div>

          {history.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => exportAllCSV(history)}
              >
                <FileDown size={13} />
                Exportar CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={onClearHistory}
              >
                <Trash2 size={13} />
                Limpiar
              </Button>
            </div>
          )}
        </div>

        {/* Empty state */}
        {history.length === 0 && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Globe size={24} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Tus runs aparecerán acá automáticamente
            </p>
            <p className="text-xs text-muted-foreground/70">
              Guardado en tu navegador · hasta 50 entradas
            </p>
          </div>
        )}

        {/* List */}
        {history.length > 0 && (
          <div className="mt-6 space-y-3">
            <AnimatePresence>
              {history.map((entry) => (
                <HistoryCard
                  key={entry.run_id}
                  entry={entry}
                  onRelaunch={onRelaunch}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}
