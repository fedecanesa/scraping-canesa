import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Check,
  Copy,
  Globe,
  Info,
  Loader2,
  Mail,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProcessResult } from "@/types";

interface ScraperViewProps {
  url: string;
  onUrlChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  result: ProcessResult | null;
  currentStep: string;
  stepStatuses: Record<string, string>;
  runId: string | null;
  errorMessage: string | null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

function formatProfileData(profile: ProfileData): string {
  return [
    `Resumen del negocio:\n${profile.business_summary || "-"}`,
    `Puntos de dolor:\n${
      profile.pain_points?.length
        ? profile.pain_points.map((item) => `- ${item}`).join("\n")
        : "-"
    }`,
    `Tecnología:\n${
      profile.technology?.length
        ? profile.technology.map((item) => `- ${item}`).join("\n")
        : "-"
    }`,
    `Oportunidades:\n${
      profile.opportunities?.length
        ? profile.opportunities.map((item) => `- ${item}`).join("\n")
        : "-"
    }`,
    `Cliente ideal:\n${profile.ideal_customer || "-"}`,
  ].join("\n\n");
}

const STEP_STATUS_CONFIG = {
  pending:   { dot: "bg-indigo-200",  card: "bg-white/70 border-indigo-100",  text: "text-indigo-400",  label: "Esperando" },
  running:   { dot: "bg-indigo-500 animate-pulse", card: "bg-indigo-100 border-indigo-300", text: "text-indigo-700", label: "Ejecutando" },
  completed: { dot: "bg-emerald-500", card: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "Completado" },
  failed:    { dot: "bg-red-500",     card: "bg-red-50 border-red-200",        text: "text-red-700",     label: "Error" },
} as const;

function StepCard({ label, status }: { label: string; status: string }) {
  const s = STEP_STATUS_CONFIG[status as keyof typeof STEP_STATUS_CONFIG] ?? STEP_STATUS_CONFIG.pending;

  return (
    <div className={`flex-1 rounded-lg border px-3 py-2.5 transition-colors ${s.card}`}>
      <p className={`text-xs font-semibold ${s.text}`}>{label}</p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${s.dot}`} />
        <span className={`text-[11px] ${s.text}`}>{s.label}</span>
      </div>
    </div>
  );
}

export function ScraperView({
  url,
  onUrlChange,
  onSubmit,
  isLoading,
  result,
  currentStep,
  stepStatuses,
  runId,
  errorMessage,
}: ScraperViewProps) {
  const profileAsText = useMemo(() => {
    if (!result?.profile_data) return "";
    return formatProfileData(result.profile_data);
  }, [result]);

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="max-w-[780px]">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <span className="h-7 w-1 rounded-full bg-amber-500" />
          Scraper Web
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Extrae datos de cualquier sitio web, analiza el negocio y genera un
          cold email automáticamente.
        </p>

        <div className="mt-8">
          <label className="text-sm font-medium text-foreground">
            URL del Sitio Web
          </label>
          <Input
            className="mt-2"
            placeholder="Ej: https://ejemplo.com"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && url.trim() && !isLoading) onSubmit();
            }}
          />
        </div>

        <Alert className="mt-6 border-amber-300/40 bg-amber-50 text-amber-900">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertTitle className="font-semibold text-amber-800">
            Nota sobre el scraping:
          </AlertTitle>
          <AlertDescription className="text-sm text-amber-700">
            Asegurate de tener permiso para acceder al sitio web. El scraping
            debe cumplir con los términos de servicio del sitio.
          </AlertDescription>
        </Alert>

        <Button
          onClick={onSubmit}
          disabled={isLoading || !url.trim()}
          className="mt-6 w-full bg-indigo-500 py-5 text-base font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-400 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Procesando pipeline...
            </span>
          ) : (
            "Iniciar Web Scraping"
          )}
        </Button>

        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-8"
            >
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-6">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                    <Loader2
                      size={20}
                      className="animate-spin text-indigo-600"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-indigo-900">
                      Ejecutando pipeline de agentes...
                    </p>
                    <p className="mt-0.5 text-xs text-indigo-600">
                      Scraping → Análisis de negocio → Generación de email
                    </p>
                    {runId && (
                      <p className="mt-1 text-[11px] text-indigo-500">
                        Run ID: {runId}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-indigo-500">
                      Paso actual: {currentStep}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <StepCard
                    label="Data Engineer"
                    status={stepStatuses.DataEngineer || "pending"}
                  />
                  <StepCard
                    label="Profiler"
                    status={stepStatuses.Profiler || "pending"}
                  />
                  <StepCard
                    label="Copywriter"
                    status={stepStatuses.Copywriter || "pending"}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {errorMessage && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8"
            >
              <Alert className="border-red-200 bg-red-50 text-red-900">
                <Info className="h-4 w-4 text-red-600" />
                <AlertTitle className="font-semibold text-red-800">
                  El pipeline falló
                </AlertTitle>
                <AlertDescription className="text-sm text-red-700">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mt-8 space-y-5"
            >
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                  <Check size={16} className="text-emerald-600" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Pipeline completado
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Globe size={11} />
                    {result.target_url}
                    {result.run_id && (
                      <span className="ml-2 text-muted-foreground/60">
                        ID: {result.run_id}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="overflow-hidden rounded-xl border border-indigo-200 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-indigo-100 bg-indigo-50/50 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100">
                      <Mail size={14} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-indigo-900">
                        Cold Email Generado
                      </p>
                      <p className="text-[11px] text-indigo-500">
                        Agente Copywriter
                      </p>
                    </div>
                  </div>

                  <CopyButton text={result.final_email} />
                </div>

                <div className="p-5">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {result.final_email}
                  </div>
                </div>
              </motion.div>

              {result.profile_data && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/50 px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
                        <Building2 size={14} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-amber-900">
                          Perfil del Negocio
                        </p>
                        <p className="text-[11px] text-amber-500">
                          Agente Profiler — resumen, dolores, tecnología y
                          oportunidades
                        </p>
                      </div>
                    </div>

                    <CopyButton text={profileAsText} />
                  </div>

                  <div className="space-y-4 p-5 text-sm text-gray-700">
                    <div>
                      <p className="font-semibold text-amber-900">
                        Resumen del negocio
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">
                        {result.profile_data.business_summary || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-amber-900">
                        Puntos de dolor
                      </p>
                      <ul className="mt-1 list-disc pl-5">
                        {result.profile_data.pain_points?.length ? (
                          result.profile_data.pain_points.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))
                        ) : (
                          <li>-</li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <p className="font-semibold text-amber-900">Tecnología</p>
                      <ul className="mt-1 list-disc pl-5">
                        {result.profile_data.technology?.length ? (
                          result.profile_data.technology.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))
                        ) : (
                          <li>-</li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <p className="font-semibold text-amber-900">
                        Oportunidades
                      </p>
                      <ul className="mt-1 list-disc pl-5">
                        {result.profile_data.opportunities?.length ? (
                          result.profile_data.opportunities.map(
                            (item, index) => (
                              <li key={`${item}-${index}`}>{item}</li>
                            ),
                          )
                        ) : (
                          <li>-</li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <p className="font-semibold text-amber-900">
                        Cliente ideal
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">
                        {result.profile_data.ideal_customer || "-"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
