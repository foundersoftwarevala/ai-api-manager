import { createServerFn } from "@tanstack/react-start";

import { MANAGER_TABLES } from "./manager-tables";

export interface TableHealth {
  table: string;
  exists: boolean;
  rows: number;
  error: string | null;
}

export interface SchemaHealth {
  ok: boolean;
  checkedAt: string;
  missing: string[];
  empty: string[];
  tables: TableHealth[];
}

/** Tables that must contain seeded/real rows for the console to be meaningful. */
const MUST_HAVE_ROWS = [
  "ai_providers",
  "api_services",
  "api_keys",
  "ai_models",
  "wallets",
  "billing_plans",
  "system_settings",
  "emergency_controls",
  "extensions",
] as const;

export const checkSchemaHealth = createServerFn({ method: "GET" }).handler(
  async (): Promise<SchemaHealth> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const tables = await Promise.all(
      MANAGER_TABLES.map(async (table): Promise<TableHealth> => {
        const { count, error } = await supabaseAdmin
          .from(table)
          .select("*", { count: "exact", head: true });
        if (error) {
          const missing = /schema cache|does not exist/i.test(error.message);
          return { table, exists: !missing, rows: 0, error: error.message };
        }
        return { table, exists: true, rows: count ?? 0, error: null };
      }),
    );

    const missing = tables.filter((t) => !t.exists).map((t) => t.table);
    const empty = tables
      .filter((t) => t.exists && t.rows === 0 && (MUST_HAVE_ROWS as readonly string[]).includes(t.table))
      .map((t) => t.table);

    return {
      ok: missing.length === 0 && empty.length === 0,
      checkedAt: new Date().toISOString(),
      missing,
      empty,
      tables,
    };
  },
);
