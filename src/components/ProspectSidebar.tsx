import { AnimatePresence, motion } from "framer-motion";
import { Layers, Plus, Search, Settings2 } from "lucide-react";

import { relativeTime } from "@/lib/storage";
import type { Prospect, ProspectStatus } from "@/types";

interface ProspectSidebarProps {
  prospects: Prospect[];
  selectedId: string | null;
  discoverOpen: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDiscover: () => void;
  onBatch: () => void;
  onConfig: () => void;
}

function StatusDot({ status }: { status: ProspectStatus }) {
  if (status === "analyzing" || status === "queued") {
    return (
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
      </span>
    );
  }
  if (status === "completed") {
    return <span className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />;
  }
  return <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-400" />;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-500/20 text-emerald-400"
      : score >= 60
        ? "bg-yellow-500/20 text-yellow-400"
        : score >= 40
          ? "bg-orange-500/20 text-orange-400"
          : "bg-red-500/20 text-red-400";

  return (
    <span className={`flex-shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${color}`}>
      {score}
    </span>
  );
}

function ProspectItem({
  prospect,
  isSelected,
  onClick,
}: {
  prospect: Prospect;
  isSelected: boolean;
  onClick: () => void;
}) {
  const score = prospect.profileData?.lead_score;

  return (
    <motion.button
      layout
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors ${
        isSelected
          ? "bg-white/10 ring-1 ring-white/10"
          : "hover:bg-white/5"
      }`}
    >
      <StatusDot status={prospect.status} />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm ${
            isSelected ? "font-semibold text-white" : "font-medium text-slate-300"
          }`}
        >
          {prospect.domain}
        </p>
        <p className="text-[11px] text-slate-500">{relativeTime(prospect.createdAt)}</p>
      </div>
      {score !== undefined && score > 0 && prospect.status === "completed" && (
        <ScoreBadge score={score} />
      )}
    </motion.button>
  );
}

export function ProspectSidebar({
  prospects,
  selectedId,
  discoverOpen,
  onSelect,
  onNew,
  onDiscover,
  onBatch,
  onConfig,
}: ProspectSidebarProps) {
  return (
    <aside className="flex w-[220px] flex-shrink-0 flex-col border-r border-slate-800 bg-sidebar">
      {/* Logo */}
      <div className="px-4 pb-3 pt-4">
        <p className="text-sm font-bold text-white">DEEPREACHER</p>
        <p className="text-[11px] text-slate-500">Inteligencia comercial con IA</p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-1.5 px-3 pb-3">
        <button
          onClick={onNew}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            !discoverOpen
              ? "bg-indigo-600 text-white hover:bg-indigo-500"
              : "border border-slate-700 text-slate-300 hover:bg-white/5"
          }`}
        >
          <Plus size={15} />
          Nuevo análisis
        </button>
        <button
          onClick={onDiscover}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            discoverOpen
              ? "bg-indigo-600 text-white hover:bg-indigo-500"
              : "border border-slate-700 text-slate-300 hover:bg-white/5"
          }`}
        >
          <Search size={15} />
          Descubrir
        </button>
      </div>

      {/* Prospect list */}
      <div className="flex-1 overflow-y-auto px-2">
        {prospects.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-slate-600">
            Tus análisis aparecerán acá
          </p>
        ) : (
          <div className="space-y-0.5 pb-2">
            <AnimatePresence initial={false}>
              {prospects.map((p) => (
                <ProspectItem
                  key={p.id}
                  prospect={p}
                  isSelected={p.id === selectedId}
                  onClick={() => onSelect(p.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="flex items-center gap-1 border-t border-slate-800 px-3 py-3">
        <button
          onClick={onBatch}
          className="flex flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
        >
          <Layers size={13} />
          Importar URLs
        </button>
        <button
          onClick={onConfig}
          title="Configuración"
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
        >
          <Settings2 size={15} />
        </button>
      </div>
    </aside>
  );
}
