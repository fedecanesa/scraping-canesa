import { motion } from "framer-motion";
import { Bot, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "register";

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("¡Cuenta creada! Revisá tu email para confirmar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // AuthProvider detecta el cambio de sesión automáticamente
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      // Traducir mensajes comunes de Supabase
      if (msg.includes("Invalid login credentials")) setError("Email o contraseña incorrectos.");
      else if (msg.includes("Email not confirmed")) setError("Confirmá tu email antes de entrar.");
      else if (msg.includes("Password should be")) setError("La contraseña debe tener al menos 6 caracteres.");
      else if (msg.includes("already registered")) setError("Este email ya está registrado. Iniciá sesión.");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/25">
            <Bot size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">DeepReacher</h1>
          <p className="mt-1 text-sm text-slate-400">Inteligencia comercial con IA</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-base font-bold text-slate-800">
            {mode === "login" ? "Iniciá sesión" : "Creá tu cuenta"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-9 border-slate-200"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="pl-9 pr-9 border-slate-200"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Error / Success */}
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
            )}
            {success && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{success}</p>
            )}

            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-indigo-600 font-semibold hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Procesando...</>
              ) : mode === "login" ? (
                "Entrar"
              ) : (
                "Crear cuenta"
              )}
            </Button>
          </form>

          {/* Mode toggle */}
          <p className="mt-4 text-center text-xs text-slate-400">
            {mode === "login" ? (
              <>
                ¿No tenés cuenta?{" "}
                <button onClick={() => { setMode("register"); setError(null); setSuccess(null); }} className="font-semibold text-indigo-600 hover:text-indigo-800">
                  Registrate
                </button>
              </>
            ) : (
              <>
                ¿Ya tenés cuenta?{" "}
                <button onClick={() => { setMode("login"); setError(null); setSuccess(null); }} className="font-semibold text-indigo-600 hover:text-indigo-800">
                  Iniciá sesión
                </button>
              </>
            )}
          </p>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          Tus datos están protegidos y encriptados
        </p>
      </motion.div>
    </div>
  );
}
