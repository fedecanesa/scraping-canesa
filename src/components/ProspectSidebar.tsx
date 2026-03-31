import { AnimatePresence, motion } from "framer-motion";
import { Layers, Plus, Search, Settings2, Trash2, X } from "lucide-react";
import { useState } from "react";

import { relativeTime } from "@/lib/storage";
import type { Prospect, ProspectStatus } from "@/types";

interface ProspectSidebarProps {
  prospects: Prospect[];
  selectedId: string | null;
  discoverOpen: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDiscover: () => void;
  onBatch: () => void;
  onConfig: () => void;
  onDelete: (id: string) => void;
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
  onDelete,
}: {
  prospect: Prospect;
  isSelected: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const score = prospect.profileData?.lead_score;
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onClick}
        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 pr-8 text-left transition-colors active:scale-[0.98] ${
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
      </button>
      {hovered && (
        <button
          onClick={onDelete}
          title="Eliminar"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-600 transition-colors hover:bg-red-500/20 hover:text-red-400"
        >
          <Trash2 size={12} />
        </button>
      )}
    </motion.div>
  );
}

function SidebarContent({
  prospects,
  selectedId,
  discoverOpen,
  onSelect,
  onNew,
  onDiscover,
  onBatch,
  onConfig,
  onDelete,
  onClose,
}: ProspectSidebarProps & { onClose?: () => void }) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <div>
          <p className="text-sm font-bold text-white">DEEPREACHER</p>
          <p className="text-[11px] text-slate-500">Inteligencia comercial con IA</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200">
            <X size={16} />
          </button>
        )}
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
                  onDelete={(e) => { e.stopPropagation(); onDelete(p.id); }}
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
          title="Importar lista de URLs para analizar en batch"
          className="flex flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
        >
          <Layers size={13} />
          Importar lista
        </button>
        <button
          onClick={onConfig}
          title="Configuración (API key, servicio, tono)"
          className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
        >
          <Settings2 size={13} />
          Config
        </button>
      </div>
    </>
  );
}

export function ProspectSidebar(props: ProspectSidebarProps) {
  const { mobileOpen, onMobileClose } = props;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-[220px] flex-shrink-0 flex-col border-r border-slate-800 bg-sidebar md:flex">
        <SidebarContent {...props} />
      </aside>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={onMobileClose}
            />
            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-800 bg-sidebar md:hidden"
            >
              <SidebarContent {...props} onClose={onMobileClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
