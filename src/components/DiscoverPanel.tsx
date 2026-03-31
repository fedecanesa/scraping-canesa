import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CheckSquare,
  ExternalLink,
  Handshake,
  Loader2,
  MapPin,
  Search,
  Square,
  Star,
  Target,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchBusinesses } from "@/lib/api";
import type { Objective, PlaceResult } from "@/types";

interface DiscoverPanelProps {
  apiToken: string;
  onAnalyzeSelected: (urls: string[], objective: Objective) => void;
}

const CATEGORY_SUGGESTIONS: Record<Objective, string[]> = {
  sell: [
    "Agencias de marketing digital",
    "Agencias de desarrollo web",
    "Estudios de diseño gráfico",
    "Empresas de e-commerce",
    "Clínicas dentales",
    "Estudios jurídicos",
    "Gimnasios y centros fitness",
    "Inmobiliarias",
  ],
  partnership: [
    "Agencias de marketing digital",
    "Agencias de desarrollo web",
    "Consultoras de negocios",
    "Estudios de diseño gráfico",
    "Agencias de branding",
    "Productoras de contenido",
    "Consultoras de tecnología",
    "Estudios de UX/UI",
  ],
};

const OBJECTIVE_OPTIONS: { id: Objective; label: string; desc: string; icon: React.ElementType }[] = [
  { id: "sell", label: "Vender servicio", desc: "Detecta brechas y señales de compra", icon: Target },
  { id: "partnership", label: "Partnership", desc: "Evalúa complementariedad y fit de alianza", icon: Handshake },
];

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1">
      <Star size={11} className="fill-yellow-400 text-yellow-400" />
      <span className="text-[11px] font-semibold text-slate-600">{rating.toFixed(1)}</span>
    </span>
  );
}

function PlaceCard({
  place,
  selected,
  onToggle,
}: {
  place: PlaceResult;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
        selected
          ? "border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
      onClick={onToggle}
    >
      {/* Checkbox */}
      <div className="mt-0.5 flex-shrink-0">
        {selected ? (
          <CheckSquare size={18} className="text-indigo-600" />
        ) : (
          <Square size={18} className="text-slate-300" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">{place.name}</p>
          {place.rating && <RatingStars rating={place.rating} />}
        </div>

        {place.address && (
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
            <MapPin size={10} className="flex-shrink-0" />
            <span className="truncate">{place.address}</span>
          </p>
        )}

        {place.website && (
          <a
            href={place.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-1.5 flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-700 hover:underline"
          >
            <ExternalLink size={10} />
            <span className="truncate">{place.website.replace(/^https?:\/\/(www\.)?/, "")}</span>
          </a>
        )}

        {place.rating_count && (
          <p className="mt-0.5 text-[10px] text-slate-400">
            {place.rating_count.toLocaleString("es-AR")} reseñas
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function DiscoverPanel({ apiToken, onAnalyzeSelected }: DiscoverPanelProps) {
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PlaceResult[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [objective, setObjective] = useState<Objective>("sell");

  const handleSearch = async () => {
    const cat = category.trim();
    const cit = city.trim();
    if (!cat || !cit) return;

    setLoading(true);
    setError(null);
    setResults(null);
    setSelected(new Set());

    try {
      const data = await searchBusinesses(cat, cit, apiToken);
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al buscar");
    } finally {
      setLoading(false);
    }
  };

  const toggleAll = () => {
    if (!results) return;
    const withWebsite = results.filter((r) => r.website);
    if (selected.size === withWebsite.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(withWebsite.map((r) => r.place_id)));
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAnalyze = () => {
    if (!results) return;
    const urls = results
      .filter((r) => selected.has(r.place_id) && r.website)
      .map((r) => r.website as string);
    if (!urls.length) return;
    onAnalyzeSelected(urls, objective);
  };

  const withWebsite = results?.filter((r) => r.website) ?? [];
  const allSelected = withWebsite.length > 0 && selected.size === withWebsite.length;

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-8 md:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
              <Search size={17} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Descubrir prospects</h1>
              <p className="text-xs text-slate-400">
                Buscá empresas por categoría y ciudad, seleccioná y analizá en un click
              </p>
            </div>
          </div>
          {/* Objective selector en header */}
          <div className="flex gap-2">
            {OBJECTIVE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => { setObjective(opt.id); setResults(null); setSelected(new Set()); }}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                  objective === opt.id
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                }`}
              >
                <opt.icon size={13} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {/* Objetivo activo desc */}
        <p className={`mt-3 rounded-lg px-3 py-2 text-xs ${objective === "sell" ? "bg-indigo-50 text-indigo-600" : "bg-violet-50 text-violet-600"}`}>
          {OBJECTIVE_OPTIONS.find(o => o.id === objective)?.desc} — las sugerencias y el análisis se adaptan a este objetivo
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">
        <div className="mx-auto max-w-2xl space-y-6">

          {/* Search form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Categoría</label>
                <Input
                  placeholder="Agencias de marketing"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                  className="border-slate-200 bg-slate-50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Ciudad</label>
                <Input
                  placeholder="Buenos Aires"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                  className="border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            <Button
              onClick={handleSearch}
              disabled={!category.trim() || !city.trim() || loading}
              className="mt-3 w-full gap-2 bg-indigo-600 font-semibold hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Buscando...</>
              ) : (
                <><Search size={15} /> Buscar empresas</>
              )}
            </Button>

            {/* Suggestions */}
            {!results && !loading && (
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Sugerencias para {objective === "sell" ? "venta" : "partnership"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_SUGGESTIONS[objective].map((s) => (
                    <button
                      key={s}
                      onClick={() => setCategory(s)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Results */}
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Results header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {withWebsite.length} empresas con sitio web
                    </p>
                    {results.length > withWebsite.length && (
                      <p className="text-[11px] text-slate-400">
                        ({results.length - withWebsite.length} sin website ignoradas)
                      </p>
                    )}
                  </div>
                  {withWebsite.length > 0 && (
                    <button
                      onClick={toggleAll}
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      {allSelected ? (
                        <><CheckSquare size={14} /> Deseleccionar todo</>
                      ) : (
                        <><Square size={14} /> Seleccionar todo</>
                      )}
                    </button>
                  )}
                </div>

                {/* Place cards */}
                {withWebsite.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                    <Building2 size={28} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm text-slate-500">
                      No se encontraron empresas con sitio web para esta búsqueda.
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Intentá con otra categoría o ciudad.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {withWebsite.map((place) => (
                      <PlaceCard
                        key={place.place_id}
                        place={place}
                        selected={selected.has(place.place_id)}
                        onToggle={() => toggle(place.place_id)}
                      />
                    ))}
                  </div>
                )}

                {/* Analyze CTA */}
                {selected.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sticky bottom-0 rounded-2xl border border-indigo-200 bg-white p-4 shadow-lg"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {selected.size} empresa{selected.size !== 1 ? "s" : ""} listas para analizar
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                          {objective === "sell"
                            ? <><Target size={11} className="text-indigo-400" /> Modo venta — detectará brechas y señales de compra</>
                            : <><Handshake size={11} className="text-violet-400" /> Modo partnership — evaluará complementariedad y fit</>
                          }
                        </p>
                      </div>
                      <Button
                        onClick={handleAnalyze}
                        className="gap-2 bg-indigo-600 font-semibold hover:bg-indigo-500"
                      >
                        <Zap size={15} />
                        Analizar {selected.size}
                        <ArrowRight size={14} />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
