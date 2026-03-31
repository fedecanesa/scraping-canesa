import { Menu } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AnalyzePanel } from "@/components/AnalyzePanel";
import { AuthScreen } from "@/components/AuthScreen";
import { BatchImportDrawer } from "@/components/BatchImportDrawer";
import { ConfigDrawer } from "@/components/ConfigDrawer";
import { DiscoverPanel } from "@/components/DiscoverPanel";
import { ProspectPanel } from "@/components/ProspectPanel";
import { ProspectSidebar } from "@/components/ProspectSidebar";
import { API_BASE, buildHeaders, parseApiError } from "@/lib/api";
import { useAuth } from "@/lib/AuthProvider";
import { deleteProspect, fetchProspects, upsertProspect } from "@/lib/db";
import { extractDomain, loadConfig, saveConfig } from "@/lib/storage";
import type {
  Objective,
  PipelineConfig,
  Prospect,
  ProcessStartResponse,
  ProcessStatusResponse,
} from "@/types";

// ─── App ──────────────────────────────────────────────────────────────────────

function AppInner() {
  const { user, signOut } = useAuth();

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [config, setConfig] = useState<PipelineConfig>(loadConfig);
  const [configOpen, setConfigOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);

  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  const activeStreams = useRef<Map<string, EventSource>>(new Map());

  // ── Cargar prospects desde Supabase al login ─────────────────────────────
  useEffect(() => {
    if (!user) { setProspects([]); setDbLoading(false); return; }

    setDbLoading(true);
    fetchProspects().then((data) => {
      setProspects(data);
      if (data[0]) setSelectedId(data[0].id);
      setDbLoading(false);
    });
  }, [user]);

  // Cleanup streams on unmount
  useEffect(() => {
    return () => { activeStreams.current.forEach((es) => es.close()); };
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
      // Persistir en Supabase cuando llega a estado final
      if (user && (patch.status === "completed" || patch.status === "failed")) {
        const final = updated.find((p) => p.id === id);
        if (final) upsertProspect(final, user.id);
      }
      return updated;
    });
  }, [user]);

  // ── Core analysis logic ──────────────────────────────────────────────────
  const analyzeProspect = useCallback(
    (id: string, url: string, cfg: PipelineConfig, objective: Objective = "sell"): Promise<void> =>
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
            objective,
            user_type: cfg.userType || "other",
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
                  messageVariants: d.result?.message_variants ?? null,
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
    (url: string, objective: Objective = "sell") => {
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
        messageVariants: null,
        profileData: null,
        error: null,
        currentStep: "starting",
        steps: { DataEngineer: "pending", Profiler: "pending", Copywriter: "pending" },
        objective,
        config: {
          myServiceInfo: cfg.myServiceInfo,
          companyTone: cfg.companyTone,
          maxCrawlPages: cfg.maxCrawlPages,
          skipCleaning: cfg.skipCleaning,
          userType: cfg.userType,
        },
      };

      setProspects((prev) => [newProspect, ...prev]);
      setSelectedId(id);
      setDiscoverOpen(false);

      analyzeProspect(id, url, cfg, objective);
    },
    [analyzeProspect],
  );

  // ── Re-analyze ───────────────────────────────────────────────────────────
  const handleReanalyze = useCallback(
    (url: string, objective: Objective) => { handleAnalyze(url, objective); },
    [handleAnalyze],
  );

  // ── Batch import ─────────────────────────────────────────────────────────
  const handleBatchImport = useCallback(
    async (urls: string[], batchObjective?: Objective) => {
      const cfg = configRef.current;
      const objective: Objective = batchObjective ?? "sell";
      const newProspects: Prospect[] = urls.map((url, i) => ({
        id: `${Date.now()}-${i}`,
        runId: null,
        url,
        domain: extractDomain(url),
        status: "queued" as const,
        createdAt: new Date().toISOString(),
        finishedAt: null,
        finalEmail: null,
        messageVariants: null,
        profileData: null,
        error: null,
        currentStep: "",
        steps: {},
        objective,
        config: {
          myServiceInfo: cfg.myServiceInfo,
          companyTone: cfg.companyTone,
          maxCrawlPages: cfg.maxCrawlPages,
          skipCleaning: cfg.skipCleaning,
          userType: cfg.userType,
        },
      }));

      setProspects((prev) => [...newProspects, ...prev]);
      if (newProspects[0]) setSelectedId(newProspects[0].id);

      for (const p of newProspects) {
        await analyzeProspect(p.id, p.url, cfg, objective);
      }
    },
    [analyzeProspect],
  );

  // ── Delete prospect ──────────────────────────────────────────────────────
  const handleDelete = useCallback((id: string) => {
    const es = activeStreams.current.get(id);
    if (es) { es.close(); activeStreams.current.delete(id); }

    setProspects((prev) => prev.filter((p) => p.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
    deleteProspect(id);
  }, []);

  // ── Derived state ────────────────────────────────────────────────────────
  const selectedProspect = selectedId
    ? prospects.find((p) => p.id === selectedId) ?? null
    : null;

  const mobileTitle = discoverOpen
    ? "Descubrir"
    : selectedProspect
      ? selectedProspect.domain
      : "DeepReacher";

  if (dbLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-slate-400">Cargando tus prospectos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden md:flex-row">
      {/* Mobile top bar */}
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
        >
          <Menu size={20} />
        </button>
        <div className="flex-1 truncate">
          <p className="truncate text-sm font-bold text-slate-900">{mobileTitle}</p>
          <p className="text-[10px] text-slate-400">Inteligencia comercial con IA</p>
        </div>
        {selectedProspect?.profileData?.lead_score ? (
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            selectedProspect.profileData.lead_score >= 80 ? "bg-emerald-100 text-emerald-700" :
            selectedProspect.profileData.lead_score >= 60 ? "bg-yellow-100 text-yellow-700" :
            selectedProspect.profileData.lead_score >= 40 ? "bg-orange-100 text-orange-700" :
            "bg-red-100 text-red-700"
          }`}>
            {selectedProspect.profileData.lead_score}
          </span>
        ) : null}
      </div>

      <ProspectSidebar
        prospects={prospects}
        selectedId={selectedId}
        discoverOpen={discoverOpen}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        onSelect={(id) => { setSelectedId(id); setDiscoverOpen(false); setMobileSidebarOpen(false); }}
        onNew={() => { setSelectedId(null); setDiscoverOpen(false); setMobileSidebarOpen(false); }}
        onDiscover={() => { setDiscoverOpen(true); setSelectedId(null); setMobileSidebarOpen(false); }}
        onBatch={() => { setBatchOpen(true); setMobileSidebarOpen(false); }}
        onConfig={() => { setConfigOpen(true); setMobileSidebarOpen(false); }}
        onDelete={handleDelete}
        onSignOut={signOut}
        userEmail={user?.email ?? ""}
      />

      {discoverOpen ? (
        <DiscoverPanel
          apiToken={config.apiToken}
          onAnalyzeSelected={(urls, objective) => {
            setDiscoverOpen(false);
            handleBatchImport(urls, objective);
          }}
        />
      ) : selectedProspect ? (
        <ProspectPanel
          prospect={selectedProspect}
          onReanalyze={handleReanalyze}
        />
      ) : (
        <AnalyzePanel
          onAnalyze={handleAnalyze}
          onOpenConfig={() => setConfigOpen(true)}
          hasApiKey={!!config.apiToken}
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

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <AuthScreen />;
  return <AppInner />;
}
