import { useEffect, useRef, useState } from "react";

import { RightPanel } from "@/components/RightPanel";
import { ScraperView } from "@/components/ScraperView";
import { Sidebar } from "@/components/Sidebar";

const API_BASE =
  "https://scraping-canesa-scraping-canesa.1jn0jx.easypanel.host";

type StepStatus = "pending" | "running" | "completed";

interface ProfileData {
  business_summary: string;
  pain_points: string[];
  technology: string[];
  opportunities: string[];
  ideal_customer: string;
}

interface ProcessStartResponse {
  run_id: string;
  status: "started";
}

interface ProcessStatusResponse {
  run_id: string;
  target_url: string;
  status: "running" | "completed" | "failed";
  current_step: string;
  steps: Record<string, StepStatus | string>;
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

interface ProcessResult {
  final_email: string;
  profile_data: ProfileData | null;
  target_url: string;
  run_id: string | null;
}

function App() {
  const [activeNav, setActiveNav] = useState("scraper");
  const [url, setUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [headers, setHeaders] = useState("");

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

  const stopPolling = () => {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const fetchRunStatus = async (id: string) => {
    const response = await fetch(`${API_BASE}/process/${id}`);

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(
        error?.detail || "No se pudo consultar el estado del proceso",
      );
    }

    const data: ProcessStatusResponse = await response.json();

    setCurrentStep(data.current_step);
    setStepStatuses(data.steps);

    if (data.status === "completed") {
      stopPolling();
      setIsLoading(false);

      const finalResult: ProcessResult = {
        final_email: data.result?.final_email || "",
        profile_data: data.result?.profile_data || null,
        target_url: data.target_url,
        run_id: data.run_id,
      };

      setResult(finalResult);
    }

    if (data.status === "failed") {
      stopPolling();
      setIsLoading(false);
      setErrorMessage(data.error || "El pipeline falló");
    }
  };

  const handleSubmit = async () => {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_url: url,
          skip_cleaning: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.detail || "Error al iniciar el pipeline");
      }

      const data: ProcessStartResponse = await response.json();
      setRunId(data.run_id);

      await fetchRunStatus(data.run_id);

      pollingRef.current = window.setInterval(() => {
        fetchRunStatus(data.run_id).catch((err) => {
          stopPolling();
          setIsLoading(false);
          setErrorMessage(
            err instanceof Error ? err.message : "Error consultando el estado",
          );
        });
      }, 2000);
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Error inesperado al ejecutar el pipeline",
      );
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

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
        apiToken={apiToken}
        onApiTokenChange={setApiToken}
        headers={headers}
        onHeadersChange={setHeaders}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}

export default App;
