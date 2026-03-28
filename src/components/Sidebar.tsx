import { Bot, Layers, Send, Zap } from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { id: "scraper",  label: "Scraper Web",   icon: Zap,    enabled: true },
  { id: "batch",    label: "Batch",          icon: Layers, enabled: true },
  { id: "scrapers", label: "Historial",      icon: Bot,    enabled: true },
  { id: "conexion", label: "Envío de Email", icon: Send,   enabled: true },
];

interface SidebarProps {
  activeItem: string;
  onNavigate: (id: string) => void;
}

export function Sidebar({ activeItem, onNavigate }: SidebarProps) {
  return (
    <aside className="flex w-[190px] flex-shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="px-4 py-4">
        <p className="text-sm font-bold text-white">DATAPATH</p>
        <p className="text-xs text-slate-400">SCRAPER</p>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeItem === item.id;

          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "border border-amber-500/25 bg-amber-500/20 font-medium text-amber-300"
                  : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </motion.button>
          );
        })}
      </nav>
    </aside>
  );
}
