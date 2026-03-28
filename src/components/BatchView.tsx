import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Play,
  Square,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { API_BASE, buildHeaders } from "@/lib/api";
import type {
  HistoryEntry,
  PipelineConfig,
  ProcessStartResponse,
  ProcessStatusResponse,
} from "@/types";
import { HISTORY_MAX_ENTRIES } from "@/types";

interface BatchViewProps {
  config: PipelineConfig;
  onSaveHistory: (entry: HistoryEntry) => void;
}

type JobStatus = "queued" | "running" | "completed" | "failed";

interface BatchJob {
  id: string; // temp id before run_id is known
  url: string;
  status: JobStatus;
  run_id: string | null;
  currentStep: string;
  steps: Record<string, string>;
  final_email: string | null;
  error: string | null;
  expanded: boolean;
}

function StatusBadge({ status }: { status: JobStatus }) {
  const map = {
    queued:    "bg-slate-100 text-slate-500",
    running:   "bg-indigo-100 text-indigo-700",
    completed: "bg-emerald-100 text-emerald-700",
    failed:    "bg-red-100 text-red-600",
  };
  const labels = { queued: "En cola", running: "Ejecutando", completed: "Completado", failed: "Fallido" };
  return (
    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

export function BatchView({ config, onSaveHistory }: BatchViewProps) {
  const [urlInput, setUrlInput] = useState("");
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const abortRef = useRef(false);
  const esRef = useRef<EventSource | null>(null);
  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  const updateJob = useCallback((id: string, patch: Partial<BatchJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  const processOne = useCallback(
    (job: BatchJob): Promise<void> =>
      new Promise((resolve) => {
        if (abortRef.current) {
          updateJob(job.id, { status: "failed", error: "Cancelado" });
          return resolve();
        }

        updateJob(job.id, { status: "running", currentStep: "starting" });
        const cfg = configRef.current;

        fetch(`${API_BASE}/process`, {
          method: "POST",
          headers: buildHeaders(cfg.apiToken),
          body: JSON.stringify({
            target_url: job.url,
            max_crawl_pages: cfg.maxCrawlPages,
            skip_cleaning: cfg.skipCleaning,
            my_service_info: cfg.myServiceInfo || undefined,
            company_tone: cfg.companyTone || undefined,
          }),
        })
          .then(async (res) => {
            if (!res.ok) {
              const body = await res.json().catch(() => null);
              throw new Error(body?.detail || `Error ${res.status}`);
            }
            return res.json() as Promise<ProcessStartResponse>;
          })
          .then((data) => {
            updateJob(job.id, { run_id: data.run_id });

            const es = new EventSource(`${API_BASE}/process/${data.run_id}/stream`);
            esRef.current = es;

            es.onmessage = (e) => {
              const d: ProcessStatusResponse = JSON.parse(e.data);
              updateJob(job.id, { currentStep: d.current_step, steps: d.steps });

              if (d.status === "completed") {
                es.close();
                const email = d.result?.final_email || null;
                updateJob(job.id, {
                  status: "completed",
                  final_email: email,
                });

                const entry: HistoryEntry = {
                  run_id: data.run_id,
                  target_url: job.url,
                  created_at: d.created_at,
                  finished_at: d.finished_at,
                  status: "completed",
                  final_email: email,
                  profile_data: d.result?.profile_data || null,
                  config: {
                    myServiceInfo: cfg.myServiceInfo,
                    companyTone: cfg.companyTone,
                    maxCrawlPages: cfg.maxCrawlPages,
                    skipCleaning: cfg.skipCleaning,
                  },
                };
                onSaveHistory(entry);
                resolve();
              }

              if (d.status === "failed") {
                es.close();
                updateJob(job.id, { status: "failed", error: d.error || "El pipeline falló" });
                resolve();
              }
            };

            es.onerror = () => {
              es.close();
              updateJob(job.id, { status: "failed", error: "Error de conexión SSE" });
              resolve();
            };
          })
          .catch((err) => {
            updateJob(job.id, {
              status: "failed",
              error: err instanceof Error ? err.message : "Error inesperado",
            });
            resolve();
          });
      }),
    [updateJob, onSaveHistory],
  );

  const handleStart = useCallback(async () => {
    const urls = urlInput
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http://") || u.startsWith("https://"));

    if (urls.length === 0) return;

    abortRef.current = false;
    setIsRunning(true);

    const newJobs: BatchJob[] = urls.map((url) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      url,
      status: "queued",
      run_id: null,
      currentStep: "",
      steps: {},
      final_email: null,
      error: null,
      expanded: false,
    }));
    setJobs(newJobs);

    for (const job of newJobs) {
      if (abortRef.current) break;
      await processOne(job);
    }

    setIsRunning(false);
    esRef.current = null;
  }, [urlInput, processOne]);

  const handleStop = useCallback(() => {
    abortRef.current = true;
    esRef.current?.close();
    esRef.current = null;
    setIsRunning(false);
    setJobs((prev) =>
      prev.map((j) =>
        j.status === "queued" || j.status === "running"
          ? { ...j, status: "failed", error: "Cancelado" }
          : j,
      ),
    );
  }, []);

  useEffect(() => () => { esRef.current?.close(); }, []);

  const completedCount = jobs.filter((j) => j.status === "completed").length;
  const failedCount = jobs.filter((j) => j.status === "failed").length;

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="max-w-[780px]">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <span className="h-7 w-1 rounded-full bg-violet-500" />
          Batch Processing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pegá varias URLs (una por línea) y procesalas en cola automáticamente.
        </p>

        <div className="mt-8 space-y-5">
          {/* URL input */}
          <div>
            <label className="text-sm font-medium text-foreground">
              URLs a procesar
            </label>
            <textarea
              rows={6}
              disabled={isRunning}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={"https://empresa1.com\nhttps://empresa2.com\nhttps://empresa3.com"}
              className="mt-2 w-full resize-none rounded-xl border border-input bg-white px-4 py-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              {urlInput.split("\n").filter((u) => u.trim().startsWith("http")).length} URL
              {urlInput.split("\n").filter((u) => u.trim().startsWith("http")).length !== 1 ? "s" : ""} válidas detectadas · se procesarán de a una con la configuración actual
            </p>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {!isRunning ? (
              <Button
                onClick={handleStart}
                disabled={
                  !urlInput
                    .split("\n")
                    .some((u) => u.trim().startsWith("http"))
                }
                className="gap-2 bg-violet-500 px-6 py-5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 hover:bg-violet-400 disabled:opacity-50"
              >
                <Play size={16} />
                Iniciar batch
              </Button>
            ) : (
              <Button
                onClick={handleStop}
                variant="outline"
                className="gap-2 border-red-200 px-6 py-5 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <Square size={14} />
                Detener
              </Button>
            )}
          </div>

          {/* Progress summary */}
          {jobs.length > 0 && (
            <div className="flex items-center gap-4 rounded-xl border border-border bg-white px-5 py-3 text-sm">
              <span className="text-muted-foreground">
                Total: <strong>{jobs.length}</strong>
              </span>
              <span className="text-emerald-600">
                Completados: <strong>{completedCount}</strong>
              </span>
              <span className="text-red-500">
                Fallidos: <strong>{failedCount}</strong>
              </span>
              {isRunning && (
                <span className="ml-auto flex items-center gap-1.5 text-indigo-600">
                  <Loader2 size={14} className="animate-spin" />
                  Procesando…
                </span>
              )}
            </div>
          )}

          {/* Job cards */}
          <AnimatePresence initial={false}>
            {jobs.map((job, idx) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="overflow-hidden rounded-xl border border-border bg-white shadow-sm"
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Status icon */}
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
                    {job.status === "running" && (
                      <Loader2 size={14} className="animate-spin text-indigo-500" />
                    )}
                    {job.status === "completed" && (
                      <Check size={14} className="text-emerald-600" />
                    )}
                    {job.status === "failed" && (
                      <XCircle size={14} className="text-red-500" />
                    )}
                    {job.status === "queued" && (
                      <span className="text-[11px] font-bold text-slate-400">{idx + 1}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-medium text-foreground"
                      title={job.url}
                    >
                      {job.url}
                    </p>
                    {job.status === "running" && job.currentStep && (
                      <p className="text-[11px] text-indigo-500">
                        Paso: {job.currentStep}
                      </p>
                    )}
                    {job.status === "failed" && job.error && (
                      <p className="text-[11px] text-red-500">{job.error}</p>
                    )}
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2">
                    <StatusBadge status={job.status} />
                    {job.status === "completed" && (
                      <button
                        onClick={() => updateJob(job.id, { expanded: !job.expanded })}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-slate-100"
                      >
                        {job.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded email preview */}
                <AnimatePresence initial={false}>
                  {job.expanded && job.final_email && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border px-4 py-4">
                        <div className="max-h-40 overflow-y-auto rounded-lg border border-indigo-100 bg-indigo-50/40 p-3 text-xs leading-relaxed whitespace-pre-wrap text-gray-700">
                          {job.final_email}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
