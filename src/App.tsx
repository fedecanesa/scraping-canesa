import { useCallback, useEffect, useRef, useState } from "react";

import { BatchView } from "@/components/BatchView";
import { HistoryView } from "@/components/HistoryView";
import { RightPanel } from "@/components/RightPanel";
import { ScraperView } from "@/components/ScraperView";
import { SendView } from "@/components/SendView";
import { Sidebar } from "@/components/Sidebar";
import { API_BASE, buildHeaders, parseApiError } from "@/lib/api";
import type {
  HistoryEntry,
  PipelineConfig,
  ProcessResult,
  ProcessStartResponse,
  ProcessStatusResponse,
} from "@/types";
import {
  DEFAULT_PIPELINE_CONFIG,
  HISTORY_MAX_ENTRIES,
  HISTORY_STORAGE_KEY,
} from "@/types";

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage quota exceeded — fail silently
  }
}

function App() {
  const [activeNav, setActiveNav] = useState("scraper");
  const [url, setUrl] = useState("");
  const [config, setConfig] = useState<PipelineConfig>(DEFAULT_PIPELINE_CONFIG);

  const [isLoading, setIsLoading] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState("starting");
  const [stepStatuses, setStepStatuses] = useState<Record<string, string>>({
    DataEngineer: "pending",
    Profiler: "pending",
    Copywriter: "pending",
  });

  const [result, setResult] = useState<ProcessResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  // SSE EventSource ref
  const eventSourceRef = useRef<EventSource | null>(null);
  // Ref to always have latest config inside SSE callback without re-creating it
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const closeSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const addHistoryEntry = useCallback((entry: HistoryEntry) => {
    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, HISTORY_MAX_ENTRIES);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const handleSSEMessage = useCallback(
    (runIdForEntry: string, targetUrl: string) => (e: MessageEvent) => {
      const data: ProcessStatusResponse = JSON.parse(e.data);

      setCurrentStep(data.current_step);
      setStepStatuses(data.steps);

      if (data.status === "completed") {
        closeSSE();
        setIsLoading(false);

        const processResult: ProcessResult = {
          final_email: data.result?.final_email || "",
          profile_data: data.result?.profile_data || null,
          target_url: targetUrl,
          run_id: runIdForEntry,
        };
        setResult(processResult);

        addHistoryEntry({
          run_id: runIdForEntry,
          target_url: targetUrl,
          created_at: data.created_at,
          finished_at: data.finished_at,
          status: "completed",
          final_email: data.result?.final_email || null,
          profile_data: data.result?.profile_data || null,
          config: {
            myServiceInfo: configRef.current.myServiceInfo,
            companyTone: configRef.current.companyTone,
            maxCrawlPages: configRef.current.maxCrawlPages,
            skipCleaning: configRef.current.skipCleaning,
          },
        });
      }

      if (data.status === "failed") {
        closeSSE();
        setIsLoading(false);
        setErrorMessage(data.error || "El pipeline falló");

        addHistoryEntry({
          run_id: runIdForEntry,
          target_url: targetUrl,
          created_at: data.created_at,
          finished_at: data.finished_at,
          status: "failed",
          final_email: null,
          profile_data: null,
          config: {
            myServiceInfo: configRef.current.myServiceInfo,
            companyTone: configRef.current.companyTone,
            maxCrawlPages: configRef.current.maxCrawlPages,
            skipCleaning: configRef.current.skipCleaning,
          },
        });
      }
    },
    [closeSSE, addHistoryEntry],
  );

  const handleSubmit = useCallback(async () => {
    if (!url.trim()) return;

    closeSSE();
    setIsLoading(true);
    setResult(null);
    setErrorMessage(null);
    setRunId(null);
    setCurrentStep("starting");
    setStepStatuses({
      DataEngineer: "pending",
      Profiler: "pending",
      Copywriter: "pending",
    });

    try {
      const response = await fetch(`${API_BASE}/process`, {
        method: "POST",
        headers: buildHeaders(config.apiToken),
        body: JSON.stringify({
          target_url: url.trim(),
          max_crawl_pages: config.maxCrawlPages,
          skip_cleaning: config.skipCleaning,
          my_service_info: config.myServiceInfo || undefined,
          company_tone: config.companyTone || undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(parseApiError(response, body));
      }

      const data: ProcessStartResponse = await response.json();
      setRunId(data.run_id);

      const es = new EventSource(`${API_BASE}/process/${data.run_id}/stream`);
      eventSourceRef.current = es;

      es.onmessage = handleSSEMessage(data.run_id, url.trim());

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;
        setIsLoading(false);
        setErrorMessage("Error de conexión con el servidor. Revisá que el backend esté activo.");
      };
    } catch (err) {
      closeSSE();
      setIsLoading(false);
      setErrorMessage(
        err instanceof Error ? err.message : "Error inesperado al ejecutar el pipeline",
      );
    }
  }, [url, config, closeSSE, handleSSEMessage]);

  const handleRelaunch = useCallback((entry: HistoryEntry) => {
    setUrl(entry.target_url);
    setConfig((prev) => ({
      ...prev,
      myServiceInfo: entry.config.myServiceInfo,
      companyTone: entry.config.companyTone,
      maxCrawlPages: entry.config.maxCrawlPages,
      skipCleaning: entry.config.skipCleaning,
    }));
    setActiveNav("scraper");
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  }, []);

  useEffect(() => {
    return () => closeSSE();
  }, [closeSSE]);

  // Batch view doesn't need the right panel (config already in panel)
  const showRightPanel = activeNav !== "conexion";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeItem={activeNav} onNavigate={setActiveNav} />

      {activeNav === "scraper" && (
        <ScraperView
          url={url}
          onUrlChange={setUrl}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          result={result}
          currentStep={currentStep}
          stepStatuses={stepStatuses}
          runId={runId}
          errorMessage={errorMessage}
        />
      )}

      {activeNav === "batch" && (
        <BatchView config={config} onSaveHistory={addHistoryEntry} />
      )}

      {activeNav === "scrapers" && (
        <HistoryView
          history={history}
          onRelaunch={handleRelaunch}
          onClearHistory={handleClearHistory}
        />
      )}

      {activeNav === "conexion" && (
        <SendView
          history={history}
          lastEmail={result?.final_email ?? null}
          lastUrl={result?.target_url ?? null}
        />
      )}

      {showRightPanel && (
        <RightPanel
          config={config}
          onChange={setConfig}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

export default App;
