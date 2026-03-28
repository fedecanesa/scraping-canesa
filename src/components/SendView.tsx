import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  ExternalLink,
  Mail,
  Send,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { HistoryEntry } from "@/types";

interface SendViewProps {
  history: HistoryEntry[];
  lastEmail: string | null;
  lastUrl: string | null;
}

type EmailClient = "gmail" | "outlook" | "native";

const CLIENT_OPTIONS: { value: EmailClient; label: string; icon: string }[] = [
  { value: "gmail", label: "Gmail (web)", icon: "G" },
  { value: "outlook", label: "Outlook (web)", icon: "O" },
  { value: "native", label: "App de email", icon: "✉" },
];

function parseSubject(email: string): string {
  const line = email.split("\n").find((l) => /^asunto:/i.test(l.trim()));
  return line ? line.replace(/^asunto:\s*/i, "").trim() : "Propuesta de colaboración";
}

function parseBody(email: string): string {
  const lines = email.split("\n");
  const subjectLine = lines.find((l) => /^asunto:/i.test(l.trim()));
  return subjectLine
    ? lines.filter((l) => l !== subjectLine).join("\n").replace(/^\n+/, "")
    : email;
}

function buildMailtoUrl(client: EmailClient, to: string, subject: string, body: string): string {
  const s = encodeURIComponent(subject);
  const b = encodeURIComponent(body.slice(0, 1800)); // keep URL under limits

  switch (client) {
    case "gmail":
      return `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(to)}&su=${s}&body=${b}`;
    case "outlook":
      return `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(to)}&subject=${s}&body=${b}`;
    case "native":
    default:
      return `mailto:${encodeURIComponent(to)}?subject=${s}&body=${b}`;
  }
}

export function SendView({ history, lastEmail, lastUrl }: SendViewProps) {
  const completedHistory = history.filter((h) => h.status === "completed" && h.final_email);

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [recipient, setRecipient] = useState("");
  const [client, setClient] = useState<EmailClient>("gmail");
  const [sent, setSent] = useState(false);

  // Resolve the email to send
  const activeEmail = selectedRunId
    ? (completedHistory.find((h) => h.run_id === selectedRunId)?.final_email ?? null)
    : lastEmail;

  const activeUrl = selectedRunId
    ? (completedHistory.find((h) => h.run_id === selectedRunId)?.target_url ?? null)
    : lastUrl;

  const subject = activeEmail ? parseSubject(activeEmail) : "";
  const body = activeEmail ? parseBody(activeEmail) : "";
  const canSend = !!activeEmail && !!recipient.trim();

  const handleSend = () => {
    if (!canSend) return;
    const url = buildMailtoUrl(client, recipient.trim(), subject, body);
    window.open(url, "_blank", "noopener,noreferrer");
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="max-w-[700px]">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <span className="h-7 w-1 rounded-full bg-emerald-500" />
          Envío de Conexión
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Abrí tu cliente de email con el cold email pre-cargado, listo para enviar.
        </p>

        <div className="mt-8 space-y-5">
          {/* Email source selector */}
          <div>
            <label className="text-sm font-medium text-foreground">
              Email a enviar
            </label>
            <div className="mt-2 overflow-hidden rounded-xl border border-border bg-white">
              {/* Last generated (quick pick) */}
              {lastEmail && (
                <button
                  onClick={() => setSelectedRunId(null)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                    selectedRunId === null ? "bg-indigo-50" : ""
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                      selectedRunId === null
                        ? "border-indigo-500 bg-indigo-500"
                        : "border-border"
                    }`}
                  >
                    {selectedRunId === null && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      Último generado
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {activeUrl && selectedRunId === null ? activeUrl : lastUrl}
                    </p>
                  </div>
                </button>
              )}

              {/* History entries */}
              {completedHistory.length > 0 && (
                <div className="border-t border-border">
                  <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Del historial
                  </p>
                  <div className="max-h-48 overflow-y-auto">
                    {completedHistory.map((h) => (
                      <button
                        key={h.run_id}
                        onClick={() => setSelectedRunId(h.run_id)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50 ${
                          selectedRunId === h.run_id ? "bg-indigo-50" : ""
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                            selectedRunId === h.run_id
                              ? "border-indigo-500 bg-indigo-500"
                              : "border-border"
                          }`}
                        >
                          {selectedRunId === h.run_id && (
                            <div className="h-2 w-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-foreground">
                            {h.target_url}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(h.created_at).toLocaleDateString("es-AR")}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!lastEmail && completedHistory.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Todavía no hay emails generados. Corré el scraper primero.
                </div>
              )}
            </div>
          </div>

          {/* Preview of selected email */}
          <AnimatePresence>
            {activeEmail && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <label className="text-sm font-medium text-foreground">
                  Vista previa
                </label>
                <div className="mt-2 overflow-hidden rounded-xl border border-border bg-white">
                  <div className="space-y-1.5 border-b border-border bg-slate-50 px-4 py-3">
                    <div className="flex gap-2 text-xs">
                      <span className="w-14 flex-shrink-0 font-semibold text-muted-foreground">Asunto:</span>
                      <span className="font-semibold text-foreground">{subject || "(sin asunto)"}</span>
                    </div>
                    {activeUrl && (
                      <div className="flex gap-2 text-xs">
                        <span className="w-14 flex-shrink-0 font-semibold text-muted-foreground">Origen:</span>
                        <span className="text-muted-foreground truncate">{activeUrl}</span>
                      </div>
                    )}
                  </div>
                  <div className="max-h-40 overflow-y-auto p-4">
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-gray-700">
                      {body}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recipient */}
          <div>
            <label className="text-sm font-medium text-foreground">
              Email del destinatario
            </label>
            <Input
              className="mt-2"
              type="email"
              placeholder="contacto@empresa.com"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSend) handleSend();
              }}
            />
          </div>

          {/* Client selector */}
          <div>
            <label className="text-sm font-medium text-foreground">
              Cliente de email
            </label>
            <div className="mt-2 flex gap-2">
              {CLIENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setClient(opt.value)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-medium transition-colors ${
                    client === opt.value
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-border bg-white text-muted-foreground hover:bg-slate-50"
                  }`}
                >
                  <span className="text-base leading-none">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className="w-full gap-2 bg-emerald-500 py-5 text-base font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50"
          >
            {sent ? (
              <><Check size={18} /> Abierto en tu cliente de email</>
            ) : (
              <><ExternalLink size={18} /> Abrir en {CLIENT_OPTIONS.find((c) => c.value === client)?.label}</>
            )}
          </Button>

          {client !== "native" && (
            <p className="text-center text-[11px] text-muted-foreground">
              Se abrirá una nueva pestaña con el email pre-cargado. Revisalo antes de enviar.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
