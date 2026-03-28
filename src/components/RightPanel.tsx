import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RightPanelProps {
  apiToken: string;
  onApiTokenChange: (value: string) => void;
  headers: string;
  onHeadersChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function RightPanel({
  apiToken,
  onApiTokenChange,
  headers,
  onHeadersChange,
  onSubmit,
  isLoading,
}: RightPanelProps) {
  return (
    <aside className="flex w-[260px] flex-col gap-6 border-l border-border p-5">
      <div>
        <h3 className="text-base font-bold text-foreground">API Token</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Campo reservado para una futura autenticación del usuario.
        </p>

        <Input
          className="mt-2"
          placeholder="Ingresa tu API token"
          type="password"
          value={apiToken}
          onChange={(e) => onApiTokenChange(e.target.value)}
        />
      </div>

      <div>
        <h3 className="text-base font-bold text-foreground">Headers</h3>
        <Input
          className="mt-2"
          placeholder="Ej: User-Agent, Accept, etc"
          value={headers}
          onChange={(e) => onHeadersChange(e.target.value)}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Campo visual para una futura personalización de requests.
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Todavía no estamos enviando estos valores al backend.
      </p>

      <Button
        onClick={onSubmit}
        disabled={isLoading}
        className="mt-auto w-full bg-emerald-600 font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-500"
      >
        {isLoading ? "Procesando..." : "Enviar a Scraper Web"}
      </Button>
    </aside>
  );
}
