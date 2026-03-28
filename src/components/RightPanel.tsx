import { BookmarkPlus, Info, Settings2, Trash2, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import type { PipelineConfig, Template } from "@/types";
import { TEMPLATES_STORAGE_KEY } from "@/types";

const TONE_OPTIONS = [
  { value: "profesional y cercano", label: "Profesional y cercano" },
  { value: "formal", label: "Formal" },
  { value: "casual y humano", label: "Casual y humano" },
  { value: "técnico y directo", label: "Técnico y directo" },
];

interface RightPanelProps {
  config: PipelineConfig;
  onChange: (config: PipelineConfig) => void;
  isLoading: boolean;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-foreground">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function loadTemplates(): Template[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Template[]) : [];
  } catch {
    return [];
  }
}

function saveTemplates(templates: Template[]): void {
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // quota exceeded — fail silently
  }
}

export function RightPanel({ config, onChange, isLoading }: RightPanelProps) {
  const [templates, setTemplates] = useState<Template[]>(loadTemplates);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  const set = <K extends keyof PipelineConfig>(key: K, value: PipelineConfig[K]) =>
    onChange({ ...config, [key]: value });

  // Keep templates in sync if another tab modifies localStorage
  useEffect(() => {
    const handle = () => setTemplates(loadTemplates());
    window.addEventListener("storage", handle);
    return () => window.removeEventListener("storage", handle);
  }, []);

  const handleSaveTemplate = () => {
    const name = newTemplateName.trim();
    if (!name) return;
    const t: Template = {
      id: Date.now().toString(),
      name,
      myServiceInfo: config.myServiceInfo,
      companyTone: config.companyTone,
    };
    const updated = [t, ...templates].slice(0, 10);
    setTemplates(updated);
    saveTemplates(updated);
    setNewTemplateName("");
    setShowSaveInput(false);
  };

  const handleLoadTemplate = (t: Template) => {
    onChange({ ...config, myServiceInfo: t.myServiceInfo, companyTone: t.companyTone });
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
  };

  return (
    <aside className="flex w-[260px] flex-shrink-0 flex-col gap-5 overflow-y-auto border-l border-border p-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings2 size={15} className="text-muted-foreground" />
        <h3 className="text-sm font-bold text-foreground">Configuración</h3>
      </div>

      {/* Servicio que vendés */}
      <Field label="Tu servicio" hint="Se usa para personalizar el cold email.">
        <textarea
          rows={3}
          disabled={isLoading}
          value={config.myServiceInfo}
          onChange={(e) => set("myServiceInfo", e.target.value)}
          placeholder="Ej: Automatización de procesos con IA para PYMEs"
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        />
      </Field>

      {/* Tono */}
      <Field label="Tono del email">
        <select
          disabled={isLoading}
          value={config.companyTone}
          onChange={(e) => set("companyTone", e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        >
          {TONE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>

      {/* Templates */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Templates</span>
          <button
            disabled={isLoading}
            onClick={() => setShowSaveInput((v) => !v)}
            className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
          >
            <BookmarkPlus size={12} />
            Guardar actual
          </button>
        </div>

        {showSaveInput && (
          <div className="flex gap-1.5">
            <input
              autoFocus
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTemplate();
                if (e.key === "Escape") setShowSaveInput(false);
              }}
              placeholder="Nombre del template"
              className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={handleSaveTemplate}
              className="rounded-md bg-indigo-500 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-600"
            >
              OK
            </button>
          </div>
        )}

        {templates.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">
            Guardá combinaciones de servicio + tono para reutilizarlas.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5"
              >
                <button
                  onClick={() => handleLoadTemplate(t)}
                  disabled={isLoading}
                  className="min-w-0 flex-1 truncate text-left text-[11px] font-medium text-foreground hover:text-indigo-600 disabled:opacity-50"
                  title={`${t.myServiceInfo} · ${t.companyTone}`}
                >
                  {t.name}
                </button>
                <button
                  onClick={() => handleDeleteTemplate(t.id)}
                  className="flex-shrink-0 text-muted-foreground hover:text-red-500"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <hr className="border-border" />

      {/* Páginas a scrapear */}
      <Field
        label="Páginas a scrapear"
        hint="Más páginas = análisis más rico, pero más lento."
      >
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            disabled={isLoading}
            value={config.maxCrawlPages}
            onChange={(e) => set("maxCrawlPages", Number(e.target.value))}
            className="flex-1 accent-indigo-500 disabled:opacity-50"
          />
          <span className="w-5 text-center text-xs font-semibold text-foreground">
            {config.maxCrawlPages}
          </span>
        </div>
      </Field>

      {/* Modo rápido */}
      <Field label="Modo rápido (skip cleaning)">
        <label className="flex cursor-pointer items-center gap-2.5">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              disabled={isLoading}
              checked={config.skipCleaning}
              onChange={(e) => set("skipCleaning", e.target.checked)}
            />
            <div
              className={`h-5 w-9 rounded-full transition-colors ${
                config.skipCleaning ? "bg-indigo-500" : "bg-slate-200"
              } ${isLoading ? "opacity-50" : ""}`}
            />
            <div
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                config.skipCleaning ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {config.skipCleaning ? "Activo — omite limpieza LLM" : "Inactivo — limpia con LLM"}
          </span>
        </label>
        <div className="mt-0.5 flex items-start gap-1 text-[11px] text-muted-foreground">
          <Info size={11} className="mt-px flex-shrink-0" />
          <span>
            Activalo para evitar timeouts. Desactivalo para mejor calidad de análisis.
          </span>
        </div>
      </Field>

      <hr className="border-border" />

      {/* API Key (opcional) */}
      <Field
        label="API Key (opcional)"
        hint="Requerida si el backend tiene API_KEY configurado."
      >
        <Input
          type="password"
          disabled={isLoading}
          placeholder="••••••••••••"
          value={config.apiToken}
          onChange={(e) => set("apiToken", e.target.value)}
        />
      </Field>

      {/* Badge modo activo */}
      <div className="mt-auto flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2">
        <Zap size={12} className="text-indigo-500" />
        <span className="text-[11px] font-medium text-indigo-700">
          {config.skipCleaning ? "Pipeline rápido activo" : "Pipeline completo activo"}
        </span>
      </div>
    </aside>
  );
}
