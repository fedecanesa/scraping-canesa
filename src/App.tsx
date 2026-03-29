import { useCallback, useEffect, useRef, useState } from "react";

import { AnalyzePanel } from "@/components/AnalyzePanel";
import { BatchImportDrawer } from "@/components/BatchImportDrawer";
import { ConfigDrawer } from "@/components/ConfigDrawer";
import { ProspectPanel } from "@/components/ProspectPanel";
import { ProspectSidebar } from "@/components/ProspectSidebar";
import { API_BASE, buildHeaders, parseApiError } from "@/lib/api";
import { extractDomain, loadConfig, loadProspects, saveConfig, saveProspects } from "@/lib/storage";
import type {
  PipelineConfig,
  Prospect,
  ProcessStartResponse,
  ProcessStatusResponse,
} from "@/types";

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [prospects, setProspects] = useState<Prospect[]>(loadProspects);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => loadProspects()[0]?.id ?? null,
  );
  const [config, setConfig] = useState<PipelineConfig>(loadConfig);
  const [configOpen, setConfigOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);

  // Keep a ref to config so SSE callbacks always have the current value
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Active SSE connections keyed by prospect id
  const activeStreams = useRef<Map<string, EventSource>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeStreams.current.forEach((es) => es.close());
    };
  }, []);

  // ── Config persistence ───────────────────────────────────────────────────

  const handleConfigChange = useCallback((newConfig: PipelineConfig) => {
    setConfig(newConfig);
    saveConfig(newConfig);
  }, []);

  // ── Prospect mutations ───────────────────────────────────────────────────

  const updateProspect = useCallback((id: string, patch: Partial<Prospect>) => {
    setProspects((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
      if (patch.status === "completed" || patch.status === "failed") {
        saveProspects(updated);
      }
      return updated;
    });
  }, []);

  // ── Core analysis logic (shared by single + batch) ──────────────────────

  const analyzeProspect = useCallback(
    (id: string, url: string, cfg: PipelineConfig): Promise<void> =>
      new Promise((resolve) => {
        updateProspect(id, { status: "analyzing", currentStep: "starting" });

        fetch(`${API_BASE}/process`, {
          method: "POST",
          headers: buildHeaders(cfg.apiToken),
          body: JSON.stringify({
            target_url: url,
            max_crawl_pages: cfg.maxCrawlPages,
            skip_cleaning: cfg.skipCleaning,
            my_service_info: cfg.myServiceInfo || undefined,
            company_tone: cfg.companyTone || undefined,
          }),
        })
          .then(async (res) => {
            if (!res.ok) {
              const body = await res.json().catch(() => null);
              throw new Error(parseApiError(res, body));
            }
            return res.json() as Promise<ProcessStartResponse>;
          })
          .then((data) => {
            updateProspect(id, { runId: data.run_id });

            const es = new EventSource(`${API_BASE}/process/${data.run_id}/stream`);
            activeStreams.current.set(id, es);

            es.onmessage = (e) => {
              const d: ProcessStatusResponse = JSON.parse(e.data);
              updateProspect(id, {
                currentStep: d.current_step,
                steps: d.steps as Record<string, string>,
              });

              if (d.status === "completed") {
                es.close();
                activeStreams.current.delete(id);
                updateProspect(id, {
                  status: "completed",
                  finishedAt: d.finished_at,
                  finalEmail: d.result?.final_email ?? null,
                  profileData: d.result?.profile_data ?? null,
                });
                resolve();
              }

              if (d.status === "failed") {
                es.close();
                activeStreams.current.delete(id);
                updateProspect(id, {
                  status: "failed",
                  finishedAt: d.finished_at,
                  error: d.error ?? "El pipeline falló",
                });
                resolve();
              }
            };

            es.onerror = () => {
              es.close();
              activeStreams.current.delete(id);
              updateProspect(id, {
                status: "failed",
                error: "Error de conexión con el servidor",
              });
              resolve();
            };
          })
          .catch((err) => {
            updateProspect(id, {
              status: "failed",
              error: err instanceof Error ? err.message : "Error inesperado",
            });
            resolve();
          });
      }),
    [updateProspect],
  );

  // ── Single analysis ──────────────────────────────────────────────────────

  const handleAnalyze = useCallback(
    (url: string) => {
      const id = Date.now().toString();
      const cfg = configRef.current;
      const newProspect: Prospect = {
        id,
        runId: null,
        url,
        domain: extractDomain(url),
        status: "analyzing",
        createdAt: new Date().toISOString(),
        finishedAt: null,
        finalEmail: null,
        profileData: null,
        error: null,
        currentStep: "starting",
        steps: { DataEngineer: "pending", Profiler: "pending", Copywriter: "pending" },
        config: {
          myServiceInfo: cfg.myServiceInfo,
          companyTone: cfg.companyTone,
          maxCrawlPages: cfg.maxCrawlPages,
          skipCleaning: cfg.skipCleaning,
        },
      };

      setProspects((prev) => {
        const updated = [newProspect, ...prev];
        return updated;
      });
      setSelectedId(id);

      analyzeProspect(id, url, cfg);
    },
    [analyzeProspect],
  );

  // ── Re-analyze (from ProspectPanel) ─────────────────────────────────────

  const handleReanalyze = useCallback(
    (url: string) => {
      handleAnalyze(url);
    },
    [handleAnalyze],
  );

  // ── Batch import ─────────────────────────────────────────────────────────

  const handleBatchImport = useCallback(
    async (urls: string[]) => {
      const cfg = configRef.current;
      const newProspects: Prospect[] = urls.map((url, i) => ({
        id: `${Date.now()}-${i}`,
        runId: null,
        url,
        domain: extractDomain(url),
        status: "queued" as const,
        createdAt: new Date().toISOString(),
        finishedAt: null,
        finalEmail: null,
        profileData: null,
        error: null,
        currentStep: "",
        steps: {},
        config: {
          myServiceInfo: cfg.myServiceInfo,
          companyTone: cfg.companyTone,
          maxCrawlPages: cfg.maxCrawlPages,
          skipCleaning: cfg.skipCleaning,
        },
      }));

      setProspects((prev) => [...newProspects, ...prev]);
      if (newProspects[0]) setSelectedId(newProspects[0].id);

      // Process sequentially
      for (const p of newProspects) {
        await analyzeProspect(p.id, p.url, cfg);
      }
    },
    [analyzeProspect],
  );

  // ── Derived state ────────────────────────────────────────────────────────

  const selectedProspect = selectedId
    ? prospects.find((p) => p.id === selectedId) ?? null
    : null;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden">
      <ProspectSidebar
        prospects={prospects}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onNew={() => setSelectedId(null)}
        onBatch={() => setBatchOpen(true)}
        onConfig={() => setConfigOpen(true)}
      />

      {selectedProspect ? (
        <ProspectPanel
          prospect={selectedProspect}
          onReanalyze={handleReanalyze}
        />
      ) : (
        <AnalyzePanel
          onAnalyze={handleAnalyze}
          onOpenConfig={() => setConfigOpen(true)}
        />
      )}

      <ConfigDrawer
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        config={config}
        onChange={handleConfigChange}
      />

      <BatchImportDrawer
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        onImport={handleBatchImport}
      />
    </div>
  );
}

export default App;
