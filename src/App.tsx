import { useCallback, useEffect, useRef, useState } from "react";

import { RightPanel } from "@/components/RightPanel";
import { ScraperView } from "@/components/ScraperView";
import { Sidebar } from "@/components/Sidebar";
import type {
  PipelineConfig,
  ProcessResult,
  ProcessStartResponse,
  ProcessStatusResponse,
} from "@/types";
import { DEFAULT_PIPELINE_CONFIG } from "@/types";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://scraping-canesa-scraping-canesa.1jn0jx.easypanel.host";

function buildHeaders(apiToken: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiToken.trim()) headers["X-Api-Key"] = apiToken.trim();
  return headers;
}

function parseApiError(response: Response, body: { detail?: string } | null): string {
  if (response.status === 429) {
    return "Demasiadas solicitudes. Esperá un momento antes de volver a intentar.";
  }
  if (response.status === 401) {
    return "API key inválida o requerida. Revisá la configuración.";
  }
  return body?.detail || `Error del servidor (${response.status})`;
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

  const pollingRef = useRef<number | null>(null);
  // Ref para que fetchRunStatus siempre tenga la última apiToken sin re-crear el closure
  const apiTokenRef = useRef(config.apiToken);
  useEffect(() => {
    apiTokenRef.current = config.apiToken;
  }, [config.apiToken]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current !== null) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const fetchRunStatus = useCallback(
    async (id: string) => {
      const headers: Record<string, string> = {};
      if (apiTokenRef.current.trim()) headers["X-Api-Key"] = apiTokenRef.current.trim();

      const response = await fetch(`${API_BASE}/process/${id}`, { headers });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(parseApiError(response, body));
      }

      const data: ProcessStatusResponse = await response.json();

      setCurrentStep(data.current_step);
      setStepStatuses(data.steps);

      if (data.status === "completed") {
        stopPolling();
        setIsLoading(false);
        setResult({
          final_email: data.result?.final_email || "",
          profile_data: data.result?.profile_data || null,
          target_url: data.target_url,
          run_id: data.run_id,
        });
      }

      if (data.status === "failed") {
        stopPolling();
        setIsLoading(false);
        setErrorMessage(data.error || "El pipeline falló");
      }
    },
    [stopPolling],
  );

  const handleSubmit = useCallback(async () => {
    if (!url.trim()) return;

    stopPolling();
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

      // Iniciar interval ANTES del primer fetch para evitar race condition:
      // si el pipeline termina antes de que se configure el interval, stopPolling()
      // ya tiene un ref válido para limpiar.
      pollingRef.current = window.setInterval(() => {
        fetchRunStatus(data.run_id).catch((err) => {
          stopPolling();
          setIsLoading(false);
          setErrorMessage(
            err instanceof Error ? err.message : "Error consultando el estado",
          );
        });
      }, 2000);

      // Primera consulta inmediata
      fetchRunStatus(data.run_id).catch((err) => {
        stopPolling();
        setIsLoading(false);
        setErrorMessage(
          err instanceof Error ? err.message : "Error consultando el estado",
        );
      });
    } catch (err) {
      stopPolling();
      setIsLoading(false);
      setErrorMessage(
        err instanceof Error ? err.message : "Error inesperado al ejecutar el pipeline",
      );
    }
  }, [url, config, stopPolling, fetchRunStatus]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeItem={activeNav} onNavigate={setActiveNav} />

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

      <RightPanel
        config={config}
        onChange={setConfig}
        isLoading={isLoading}
      />
    </div>
  );
}

export default App;
