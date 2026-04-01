import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Bot,
  Check,
  ChevronDown,
  Copy,
  Edit3,
  ExternalLink,
  Handshake,
  HelpCircle,
  Info,
  Loader2,
  Mail,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Wrench,
  X,
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
  ReviewsAgent: {
    label: "Leyendo reseñas de Google",
    desc: "Analizando qué dicen los clientes reales sobre este negocio",
  },
  JobsAgent: {
    label: "Detectando señales de contratación",
    desc: "Identificando qué roles buscan y qué revela eso sobre sus prioridades",
  },
  Profiler: {
    label: "Analizando en profundidad",
    desc: "Sintetizando web + reseñas + empleos para detectar oportunidades",
  },
  Copywriter: {
    label: "Generando mensajes",
    desc: "Creando 3 variantes personalizadas para este prospecto",
  },
};

const PIPELINE_STEPS = ["DataEngineer", "ReviewsAgent", "JobsAgent", "Profiler", "Copywriter"];

type EmailClient = "gmail" | "outlook" | "native";

const OBJECTIVE_LABELS: Record<Objective, string> = {
  sell: "Vender servicio",
  partnership: "Partnership",
};

const OBJECTIVE_ICONS: Record<Objective, React.ElementType> = {
  sell: Target,
  partnership: Handshake,
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
  if (score >= 80) return { ring: "ring-emerald-300", bg: "bg-emerald-50", text: "text-emerald-600", label: "Alto potencial", badge: "bg-emerald-100 text-emerald-700", action: "Contactar esta semana — señales claras de compra", actionColor: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (score >= 60) return { ring: "ring-yellow-300", bg: "bg-yellow-50", text: "text-yellow-600", label: "Potencial medio", badge: "bg-yellow-100 text-yellow-700", action: "Incluir en outreach activo — vale la pena el intento", actionColor: "text-yellow-700 bg-yellow-50 border-yellow-200" };
  if (score >= 40) return { ring: "ring-orange-300", bg: "bg-orange-50", text: "text-orange-600", label: "Bajo potencial", badge: "bg-orange-100 text-orange-700", action: "Explorar más antes de contactar — dolor no evidente aún", actionColor: "text-orange-700 bg-orange-50 border-orange-200" };
  return { ring: "ring-red-300", bg: "bg-red-50", text: "text-red-600", label: "Potencial mínimo", badge: "bg-red-100 text-red-700", action: "Baja prioridad — no invertir tiempo ahora", actionColor: "text-red-700 bg-red-50 border-red-200" };
}

function Tooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible((v) => !v)}
        className="text-slate-300 hover:text-slate-400"
      >
        <HelpCircle size={12} />
      </button>
      {visible && (
        <span className="absolute left-5 top-0 z-50 w-56 rounded-lg border border-slate-200 bg-white p-2.5 text-[11px] leading-relaxed text-slate-600 shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepRow({ stepKey, status }: { stepKey: string; status: string }) {
  const cfg = STEP_CONFIG[stepKey];
  const isRunning = status === "running";
  const isDone = status === "completed";
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-3.5 transition-colors ${isRunning ? "border-indigo-200 bg-indigo-50" : isDone ? "border-emerald-100 bg-emerald-50" : "border-slate-100 bg-slate-50"}`}>
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${isRunning ? "bg-indigo-100" : isDone ? "bg-emerald-100" : "bg-slate-100"}`}>
        {isRunning && <Loader2 size={16} className="animate-spin text-indigo-600" />}
        {isDone && <Check size={16} className="text-emerald-600" />}
        {!isRunning && !isDone && <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />}
      </div>
      <div>
        <p className={`text-sm font-semibold ${isRunning ? "text-indigo-700" : isDone ? "text-emerald-700" : "text-slate-400"}`}>{cfg?.label ?? stepKey}</p>
        <p className={`text-[11px] ${isRunning ? "text-indigo-400" : isDone ? "text-emerald-500" : "text-slate-400"}`}>{cfg?.desc}</p>
      </div>
    </div>
  );
}

function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(getText());
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

// ─── Analysis Cards ───────────────────────────────────────────────────────────

function BusinessCard({ profile, objective }: { profile: ProfileData; objective: Objective }) {
  const isSell = objective === "sell";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
          <Bot size={15} className="text-indigo-600" />
        </div>
        <p className="text-sm font-bold text-slate-900">Inteligencia del negocio</p>
      </div>
      <p className="mb-4 text-[11px] leading-relaxed text-slate-400">
        {isSell
          ? "Entendé a quién le estás hablando antes de contactarlos — más contexto = mejor mensaje."
          : "Conocé en profundidad al potencial socio: qué hace, cómo genera dinero y qué los hace fuertes."}
      </p>
      <div className="space-y-4 text-sm text-slate-700">
        {profile.business_summary && (
          <p className="leading-relaxed text-slate-600">{profile.business_summary}</p>
        )}
        {profile.what_they_do && (
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">A qué se dedican</p>
            <p className="leading-relaxed">{profile.what_they_do}</p>
          </div>
        )}
        {profile.business_model && (
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Cómo generan dinero</p>
            <p className="leading-relaxed">{profile.business_model}</p>
          </div>
        )}
        {profile.ideal_customer && (
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">A quién le venden</p>
            <p className="leading-relaxed text-xs">{profile.ideal_customer}</p>
          </div>
        )}
        {profile.what_doing_well?.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {isSell ? "Lo que hacen bien" : "Sus fortalezas — base de la alianza"}
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
        {isSell && profile.buying_signals?.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-400">Señales de compra</p>
              <Tooltip text="Indicadores detectados en su web, reseñas y búsquedas de empleo que sugieren que este negocio podría estar listo para comprar ahora." />
            </div>
            <ul className="space-y-1">
              {profile.buying_signals.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <Zap size={12} className="mt-0.5 flex-shrink-0 text-indigo-400" />
                  <span className="text-xs">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {profile.top_review_quote && (
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-500">Reseña destacada</p>
              <Tooltip text="La reseña más reveladora de sus clientes. Podés usarla como icebreaker o para referenciar un problema real en tu mensaje." />
            </div>
            <blockquote className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs italic leading-relaxed text-amber-800">
              "{profile.top_review_quote}"
            </blockquote>
          </div>
        )}
      </div>
    </div>
  );
}

const SCORE_ZONES = [
  { min: 0, max: 40, label: "Mín", color: "bg-red-300" },
  { min: 40, max: 60, label: "Bajo", color: "bg-orange-300" },
  { min: 60, max: 80, label: "Medio", color: "bg-yellow-300" },
  { min: 80, max: 100, label: "Alto", color: "bg-emerald-400" },
];

function ScoreCard({ score, reason, objective }: { score: number; reason: string; objective: Objective }) {
  const c = scoreColor(score);
  const isSell = objective === "sell";
  const label = isSell ? "Score de venta" : "Score de alianza";
  const description = isSell
    ? "Mide la probabilidad de que este prospecto esté listo para comprar tu servicio ahora."
    : "Mide qué tan complementario es este negocio para una alianza estratégica contigo.";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
          <TrendingUp size={15} className="text-violet-600" />
        </div>
        <p className="text-sm font-bold text-slate-900">{label}</p>
      </div>
      <p className="mb-4 text-[11px] leading-relaxed text-slate-400">{description}</p>

      <div className="flex flex-col items-center gap-3">
        <div className={`flex h-20 w-20 items-center justify-center rounded-full ring-4 ${c.ring} ${c.bg}`}>
          <span className={`text-3xl font-black ${c.text}`}>{score}</span>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${c.badge}`}>{c.label}</span>
      </div>

      {/* Scale bar */}
      <div className="mt-4">
        <div className="flex h-2 overflow-hidden rounded-full">
          {SCORE_ZONES.map((z) => (
            <div key={z.label} className={`flex-1 ${z.color} opacity-50`} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[9px] font-semibold text-slate-400">
          {SCORE_ZONES.map((z) => <span key={z.label}>{z.label}</span>)}
        </div>
        {/* Indicator */}
        <div className="relative mt-0.5 h-2">
          <div
            className={`absolute h-2 w-2 -translate-x-1/2 rounded-full ring-2 ring-white ${c.bg.replace("bg-", "bg-").replace("50", "500")}`}
            style={{ left: `${Math.min(score, 99)}%` }}
          />
        </div>
      </div>

      {/* Action recommendation */}
      {c.action && (
        <div className={`mt-4 rounded-lg border px-3 py-2 text-[11px] font-medium leading-relaxed ${c.actionColor}`}>
          <span className="font-bold">Recomendación: </span>{c.action}
        </div>
      )}

      {/* Reason */}
      {reason && (
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          <span className="font-semibold text-slate-500">Por qué este score: </span>{reason}
        </p>
      )}
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
          <span key={i} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">{item}</span>
        ))}
      </div>
    </div>
  );
}

function IssuesCard({ profile, objective }: { profile: ProfileData; objective: Objective }) {
  const issues = profile.issues ?? [];
  const fallback = profile.pain_points ?? [];
  const isSell = objective === "sell";

  if (!issues.length && !fallback.length) return null;

  return (
    <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
          <AlertCircle size={15} className="text-red-500" />
        </div>
        <p className="text-sm font-bold text-slate-900">
          {isSell ? "Problemas detectados" : "Brechas del potencial socio"}
        </p>
      </div>
      <p className="mb-4 text-[11px] leading-relaxed text-slate-400">
        {isSell
          ? "Puntos de dolor reales detectados en su web. Cada uno es una puerta de entrada para tu pitch."
          : "Áreas donde este negocio tiene limitaciones que vos podrías complementar con tu servicio."}
      </p>
      <div className="space-y-2.5">
        {issues.length > 0
          ? issues.map((issue, i) => (
              <div key={i} className="rounded-xl bg-red-50 p-3">
                <p className="text-xs font-semibold text-red-800">{issue.title}</p>
                {issue.description && <p className="mt-1 text-[11px] leading-relaxed text-red-600">{issue.description}</p>}
              </div>
            ))
          : fallback.map((p, i) => (
              <div key={i} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                <p className="text-xs text-slate-600">{p}</p>
              </div>
            ))}
      </div>
    </div>
  );
}

function OpportunityItem({ opp, objective }: { opp: Opportunity; objective: Objective }) {
  const [open, setOpen] = useState(false);
  const isPartnership = objective === "partnership";
  return (
    <div className="overflow-hidden rounded-xl border border-slate-100">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-slate-50">
        <div className="flex items-center gap-2.5">
          {isPartnership
            ? <Handshake size={13} className="flex-shrink-0 text-violet-400" />
            : <Zap size={13} className="flex-shrink-0 text-indigo-400" />}
          <p className="text-sm font-semibold text-slate-800">{opp.title}</p>
        </div>
        <ChevronDown size={15} className={`flex-shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            <div className="space-y-3 border-t border-slate-100 p-4">
              {opp.explanation && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {isPartnership ? "Por qué tiene sentido" : "Por qué existe"}
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600">{opp.explanation}</p>
                </div>
              )}
              {opp.impact && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-500">
                    {isPartnership ? "Qué gana cada parte" : "Impacto si no se resuelve"}
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600">{opp.impact}</p>
                </div>
              )}
              {opp.solution && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-500">
                    {isPartnership ? "Formato de alianza" : "Solución propuesta"}
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

function OpportunitiesCard({ profile, objective }: { profile: ProfileData; objective: Objective }) {
  const opportunities = profile.opportunities ?? [];
  const isPartnership = objective === "partnership";
  if (!opportunities.length) return null;
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${isPartnership ? "border-violet-100" : "border-indigo-100"}`}>
      <div className="mb-1 flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isPartnership ? "bg-violet-100" : "bg-indigo-100"}`}>
          {isPartnership
            ? <Handshake size={15} className="text-violet-600" />
            : <Sparkles size={15} className="text-indigo-600" />}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">
            {isPartnership ? "Alianzas posibles" : "Oportunidades detectadas"}
          </p>
          <p className="text-[11px] text-slate-400">
            {opportunities.length} {isPartnership ? "tipo" : "oportunidad"}{opportunities.length !== 1 ? "s" : ""} identificada{opportunities.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <p className="mb-4 text-[11px] leading-relaxed text-slate-400">
        {isPartnership
          ? "Formatos de colaboración concretos detectados según sus fortalezas y las tuyas. Hacé click para ver el detalle."
          : "Brechas concretas donde podés generar valor. Hacé click en cada una para ver el impacto y la solución sugerida."}
      </p>
      <div className="space-y-2">
        {opportunities.map((opp, i) => (
          <OpportunityItem key={i} opp={opp} objective={objective} />
        ))}
      </div>
    </div>
  );
}

// ─── Analysis Guide ───────────────────────────────────────────────────────────

const GUIDE_STEPS_SELL = [
  { icon: Bot, title: "Entendé el negocio", desc: "Leé quiénes son, cómo ganan dinero y a quién le venden. Esto es lo que mencionarás en tu apertura." },
  { icon: TrendingUp, title: "Revisá el score", desc: "Un score >70 significa que vale invertir tiempo ahora. <50 es baja prioridad." },
  { icon: AlertCircle, title: "Usá los problemas como icebreaker", desc: "Cada problema detectado es una puerta de entrada. Mencioná uno específico en tu primer mensaje." },
  { icon: Sparkles, title: "Profundizá las oportunidades", desc: "Expandí cada una para ver el impacto real y la solución concreta que podés ofrecer." },
  { icon: Mail, title: "Enviá el mensaje ya personalizado", desc: "El mensaje ya incorpora todo el análisis. Editalo si querés ajustar algo y envialo directamente." },
];

const GUIDE_STEPS_PARTNERSHIP = [
  { icon: Bot, title: "Entendé al potencial socio", desc: "Sus fortalezas son la base de la alianza. Su modelo de negocio define qué tipo de colaboración tiene sentido." },
  { icon: TrendingUp, title: "Revisá el score de alianza", desc: "Mide complementariedad, no urgencia de compra. >70 significa que hay fit real para colaborar." },
  { icon: AlertCircle, title: "Identificá las brechas", desc: "Son las áreas donde ellos tienen limitaciones que vos podés complementar — el argumento central de la alianza." },
  { icon: Handshake, title: "Explorá los formatos de alianza", desc: "Referidos, white-label, co-ejecución — cada oportunidad ya viene con un formato concreto sugerido." },
  { icon: Mail, title: "Proponé la alianza con el mensaje generado", desc: "El tono es de par a par, no de vendedor. Editalo para que suene a tu voz y envialo." },
];

function AnalysisGuide({ objective }: { objective: Objective }) {
  const [open, setOpen] = useState(false);
  const steps = objective === "sell" ? GUIDE_STEPS_SELL : GUIDE_STEPS_PARTNERSHIP;
  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-2">
          <Info size={14} className="text-indigo-500" />
          <span className="text-xs font-semibold text-indigo-700">¿Cómo leer este análisis?</span>
        </div>
        <ChevronDown size={14} className={`text-indigo-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3 border-t border-indigo-100 px-5 py-4 sm:grid-cols-3 lg:grid-cols-5">
              {steps.map((step, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-200 text-[10px] font-bold text-indigo-700">{i + 1}</span>
                    <step.icon size={12} className="text-indigo-500" />
                  </div>
                  <p className="text-[11px] font-semibold text-indigo-800">{step.title}</p>
                  <p className="text-[10px] leading-relaxed text-indigo-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Messages Card con edición inline ────────────────────────────────────────

function MessagesCard({
  variants,
  finalEmail,
  domain,
  objective,
}: {
  variants: MessageVariant[] | null;
  finalEmail: string | null;
  domain: string;
  objective: Objective;
}) {
  const [activeId, setActiveId] = useState<string>("main");
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recipient, setRecipient] = useState("");
  const [emailClient, setEmailClient] = useState<EmailClient>("gmail");
  const [sendClicked, setSendClicked] = useState(false);

  const messages: MessageVariant[] =
    variants?.filter((v) => v.content) ??
    (finalEmail ? [{ id: "main", label: "Principal", content: finalEmail }] : []);

  if (!messages.length) return null;

  const active = messages.find((m) => m.id === activeId) ?? messages[0];
  const activeContent = editedContent[active.id] ?? active.content;
  const isEditing = editingId === active.id;

  const startEdit = () => {
    if (!editedContent[active.id]) {
      setEditedContent((prev) => ({ ...prev, [active.id]: active.content }));
    }
    setEditingId(active.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSend = () => {
    if (!recipient.trim() || !activeContent) return;
    const subject = objective === "partnership"
      ? `Propuesta de alianza — ${domain}`
      : `Propuesta para ${domain}`;
    const url = buildMailtoUrl(emailClient, recipient.trim(), subject, activeContent);
    window.open(url, "_blank", "noopener,noreferrer");
    setSendClicked(true);
    setTimeout(() => setSendClicked(false), 3000);
  };

  const isPartnership = objective === "partnership";
  const CLIENT_LABELS: Record<EmailClient, string> = { gmail: "Gmail", outlook: "Outlook", native: "App" };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isPartnership ? "bg-violet-100" : "bg-emerald-100"}`}>
            <Mail size={15} className={isPartnership ? "text-violet-600" : "text-emerald-600"} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {isPartnership ? "Mensajes de alianza" : "Mensajes de venta"}
            </p>
            <p className="text-[11px] text-slate-400">
              {messages.length} variante{messages.length !== 1 ? "s" : ""} generadas en base al análisis de {domain} — ya incluyen contexto específico del negocio
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
              onClick={() => { setActiveId(m.id); setEditingId(null); }}
              className={`border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
                activeId === m.id
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {m.label}
              {editedContent[m.id] && editedContent[m.id] !== m.content && (
                <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-600">editado</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Message content */}
      <div className="p-6">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              autoFocus
              rows={8}
              value={activeContent}
              onChange={(e) => setEditedContent((prev) => ({ ...prev, [active.id]: e.target.value }))}
              className="w-full resize-none rounded-xl border border-indigo-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
              >
                <X size={12} /> Cancelar
              </button>
              <p className="text-[11px] text-slate-400">
                {activeContent.length} caracteres — los cambios se guardan localmente
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {activeContent}
            </p>
            <div className="flex flex-shrink-0 flex-col gap-2">
              <CopyButton getText={() => activeContent} />
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <Edit3 size={13} /> Editar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Send section */}
      <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Enviar por email
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            placeholder="destinatario@empresa.com"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            className="flex-1 border-slate-200 bg-white text-sm"
          />
          <div className="flex gap-2">
            {(["gmail", "outlook", "native"] as EmailClient[]).map((c) => (
              <button
                key={c}
                onClick={() => setEmailClient(c)}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors sm:flex-none ${
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
              className="flex-1 gap-1.5 bg-indigo-600 text-sm hover:bg-indigo-500 disabled:opacity-50 sm:flex-none"
            >
              {sendClicked ? <Check size={15} /> : <ExternalLink size={15} />}
              {sendClicked ? "Abierto" : "Enviar"}
            </Button>
          </div>
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
  const isQueued = prospect.status === "queued";
  const isAnalyzing = prospect.status === "analyzing" || isQueued;
  const isFailed = prospect.status === "failed";
  const isCompleted = prospect.status === "completed";

  const profile = prospect.profileData;
  const score = profile?.lead_score ?? 0;
  const sc = scoreColor(score);
  const ObjectiveIcon = OBJECTIVE_ICONS[prospect.objective];

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-slate-50">
      {/* Sticky header */}
      <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">{prospect.domain}</h1>
              {isCompleted && score > 0 && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${sc.badge}`}>{score}/100</span>
              )}
              {isAnalyzing && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">Analizando…</span>
              )}
              {isFailed && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600">Error</span>
              )}
            </div>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
              <span className="max-w-sm truncate">{prospect.url}</span>
              <span className="flex items-center gap-1">
                <ObjectiveIcon size={11} />
                {OBJECTIVE_LABELS[prospect.objective]}
              </span>
            </p>
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
      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">
        <div className="mx-auto max-w-5xl">

          {isAnalyzing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-xl space-y-3">
              {isQueued ? (
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                    <Loader2 size={18} className="animate-spin text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">En cola de análisis</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Esperando turno — los análisis anteriores se procesan primero.
                  </p>
                </div>
              ) : (
                <>
                  <p className="mb-4 text-sm font-semibold text-slate-500">Progreso del análisis</p>
                  {PIPELINE_STEPS.map((step) => (
                    <StepRow key={step} stepKey={step} status={prospect.steps[step] ?? "pending"} />
                  ))}
                  <p className="pt-2 text-center text-xs text-slate-400">
                    Esto puede demorar entre 1 y 3 minutos según el sitio.
                  </p>
                </>
              )}
            </motion.div>
          )}

          {isFailed && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <AlertCircle size={32} className="mx-auto mb-3 text-red-400" />
              <p className="text-sm font-semibold text-red-800">El análisis falló</p>
              <p className="mt-1 text-sm text-red-600">{prospect.error || "Error desconocido"}</p>
              <Button onClick={() => onReanalyze(prospect.url, prospect.objective)} variant="outline" className="mt-4 gap-2 border-red-200 text-red-600 hover:bg-red-100">
                <RefreshCw size={14} /> Volver a intentar
              </Button>
            </motion.div>
          )}

          {isCompleted && profile && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Reading guide */}
              <AnalysisGuide objective={prospect.objective} />

              {/* Row 1: Score + Business info (mobile: score first for quick scan) */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="order-2 lg:order-1 lg:col-span-2">
                  <BusinessCard profile={profile} objective={prospect.objective} />
                </div>
                <div className="order-1 flex flex-col gap-5 lg:order-2">
                  {score > 0 && <ScoreCard score={score} reason={profile.lead_score_reason} objective={prospect.objective} />}
                  <TechCard technology={profile.technology} />
                </div>
              </div>

              {/* Row 2: Issues + Opportunities */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <IssuesCard profile={profile} objective={prospect.objective} />
                <OpportunitiesCard profile={profile} objective={prospect.objective} />
              </div>

              {/* Row 3: Messages */}
              <MessagesCard
                variants={prospect.messageVariants}
                finalEmail={prospect.finalEmail}
                domain={prospect.domain}
                objective={prospect.objective}
              />
            </motion.div>
          )}

          {isCompleted && !profile && (prospect.finalEmail || prospect.messageVariants) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <MessagesCard
                variants={prospect.messageVariants}
                finalEmail={prospect.finalEmail}
                domain={prospect.domain}
                objective={prospect.objective}
              />
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
