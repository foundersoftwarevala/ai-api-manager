import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle } from "lucide-react";

import { checkSchemaHealth } from "@/lib/manager-health.functions";

/**
 * Startup schema guard: verifies every manager table exists and that the
 * core tables actually carry seeded/real rows. Renders nothing when healthy.
 */
export default function SchemaGuard() {
  const fn = useServerFn(checkSchemaHealth);
  const { data } = useQuery({
    queryKey: ["manager", "schema-health"],
    queryFn: () => fn({}),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  if (!data || data.ok) return null;

  return (
    <div
      role="alert"
      className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <div className="min-w-0 space-y-1">
        <p className="font-medium text-foreground">Backend schema check failed</p>
        {data.missing.length ? (
          <p className="text-muted-foreground">
            Missing tables: <span className="text-foreground">{data.missing.join(", ")}</span>
          </p>
        ) : null}
        {data.empty.length ? (
          <p className="text-muted-foreground">
            No data in: <span className="text-foreground">{data.empty.join(", ")}</span>
          </p>
        ) : null}
        <p className="text-muted-foreground">
          Screens depending on these will stay empty until the database migration and seed data are applied.
        </p>
      </div>
    </div>
  );
}
