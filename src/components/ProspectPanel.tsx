import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Bot,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Loader2,
  Mail,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Wrench,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MessageVariant, Objective, Opportunity, ProfileData, Prospect } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_CONFIG: Record<string, { label: string; desc: string }> = {
  DataEngineer: {
    label: "Visitando el sitio web",
    desc: "Extrayendo contenido, estructura y señales del negocio",
  },
  Profiler: {
    label: "Analizando en profundidad",
    desc: "Detectando problemas, oportunidades y calculando score",
  },
  Copywriter: {
    label: "Generando mensajes",
    desc: "Creando 3 variantes personalizadas para este prospecto",
  },
};

const PIPELINE_STEPS = ["DataEngineer", "Profiler", "Copywriter"];

type EmailClient = "gmail" | "outlook" | "native";

const OBJECTIVE_LABELS: Record<Objective, string> = {
  sell: "Vender servicio",
  partnership: "Partnership",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildMailtoUrl(client: EmailClient, to: string, subject: string, body: string): string {
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

function scoreColor(score: number) {
  if (score >= 80) return { ring: "ring-emerald-300", bg: "bg-emerald-50", text: "text-emerald-600", label: "Alto potencial", badge: "bg-emerald-100 text-emerald-700" };
  if (score >= 60) return { ring: "ring-yellow-300", bg: "bg-yellow-50", text: "text-yellow-600", label: "Potencial medio", badge: "bg-yellow-100 text-yellow-700" };
  if (score >= 40) return { ring: "ring-orange-300", bg: "bg-orange-50", text: "text-orange-600", label: "Bajo potencial", badge: "bg-orange-100 text-orange-700" };
  return { ring: "ring-red-300", bg: "bg-red-50", text: "text-red-600", label: "Potencial mínimo", badge: "bg-red-100 text-red-700" };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepRow({ stepKey, status }: { stepKey: string; status: string }) {
  const cfg = STEP_CONFIG[stepKey];
  const isRunning = status === "running";
  const isDone = status === "completed";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3.5 transition-colors ${
        isRunning ? "border-indigo-200 bg-indigo-50" : isDone ? "border-emerald-100 bg-emerald-50" : "border-slate-100 bg-slate-50"
      }`}
    >
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
          isRunning ? "bg-indigo-100" : isDone ? "bg-emerald-100" : "bg-slate-100"
        }`}
      >
        {isRunning && <Loader2 size={16} className="animate-spin text-indigo-600" />}
        {isDone && <Check size={16} className="text-emerald-600" />}
        {!isRunning && !isDone && <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />}
      </div>
      <div>
        <p className={`text-sm font-semibold ${isRunning ? "text-indigo-700" : isDone ? "text-emerald-700" : "text-slate-400"}`}>
          {cfg?.label ?? stepKey}
        </p>
        <p className={`text-[11px] ${isRunning ? "text-indigo-400" : isDone ? "text-emerald-500" : "text-slate-400"}`}>
          {cfg?.desc}
        </p>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
    >
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function BusinessCard({ profile }: { profile: ProfileData }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
          <Bot size={15} className="text-indigo-600" />
        </div>
        <p className="text-sm font-bold text-slate-900">Inteligencia del negocio</p>
      </div>

      <div className="space-y-4 text-sm text-slate-700">
        {profile.business_summary && (
          <p className="leading-relaxed text-slate-600">{profile.business_summary}</p>
        )}
        {profile.what_they_do && (
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              A qué se dedican
            </p>
            <p className="leading-relaxed">{profile.what_they_do}</p>
          </div>
        )}
        {profile.business_model && (
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Modelo de negocio
            </p>
            <p className="leading-relaxed">{profile.business_model}</p>
          </div>
        )}
        {profile.what_doing_well?.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Lo que hacen bien
            </p>
            <ul className="space-y-1">
              {profile.what_doing_well.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <Check size={13} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                  <span className="text-xs">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreCard({ score, reason }: { score: number; reason: string }) {
  const c = scoreColor(score);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
          <TrendingUp size={15} className="text-violet-600" />
        </div>
        <p className="text-sm font-bold text-slate-900">Score del lead</p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className={`flex h-20 w-20 items-center justify-center rounded-full ring-4 ${c.ring} ${c.bg}`}>
          <span className={`text-3xl font-black ${c.text}`}>{score}</span>
        </div>
        <div className="text-center">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${c.badge}`}>
            {c.label}
          </span>
          {reason && (
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{reason}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TechCard({ technology }: { technology: string[] }) {
  if (!technology?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
          <Wrench size={15} className="text-slate-500" />
        </div>
        <p className="text-sm font-bold text-slate-900">Tecnología</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {technology.map((item, i) => (
          <span
            key={i}
            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function IssuesCard({ profile }: { profile: ProfileData }) {
  const issues = profile.issues ?? [];
  const painPoints = profile.pain_points ?? [];

  const hasStructured = issues.length > 0;
  const hasFallback = !hasStructured && painPoints.length > 0;

  if (!hasStructured && !hasFallback) return null;

  return (
    <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
          <AlertCircle size={15} className="text-red-500" />
        </div>
        <p className="text-sm font-bold text-slate-900">Problemas detectados</p>
      </div>
      <div className="space-y-2.5">
        {hasStructured
          ? issues.map((issue, i) => (
              <div key={i} className="rounded-xl bg-red-50 p-3">
                <p className="text-xs font-semibold text-red-800">{issue.title}</p>
                {issue.description && (
                  <p className="mt-1 text-[11px] leading-relaxed text-red-600">{issue.description}</p>
                )}
              </div>
            ))
          : painPoints.map((p, i) => (
              <div key={i} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                <p className="text-xs text-slate-600">{p}</p>
              </div>
            ))}
      </div>
    </div>
  );
}

function OpportunityItem({ opp }: { opp: Opportunity }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-100">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-2.5">
          <Zap size={13} className="flex-shrink-0 text-indigo-400" />
          <p className="text-sm font-semibold text-slate-800">{opp.title}</p>
        </div>
        <ChevronDown
          size={15}
          className={`flex-shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-slate-100 p-4">
              {opp.explanation && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Por qué existe
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600">{opp.explanation}</p>
                </div>
              )}
              {opp.impact && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-red-400">
                    Impacto si no se resuelve
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600">{opp.impact}</p>
                </div>
              )}
              {opp.solution && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-500">
                    Solución propuesta
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600">{opp.solution}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OpportunitiesCard({ profile }: { profile: ProfileData }) {
  const opportunities = profile.opportunities ?? [];
  const fallback = profile.pain_points ?? [];

  if (!opportunities.length && !fallback.length) return null;

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
          <Sparkles size={15} className="text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">Oportunidades detectadas</p>
          <p className="text-[11px] text-slate-400">
            {opportunities.length} oportunidad{opportunities.length !== 1 ? "es" : ""} identificada
            {opportunities.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {opportunities.length > 0 ? (
        <div className="space-y-2">
          {opportunities.map((opp, i) => (
            <OpportunityItem key={i} opp={opp} />
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {fallback.map((item, i) => (
            <li key={i} className="flex gap-2">
              <Zap size={13} className="mt-0.5 flex-shrink-0 text-indigo-400" />
              <span className="text-xs text-slate-600">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MessagesCard({
  variants,
  finalEmail,
  domain,
}: {
  variants: MessageVariant[] | null;
  finalEmail: string | null;
  domain: string;
}) {
  const [activeId, setActiveId] = useState<string>("main");
  const [recipient, setRecipient] = useState("");
  const [emailClient, setEmailClient] = useState<EmailClient>("gmail");
  const [sendClicked, setSendClicked] = useState(false);

  const messages: MessageVariant[] =
    variants?.filter((v) => v.content) ??
    (finalEmail ? [{ id: "main", label: "Principal", content: finalEmail }] : []);

  if (!messages.length) return null;

  const active = messages.find((m) => m.id === activeId) ?? messages[0];

  const handleSend = () => {
    if (!recipient.trim() || !active.content) return;
    const subject = "Propuesta para " + domain;
    const url = buildMailtoUrl(emailClient, recipient.trim(), subject, active.content);
    window.open(url, "_blank", "noopener,noreferrer");
    setSendClicked(true);
    setTimeout(() => setSendClicked(false), 3000);
  };

  const CLIENT_LABELS: Record<EmailClient, string> = { gmail: "Gmail", outlook: "Outlook", native: "App" };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
            <Mail size={15} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Mensajes generados</p>
            <p className="text-[11px] text-slate-400">
              {messages.length} variante{messages.length !== 1 ? "s" : ""} para {domain}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {messages.length > 1 && (
        <div className="flex border-b border-slate-100 px-6">
          {messages.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveId(m.id)}
              className={`border-b-2 py-3 px-4 text-xs font-semibold transition-colors ${
                activeId === m.id
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Message content */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {active?.content}
          </p>
          <CopyButton text={active?.content ?? ""} />
        </div>
      </div>

      {/* Send section */}
      <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Enviar por email
        </p>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="destinatario@empresa.com"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            className="flex-1 border-slate-200 bg-white text-sm"
          />
          {(["gmail", "outlook", "native"] as EmailClient[]).map((c) => (
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
          ))}
          <Button
            onClick={handleSend}
            disabled={!recipient.trim()}
            className="gap-1.5 bg-indigo-600 text-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {sendClicked ? <Check size={15} /> : <ExternalLink size={15} />}
            {sendClicked ? "Abierto" : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ProspectPanelProps {
  prospect: Prospect;
  onReanalyze: (url: string, objective: Objective) => void;
}

export function ProspectPanel({ prospect, onReanalyze }: ProspectPanelProps) {
  const isAnalyzing = prospect.status === "analyzing" || prospect.status === "queued";
  const isFailed = prospect.status === "failed";
  const isCompleted = prospect.status === "completed";

  const profile = prospect.profileData;
  const score = profile?.lead_score ?? 0;
  const sc = scoreColor(score);

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-slate-50">
      {/* Sticky header */}
      <div className="border-b border-slate-200 bg-white px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{prospect.domain}</h1>
                {isCompleted && score > 0 && (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${sc.badge}`}>
                    {score}/100
                  </span>
                )}
                {isAnalyzing && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
                    Analizando…
                  </span>
                )}
                {isFailed && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                    Error
                  </span>
                )}
              </div>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                <span className="max-w-sm truncate">{prospect.url}</span>
                <span className="flex items-center gap-1">
                  <Target size={11} />
                  {OBJECTIVE_LABELS[prospect.objective]}
                </span>
              </p>
            </div>
          </div>

          {(isCompleted || isFailed) && (
            <button
              onClick={() => onReanalyze(prospect.url, prospect.objective)}
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
        <div className="mx-auto max-w-5xl">

          {/* ── ANALYZING STATE ──────────────────────────────────────────── */}
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-auto max-w-xl space-y-3"
            >
              <p className="mb-4 text-sm font-semibold text-slate-500">Progreso del análisis</p>
              {PIPELINE_STEPS.map((step) => (
                <StepRow key={step} stepKey={step} status={prospect.steps[step] ?? "pending"} />
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
              className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center"
            >
              <AlertCircle size={32} className="mx-auto mb-3 text-red-400" />
              <p className="text-sm font-semibold text-red-800">El análisis falló</p>
              <p className="mt-1 text-sm text-red-600">{prospect.error || "Error desconocido"}</p>
              <Button
                onClick={() => onReanalyze(prospect.url, prospect.objective)}
                variant="outline"
                className="mt-4 gap-2 border-red-200 text-red-600 hover:bg-red-100"
              >
                <RefreshCw size={14} />
                Volver a intentar
              </Button>
            </motion.div>
          )}

          {/* ── COMPLETED STATE ───────────────────────────────────────────── */}
          {isCompleted && profile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Row 1: Business intel + Score + Tech */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <BusinessCard profile={profile} />
                </div>
                <div className="flex flex-col gap-5">
                  {score > 0 && (
                    <ScoreCard score={score} reason={profile.lead_score_reason} />
                  )}
                  <TechCard technology={profile.technology} />
                </div>
              </div>

              {/* Row 2: Issues + Opportunities */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <IssuesCard profile={profile} />
                <OpportunitiesCard profile={profile} />
              </div>

              {/* Row 3: Messages (full width) */}
              <MessagesCard
                variants={prospect.messageVariants}
                finalEmail={prospect.finalEmail}
                domain={prospect.domain}
              />
            </motion.div>
          )}

          {/* Completed but no profile */}
          {isCompleted && !profile && (prospect.finalEmail || prospect.messageVariants) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <MessagesCard
                variants={prospect.messageVariants}
                finalEmail={prospect.finalEmail}
                domain={prospect.domain}
              />
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
