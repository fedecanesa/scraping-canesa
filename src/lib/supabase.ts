import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) ?? "";
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? "";

// Fallback vacío — la app muestra AuthScreen igual, pero los errores de red serán claros
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder",
);
