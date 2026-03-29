import { AnimatePresence, motion } from "framer-motion";
import { Layers, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface BatchImportDrawerProps {
  open: boolean;
  onClose: () => void;
  onImport: (urls: string[]) => void;
}

export function BatchImportDrawer({
  open,
  onClose,
  onImport,
}: BatchImportDrawerProps) {
  const [raw, setRaw] = useState("");

  const validUrls = raw
    .split("\n")
    .map((u) => u.trim())
    .filter((u) => u.startsWith("http://") || u.startsWith("https://"));

  const handleImport = () => {
    if (validUrls.length === 0) return;
    onImport(validUrls);
    setRaw("");
    onClose();
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
            className="fixed inset-0 z-40 bg-black/30"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                  <Layers size={16} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Importar URLs en lote
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Se procesarán de a una con la configuración actual
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <textarea
                autoFocus
                rows={8}
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder={
                  "https://empresa1.com\nhttps://empresa2.com\nhttps://empresa3.com"
                }
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />

              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  {validUrls.length > 0 ? (
                    <span className="font-semibold text-indigo-600">
                      {validUrls.length} URL{validUrls.length !== 1 ? "s" : ""}{" "}
                      válida{validUrls.length !== 1 ? "s" : ""} detectada
                      {validUrls.length !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    "Pegá una URL por línea, comenzando con http:// o https://"
                  )}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 border-t border-slate-100 px-6 py-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 border-slate-200 text-slate-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={validUrls.length === 0}
                className="flex-1 bg-indigo-600 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Agregar {validUrls.length > 0 ? validUrls.length : ""}{" "}
                prospecto{validUrls.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
