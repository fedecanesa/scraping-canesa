import { motion } from "framer-motion";
import { ArrowRight, Bot, Globe, Mail } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AnalyzePanelProps {
  onAnalyze: (url: string) => void;
  onOpenConfig: () => void;
}

const HOW_IT_WORKS = [
  {
    icon: Globe,
    title: "Visitamos el sitio",
    desc: "Extraemos contenido, estructura y señales del negocio",
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    icon: Bot,
    title: "Analizamos la empresa",
    desc: "Identificamos dolores, tecnología y oportunidades",
    color: "bg-violet-100 text-violet-600",
  },
  {
    icon: Mail,
    title: "Redactamos el email",
    desc: "Generamos un cold email personalizado listo para enviar",
    color: "bg-emerald-100 text-emerald-600",
  },
];

export function AnalyzePanel({ onAnalyze, onOpenConfig }: AnalyzePanelProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const withScheme =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;
    onAnalyze(withScheme);
    setUrl("");
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-slate-50 p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-lg"
      >
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/25">
            <Globe size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Analizá cualquier empresa
          </h1>
          <p className="mt-3 text-base text-slate-500">
            Pegá la URL de un sitio web y en minutos tenés un cold email personalizado listo para enviar.
          </p>
        </div>

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
          className="mt-3 text-xs text-slate-400 underline-offset-2 transition-colors hover:text-slate-600 hover:underline"
        >
          Configuración avanzada (servicio, tono, páginas)
        </button>

        {/* How it works */}
        <div className="mt-12">
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
            Cómo funciona
          </p>
          <div className="grid grid-cols-3 gap-4">
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
