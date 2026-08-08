import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function GlassCard({
  title,
  icon,
  actions,
  children,
  className,
}: {
  title?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("glass-panel border-border/50", className)}>
      {title ? (
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            {icon}
            {title}
          </CardTitle>
          {actions}
        </CardHeader>
      ) : null}
      <CardContent className={title ? "" : "pt-6"}>{children}</CardContent>
    </Card>
  );
}

const TONES: Record<string, string> = {
  primary: "from-primary to-neon-violet",
  cyan: "from-neon-cyan to-neon-teal",
  green: "from-neon-green to-neon-teal",
  amber: "from-neon-gold to-neon-orange",
  red: "from-neon-red to-neon-pink",
  violet: "from-neon-violet to-neon-blue",
  slate: "from-muted to-secondary",
};

export function StatCard({
  label,
  value,
  icon,
  change,
  tone = "primary",
  loading,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  change?: string;
  tone?: keyof typeof TONES;
  loading?: boolean;
}) {
  const positive = change?.startsWith("+");
  return (
    <Card className="glass-panel border-border/50 transition-colors hover:border-primary/40">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "rounded-lg bg-gradient-to-br p-2 text-primary-foreground",
              TONES[tone] ?? TONES['primary'],
            )}
          >
            {icon}
          </div>
          {change ? (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                positive
                  ? "border-status-success/40 text-status-success"
                  : "border-status-error/40 text-status-error",
              )}
            >
              {change}
            </Badge>
          ) : null}
        </div>
        <div className="mt-3">
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="font-display text-2xl font-bold text-foreground">{value}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const STATUS_TONE: Record<string, string> = {
  active: "border-status-success/40 bg-status-success/15 text-status-success",
  healthy: "border-status-success/40 bg-status-success/15 text-status-success",
  online: "border-status-success/40 bg-status-success/15 text-status-success",
  enabled: "border-status-success/40 bg-status-success/15 text-status-success",
  operational: "border-status-success/40 bg-status-success/15 text-status-success",
  resolved: "border-status-success/40 bg-status-success/15 text-status-success",
  paid: "border-status-success/40 bg-status-success/15 text-status-success",
  passed: "border-status-success/40 bg-status-success/15 text-status-success",
  succeeded: "border-status-success/40 bg-status-success/15 text-status-success",
  completed: "border-status-success/40 bg-status-success/15 text-status-success",
  production: "border-status-success/40 bg-status-success/15 text-status-success",
  stable: "border-status-success/40 bg-status-success/15 text-status-success",
  warning: "border-status-warning/40 bg-status-warning/15 text-status-warning",
  degraded: "border-status-warning/40 bg-status-warning/15 text-status-warning",
  pending: "border-status-warning/40 bg-status-warning/15 text-status-warning",
  investigating: "border-status-warning/40 bg-status-warning/15 text-status-warning",
  running: "border-status-warning/40 bg-status-warning/15 text-status-warning",
  training: "border-status-warning/40 bg-status-warning/15 text-status-warning",
  review: "border-status-warning/40 bg-status-warning/15 text-status-warning",
  beta: "border-status-warning/40 bg-status-warning/15 text-status-warning",
  overdue: "border-status-error/40 bg-status-error/15 text-status-error",
  critical: "border-status-error/40 bg-status-error/15 text-status-error",
  error: "border-status-error/40 bg-status-error/15 text-status-error",
  down: "border-status-error/40 bg-status-error/15 text-status-error",
  failed: "border-status-error/40 bg-status-error/15 text-status-error",
  revoked: "border-status-error/40 bg-status-error/15 text-status-error",
  blocked: "border-status-error/40 bg-status-error/15 text-status-error",
  open: "border-status-error/40 bg-status-error/15 text-status-error",
  suspended: "border-status-error/40 bg-status-error/15 text-status-error",
  high: "border-status-error/40 bg-status-error/15 text-status-error",
  retired: "border-border/60 bg-muted/40 text-muted-foreground",
  inactive: "border-border/60 bg-muted/40 text-muted-foreground",
  disabled: "border-border/60 bg-muted/40 text-muted-foreground",
  archived: "border-border/60 bg-muted/40 text-muted-foreground",
  draft: "border-border/60 bg-muted/40 text-muted-foreground",
  deprecated: "border-status-warning/40 bg-status-warning/15 text-status-warning",
};

export function StatusBadge({ value, className }: { value?: string | null; className?: string }) {
  const key = (value ?? "unknown").toLowerCase();
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        STATUS_TONE[key] ?? "border-status-info/40 bg-status-info/15 text-status-info",
        className,
      )}
    >
      {value ?? "unknown"}
    </Badge>
  );
}

export function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-10 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/60 py-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  return (
    <div className="rounded-lg border border-status-error/40 bg-status-error/10 p-4 text-sm text-status-error">
      {error instanceof Error ? error.message : "Failed to load data"}
    </div>
  );
}

/** Wraps query state into loading / error / empty / content. */
export function QueryBoundary<T>({
  query,
  empty = "No records yet",
  children,
}: {
  query: { data?: T[]; isLoading: boolean; error: unknown };
  empty?: string;
  children: (rows: T[]) => ReactNode;
}) {
  if (query.isLoading) return <LoadingBlock />;
  if (query.error) return <ErrorState error={query.error} />;
  const rows = query.data ?? [];
  if (rows.length === 0) return <EmptyState message={empty} />;
  return <>{children(rows)}</>;
}

export const inr = (n: number | null | undefined) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const usd = (n: number | null | undefined) =>
  `$${Number(n ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export const num = (n: number | null | undefined) =>
  Number(n ?? 0).toLocaleString("en-IN");

export const when = (value?: string | null) =>
  value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

export const day = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—";

export function downloadRows(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0] ?? {});
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = r[h];
          const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
          return `"${s.replace(/"/g, '""')}"`;
        })
        .join(","),
    ),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
