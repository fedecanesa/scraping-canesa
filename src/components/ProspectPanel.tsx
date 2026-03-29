import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Prospect } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_CONFIG: Record<
  string,
  { label: string; desc: string }
> = {
  DataEngineer: {
    label: "Visitando el sitio web",
    desc: "Extrayendo contenido y estructura",
  },
  Profiler: {
    label: "Analizando el negocio",
    desc: "Identificando dolores y oportunidades",
  },
  Copywriter: {
    label: "Redactando el email",
    desc: "Personalizando el mensaje para esta empresa",
  },
};

const PIPELINE_STEPS = ["DataEngineer", "Profiler", "Copywriter"];

type EmailClient = "gmail" | "outlook" | "native";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseSubject(email: string): string {
  const line = email.split("\n").find((l) => /^asunto:/i.test(l.trim()));
  return line
    ? line.replace(/^asunto:\s*/i, "").trim()
    : "Propuesta de colaboración";
}

function parseBody(email: string): string {
  const lines = email.split("\n");
  const subjectLine = lines.find((l) => /^asunto:/i.test(l.trim()));
  return subjectLine
    ? lines.filter((l) => l !== subjectLine).join("\n").replace(/^\n+/, "")
    : email;
}

function buildMailtoUrl(
  client: EmailClient,
  to: string,
  subject: string,
  body: string,
): string {
  const s = encodeURIComponent(subject);
  const b = encodeURIComponent(body.slice(0, 1800));
  switch (client) {
    case "gmail":
      return `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(to)}&su=${s}&body=${b}`;
    case "outlook":
      return `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(to)}&subject=${s}&body=${b}`;
    default:
      return `mailto:${encodeURIComponent(to)}?subject=${s}&body=${b}`;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepRow({
  stepKey,
  status,
}: {
  stepKey: string;
  status: string;
}) {
  const cfg = STEP_CONFIG[stepKey];
  const isRunning = status === "running";
  const isDone = status === "completed";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3.5 transition-colors ${
        isRunning
          ? "border-indigo-200 bg-indigo-50"
          : isDone
            ? "border-emerald-100 bg-emerald-50"
            : "border-slate-100 bg-slate-50"
      }`}
    >
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
          isRunning
            ? "bg-indigo-100"
            : isDone
              ? "bg-emerald-100"
              : "bg-slate-100"
        }`}
      >
        {isRunning && (
          <Loader2 size={16} className="animate-spin text-indigo-600" />
        )}
        {isDone && <Check size={16} className="text-emerald-600" />}
        {!isRunning && !isDone && (
          <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        )}
      </div>
      <div>
        <p
          className={`text-sm font-semibold ${
            isRunning
              ? "text-indigo-700"
              : isDone
                ? "text-emerald-700"
                : "text-slate-400"
          }`}
        >
          {cfg?.label ?? stepKey}
        </p>
        <p
          className={`text-[11px] ${
            isRunning ? "text-indigo-400" : isDone ? "text-emerald-500" : "text-slate-400"
          }`}
        >
          {cfg?.desc}
        </p>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
    >
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

function ProfileSection({ prospect }: { prospect: Prospect }) {
  const [expanded, setExpanded] = useState(false);
  const p = prospect.profileData;
  if (!p) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
            <Building2 size={17} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Análisis del negocio
            </p>
            <p className="text-[11px] text-slate-400">
              Perfil completo de la empresa
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-5 border-t border-slate-100 px-6 py-5 text-sm text-slate-700">
              {p.business_summary && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Resumen
                  </p>
                  <p className="leading-relaxed">{p.business_summary}</p>
                </div>
              )}

              {p.pain_points?.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Puntos de dolor
                  </p>
                  <ul className="space-y-1">
                    {p.pain_points.map((item, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {p.technology?.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Tecnología
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.technology.map((item, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {p.opportunities?.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Oportunidades
                  </p>
                  <ul className="space-y-1">
                    {p.opportunities.map((item, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {p.ideal_customer && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Cliente ideal
                  </p>
                  <p className="leading-relaxed">{p.ideal_customer}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ProspectPanelProps {
  prospect: Prospect;
  onReanalyze: (url: string) => void;
}

export function ProspectPanel({ prospect, onReanalyze }: ProspectPanelProps) {
  const [emailPreview, setEmailPreview] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [emailClient, setEmailClient] = useState<EmailClient>("gmail");
  const [sendClicked, setSendClicked] = useState(false);

  const isAnalyzing =
    prospect.status === "analyzing" || prospect.status === "queued";
  const isFailed = prospect.status === "failed";
  const isCompleted = prospect.status === "completed";

  const email = prospect.finalEmail ?? "";
  const subject = email ? parseSubject(email) : "";
  const body = email ? parseBody(email) : "";

  const handleSend = () => {
    if (!recipient.trim() || !email) return;
    const url = buildMailtoUrl(emailClient, recipient.trim(), subject, body);
    window.open(url, "_blank", "noopener,noreferrer");
    setSendClicked(true);
    setTimeout(() => setSendClicked(false), 3000);
  };

  const CLIENT_LABELS: Record<EmailClient, string> = {
    gmail: "Gmail",
    outlook: "Outlook",
    native: "App",
  };

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-slate-50">
      {/* Sticky header */}
      <div className="border-b border-slate-200 bg-white px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{prospect.domain}</h1>
            <p className="mt-0.5 flex items-center gap-2 text-sm text-slate-400">
              <span className="max-w-xs truncate">{prospect.url}</span>
              {isAnalyzing && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
                  Analizando…
                </span>
              )}
              {isCompleted && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                  Completado
                </span>
              )}
              {isFailed && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                  Error
                </span>
              )}
            </p>
          </div>
          {isCompleted && (
            <button
              onClick={() => onReanalyze(prospect.url)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              <RefreshCw size={13} />
              Re-analizar
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-2xl space-y-5">

          {/* ── ANALYZING STATE ──────────────────────────────────────────── */}
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <p className="text-sm font-semibold text-slate-500">
                Progreso del análisis
              </p>
              {PIPELINE_STEPS.map((step) => (
                <StepRow
                  key={step}
                  stepKey={step}
                  status={prospect.steps[step] ?? "pending"}
                />
              ))}
              <p className="pt-2 text-center text-xs text-slate-400">
                Esto puede demorar entre 1 y 3 minutos según el sitio.
              </p>
            </motion.div>
          )}

          {/* ── FAILED STATE ─────────────────────────────────────────────── */}
          {isFailed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"
            >
              <AlertCircle size={32} className="mx-auto mb-3 text-red-400" />
              <p className="text-sm font-semibold text-red-800">
                El análisis falló
              </p>
              <p className="mt-1 text-sm text-red-600">
                {prospect.error || "Error desconocido"}
              </p>
              <Button
                onClick={() => onReanalyze(prospect.url)}
                variant="outline"
                className="mt-4 gap-2 border-red-200 text-red-600 hover:bg-red-100"
              >
                <RefreshCw size={14} />
                Volver a intentar
              </Button>
            </motion.div>
          )}

          {/* ── COMPLETED STATE ───────────────────────────────────────────── */}
          {isCompleted && email && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Email card */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Email header */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Cold email generado
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Personalizado para {prospect.domain}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEmailPreview((v) => !v)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      {emailPreview ? (
                        <>
                          <FileText size={13} />
                          Texto
                        </>
                      ) : (
                        <>
                          <Eye size={13} />
                          Vista previa
                        </>
                      )}
                    </button>
                    <CopyButton text={email} />
                  </div>
                </div>

                {/* Email body */}
                <div className="p-6">
                  {emailPreview ? (
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <div className="space-y-1.5 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs">
                        <div className="flex gap-2">
                          <span className="w-14 flex-shrink-0 font-semibold text-slate-400">
                            Asunto:
                          </span>
                          <span className="font-semibold text-slate-800">
                            {subject}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="w-14 flex-shrink-0 font-semibold text-slate-400">
                            Para:
                          </span>
                          <span className="text-slate-500">
                            contacto@{prospect.domain}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                          {body}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {email}
                    </p>
                  )}
                </div>

                {/* Send section */}
                <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Enviar email
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="destinatario@empresa.com"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSend();
                      }}
                      className="flex-1 border-slate-200 bg-white text-sm"
                    />
                    {/* Client selector */}
                    {(["gmail", "outlook", "native"] as EmailClient[]).map(
                      (c) => (
                        <button
                          key={c}
                          onClick={() => setEmailClient(c)}
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                            emailClient === c
                              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {CLIENT_LABELS[c]}
                        </button>
                      ),
                    )}
                    <Button
                      onClick={handleSend}
                      disabled={!recipient.trim()}
                      className="gap-1.5 bg-indigo-600 text-sm hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {sendClicked ? (
                        <Check size={15} />
                      ) : (
                        <ExternalLink size={15} />
                      )}
                      {sendClicked ? "Abierto" : "Enviar"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Business profile */}
              <ProfileSection prospect={prospect} />
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
