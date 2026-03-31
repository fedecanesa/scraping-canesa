import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Bot, Globe, Lightbulb, Mail, Settings2, Target } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Objective } from "@/types";

interface AnalyzePanelProps {
  onAnalyze: (url: string, objective: Objective) => void;
  onOpenConfig: () => void;
  hasApiKey: boolean;
}

const OBJECTIVES: { id: Objective; label: string; desc: string; icon: React.ElementType }[] = [
  { id: "sell", label: "Vender servicio", desc: "Generar reunión o respuesta", icon: Target },
  { id: "partnership", label: "Partnership", desc: "Explorar alianza o colaboración", icon: Lightbulb },
];

const HOW_IT_WORKS = [
  {
    icon: Globe,
    title: "Analizamos el negocio",
    desc: "Visitamos el sitio, extraemos contenido, estructura y señales comerciales",
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    icon: Bot,
    title: "Inteligencia profunda",
    desc: "Detectamos problemas reales, oportunidades y calculamos el score del lead",
    color: "bg-violet-100 text-violet-600",
  },
  {
    icon: Mail,
    title: "3 mensajes personalizados",
    desc: "Generamos variantes A/B hiper personalizadas listas para enviar",
    color: "bg-emerald-100 text-emerald-600",
  },
];

export function AnalyzePanel({ onAnalyze, onOpenConfig, hasApiKey }: AnalyzePanelProps) {
  const [url, setUrl] = useState("");
  const [objective, setObjective] = useState<Objective>("sell");

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const withScheme =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;
    onAnalyze(withScheme, objective);
    setUrl("");
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-slate-50 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-xl"
      >
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/25">
            <Bot size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Analizá cualquier empresa
          </h1>
          <p className="mt-3 text-base text-slate-500">
            Pegá una URL y en minutos tenés inteligencia comercial profunda y mensajes hiper personalizados.
          </p>
        </div>

        {/* Objective selector */}
        <div className="mb-5">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Objetivo del contacto
          </p>
          <div className="grid grid-cols-2 gap-2">
            {OBJECTIVES.map((obj) => (
              <button
                key={obj.id}
                onClick={() => setObjective(obj.id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                  objective === obj.id
                    ? "border-indigo-300 bg-indigo-50 ring-1 ring-indigo-300"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <obj.icon
                  size={16}
                  className={objective === obj.id ? "text-indigo-600" : "text-slate-400"}
                />
                <p
                  className={`text-xs font-semibold ${
                    objective === obj.id ? "text-indigo-700" : "text-slate-600"
                  }`}
                >
                  {obj.label}
                </p>
                <p className="text-[10px] leading-tight text-slate-400">{obj.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* API key warning */}
        {!hasApiKey && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
          >
            <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-amber-500" />
            <div className="flex-1 text-xs text-amber-700">
              <span className="font-semibold">Falta configurar la API key</span> — sin ella el análisis va a fallar.{" "}
              <button onClick={onOpenConfig} className="font-bold underline underline-offset-2 hover:text-amber-900">
                Configurar ahora
              </button>
            </div>
          </motion.div>
        )}

        {/* URL input */}
        <div className="flex gap-2">
          <Input
            className="h-12 flex-1 border-slate-200 bg-white text-base shadow-sm focus-visible:ring-indigo-500"
            placeholder="https://empresa.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
          <Button
            onClick={handleSubmit}
            disabled={!url.trim()}
            className="h-12 gap-1.5 bg-indigo-600 px-5 font-semibold shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            Analizar
            <ArrowRight size={16} />
          </Button>
        </div>

        <button
          onClick={onOpenConfig}
          className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 underline-offset-2 transition-colors hover:text-slate-600 hover:underline"
        >
          <Settings2 size={12} />
          Configurar servicio, tono y API key
        </button>

        {/* How it works */}
        <div className="mt-10">
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
            Cómo funciona
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex flex-col items-center gap-2.5 rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${step.color}`}
                >
                  <step.icon size={20} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-800">{step.title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </main>
  );
}
