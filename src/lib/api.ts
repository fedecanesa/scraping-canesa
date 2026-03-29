// lib/api.ts — Shared API constants and helpers

export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://scraping-canesa-scraping-canesa.1jn0jx.easypanel.host";

export function buildHeaders(apiToken: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiToken.trim()) headers["X-Api-Key"] = apiToken.trim();
  return headers;
}

export async function searchBusinesses(
  category: string,
  city: string,
  apiToken: string,
  maxResults = 20,
) {
  const res = await fetch(`${API_BASE}/search`, {
    method: "POST",
    headers: buildHeaders(apiToken),
    body: JSON.stringify({ category, city, max_results: maxResults }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(parseApiError(res, body));
  }
  return res.json();
}

export function parseApiError(
  response: Response,
  body: { detail?: string } | null,
): string {
  if (response.status === 429)
    return "Demasiadas solicitudes. Esperá un momento antes de volver a intentar.";
  if (response.status === 401)
    return "API key inválida o requerida. Revisá la configuración.";
  return body?.detail || `Error del servidor (${response.status})`;
}
