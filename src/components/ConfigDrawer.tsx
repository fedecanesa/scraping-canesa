import { AnimatePresence, motion } from "framer-motion";
import { BookmarkPlus, Info, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { loadTemplates, saveTemplates } from "@/lib/storage";
import type { PipelineConfig, Template } from "@/types";

const TONE_OPTIONS = [
  { value: "profesional y cercano", label: "Profesional y cercano" },
  { value: "formal", label: "Formal" },
  { value: "casual y humano", label: "Casual y humano" },
  { value: "técnico y directo", label: "Técnico y directo" },
];

interface ConfigDrawerProps {
  open: boolean;
  onClose: () => void;
  config: PipelineConfig;
  onChange: (config: PipelineConfig) => void;
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
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

export function ConfigDrawer({
  open,
  onClose,
  config,
  onChange,
}: ConfigDrawerProps) {
  const [templates, setTemplates] = useState<Template[]>(loadTemplates);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");

  const set = <K extends keyof PipelineConfig>(key: K, value: PipelineConfig[K]) =>
    onChange({ ...config, [key]: value });

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
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20"
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed bottom-0 right-0 top-0 z-50 flex w-80 flex-col overflow-y-auto border-l border-slate-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <p className="text-sm font-bold text-slate-900">Configuración</p>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-5 p-5">
              {/* My service */}
              <Field
                label="Tu servicio"
                hint="Se usa para personalizar el cold email."
              >
                <textarea
                  rows={3}
                  value={config.myServiceInfo}
                  onChange={(e) => set("myServiceInfo", e.target.value)}
                  placeholder="Ej: Automatización de procesos con IA para PYMEs"
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </Field>

              {/* Tone */}
              <Field label="Tono del email">
                <select
                  value={config.companyTone}
                  onChange={(e) => set("companyTone", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
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
                  <span className="text-xs font-semibold text-slate-700">
                    Templates guardados
                  </span>
                  <button
                    onClick={() => setShowSaveInput((v) => !v)}
                    className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
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
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <button
                      onClick={handleSaveTemplate}
                      className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-500"
                    >
                      OK
                    </button>
                  </div>
                )}

                {templates.length === 0 ? (
                  <p className="text-[11px] text-slate-400">
                    Guardá combinaciones de servicio + tono para reutilizarlas rápidamente.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {templates.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2"
                      >
                        <button
                          onClick={() => handleLoadTemplate(t)}
                          className="min-w-0 flex-1 truncate text-left text-xs font-medium text-slate-700 hover:text-indigo-600"
                          title={`${t.myServiceInfo} · ${t.companyTone}`}
                        >
                          {t.name}
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(t.id)}
                          className="flex-shrink-0 text-slate-300 hover:text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <hr className="border-slate-100" />

              {/* Pages */}
              <Field
                label="Páginas a scrapear"
                hint="Más páginas = análisis más rico, pero más lento."
              >
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={config.maxCrawlPages}
                    onChange={(e) => set("maxCrawlPages", Number(e.target.value))}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="w-5 text-center text-sm font-bold text-slate-700">
                    {config.maxCrawlPages}
                  </span>
                </div>
              </Field>

              {/* Skip cleaning toggle */}
              <Field label="Modo rápido">
                <label className="flex cursor-pointer items-center gap-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={config.skipCleaning}
                      onChange={(e) => set("skipCleaning", e.target.checked)}
                    />
                    <div
                      className={`h-5 w-9 rounded-full transition-colors ${
                        config.skipCleaning ? "bg-indigo-600" : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        config.skipCleaning ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                  <span className="text-xs text-slate-500">
                    {config.skipCleaning
                      ? "Activo — omite limpieza LLM"
                      : "Inactivo — limpia con LLM"}
                  </span>
                </label>
                <div className="flex items-start gap-1 text-[11px] text-slate-400">
                  <Info size={11} className="mt-px flex-shrink-0" />
                  <span>
                    Activalo para evitar timeouts. Desactivalo para mejor calidad.
                  </span>
                </div>
              </Field>

              <hr className="border-slate-100" />

              {/* API Key */}
              <Field
                label="API Key (opcional)"
                hint="Requerida si el backend tiene API_KEY configurado."
              >
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={config.apiToken}
                  onChange={(e) => set("apiToken", e.target.value)}
                  className="border-slate-200 bg-slate-50 text-sm"
                />
              </Field>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
