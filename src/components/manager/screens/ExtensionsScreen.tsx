import { useMemo, useState } from "react";
import {
  Blocks,
  CheckCircle,
  Download,
  Key,
  Plug,
  Power,
  ScrollText,
  Search,
  ShieldCheck,
  Trash2,
  Webhook,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  downloadRows,
  EmptyState,
  ErrorState,
  GlassCard,
  LoadingBlock,
  PageHeader,
  StatCard,
  StatusBadge,
  usd,
  when,
} from "@/components/manager/primitives";
import {
  useDeleteRecord,
  useInsertRecord,
  useManyRecords,
  useUpdateRecord,
  type Row,
} from "@/lib/manager-queries";

const SUBSECTIONS = [
  "ext-marketplace",
  "ext-installed",
  "ext-permissions",
  "ext-webhooks",
  "ext-activity",
];

export default function ExtensionsScreen({ view }: { view?: string | undefined }) {
  const initial = view && SUBSECTIONS.includes(view) ? view : "ext-marketplace";
  const [tab, setTab] = useState(initial);
  const [query, setQuery] = useState("");

  const many = useManyRecords([
    { table: "extensions", orderBy: "name", ascending: true, limit: 300 },
    { table: "extension_installs", orderBy: "created_at", ascending: false, limit: 300 },
    { table: "extension_events", orderBy: "occurred_at", ascending: false, limit: 400 },
  ]);

  const [extensions = [], installs = [], events = []] = many.data ?? [];

  const extById = useMemo(
    () => new Map(extensions.map((e) => [String(e["id"]), e])),
    [extensions],
  );

  const installedIds = useMemo(
    () => new Set(installs.map((i) => String(i["extension_id"]))),
    [installs],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return extensions;
    return extensions.filter((e) =>
      [e["name"], e["vendor"], e["category"], e["description"]]
        .map((v) => String(v ?? "").toLowerCase())
        .some((v) => v.includes(q)),
    );
  }, [extensions, query]);

  const install = useInsertRecord("Extension installed");
  const updateInstall = useUpdateRecord("Extension install updated");
  const updateExtension = useUpdateRecord("Extension updated");
  const removeInstall = useDeleteRecord("Extension removed");

  const monthlyCost = installs.reduce((sum, i) => sum + Number(i["monthly_cost_usd"] ?? 0), 0);
  const failing = events.filter((e) => e["status"] === "error").length;

  const header = (
    <PageHeader
      title="Extensions"
      eyebrow="Marketplace"
      icon={<Blocks className="h-5 w-5" />}
      description="Install, configure and monitor the extensions that connect Software Vala to external platforms."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadRows("extensions", extensions)}
          disabled={!extensions.length}
        >
          <Download className="mr-1.5 h-3.5 w-3.5" /> Export catalog
        </Button>
      }
    />
  );

  if (many.isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <LoadingBlock rows={6} />
      </div>
    );
  }
  if (many.error) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState error={many.error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Available extensions" value={extensions.length} icon={<Blocks className="h-4 w-4" />} />
        <StatCard label="Installed" value={installs.length} icon={<Plug className="h-4 w-4" />} tone="green" />
        <StatCard label="Monthly cost" value={usd(monthlyCost)} icon={<Key className="h-4 w-4" />} tone="amber" />
        <StatCard label="Failed events" value={failing} icon={<XCircle className="h-4 w-4" />} tone="red" />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="ext-marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="ext-installed">Installed</TabsTrigger>
          <TabsTrigger value="ext-permissions">Permissions & Scopes</TabsTrigger>
          <TabsTrigger value="ext-webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="ext-activity">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="ext-marketplace" className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search extensions by name, vendor or category…"
              className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState message="No extensions match this search." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((ext) => {
                const isInstalled = installedIds.has(String(ext["id"]));
                return (
                  <GlassCard key={String(ext["id"])}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold">{String(ext["name"])}</span>
                          {ext["is_official"] ? (
                            <Badge variant="outline" className="gap-1 text-[10px]">
                              <ShieldCheck className="h-3 w-3" /> Official
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {String(ext["vendor"])} · v{String(ext["version"])} · {String(ext["category"])}
                        </p>
                      </div>
                      <StatusBadge value={String(ext["status"])} />
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                      {String(ext["description"] ?? "")}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(ext["scopes"] as string[] | null)?.slice(0, 4).map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">
                          {s}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {Number(ext["price_usd_month"] ?? 0) > 0
                          ? `${usd(Number(ext["price_usd_month"]))}/mo`
                          : "Included"}
                        {" · "}
                        {Number(ext["install_count"] ?? 0)} installs
                      </span>
                      <div className="flex gap-2">
                        {ext["docs_url"] ? (
                          <a
                            href={String(ext["docs_url"])}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary underline-offset-2 hover:underline"
                          >
                            Docs
                          </a>
                        ) : null}
                        <Button
                          size="sm"
                          disabled={isInstalled || install.isPending}
                          onClick={() => {
                            install.mutate({
                              table: "extension_installs",
                              values: {
                                extension_id: ext["id"],
                                product: "platform",
                                environment: "production",
                                status: "active",
                                health: "healthy",
                                granted_scopes: ext["scopes"] ?? [],
                                monthly_cost_usd: ext["price_usd_month"] ?? 0,
                                last_sync_at: new Date().toISOString(),
                              },
                            });
                            updateExtension.mutate({
                              table: "extensions",
                              id: String(ext["id"]),
                              values: { status: "installed" },
                            });
                          }}
                        >
                          {isInstalled ? "Installed" : "Add extension"}
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ext-installed">
          <GlassCard title="Installed extensions" icon={<Plug className="h-4 w-4" />}>
            {installs.length === 0 ? (
              <EmptyState message="No extensions installed yet." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Extension</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Environment</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Last sync</TableHead>
                    <TableHead className="text-right">Active</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installs.map((i) => {
                    const ext = extById.get(String(i["extension_id"]));
                    return (
                      <TableRow key={String(i["id"])}>
                        <TableCell className="font-medium">{String(ext?.["name"] ?? "—")}</TableCell>
                        <TableCell>{String(i["product"])}</TableCell>
                        <TableCell>{String(i["environment"])}</TableCell>
                        <TableCell>
                          <StatusBadge value={String(i["health"])} />
                        </TableCell>
                        <TableCell>{usd(Number(i["monthly_cost_usd"] ?? 0))}</TableCell>
                        <TableCell className="text-muted-foreground">{when(i["last_sync_at"] as string)}</TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={i["status"] === "active"}
                            onCheckedChange={(on) =>
                              updateInstall.mutate({
                                table: "extension_installs",
                                id: String(i["id"]),
                                values: { status: on ? "active" : "paused" },
                              })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Remove extension"
                            onClick={() =>
                              removeInstall.mutate({ table: "extension_installs", id: String(i["id"]) })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </GlassCard>
        </TabsContent>

        <TabsContent value="ext-permissions">
          <GlassCard title="Granted scopes" icon={<Key className="h-4 w-4" />}>
            {installs.length === 0 ? (
              <EmptyState message="No installed extensions to review." />
            ) : (
              <div className="space-y-3">
                {installs.map((i) => {
                  const ext = extById.get(String(i["extension_id"]));
                  const required = (ext?.["scopes"] as string[] | null) ?? [];
                  const granted = new Set((i["granted_scopes"] as string[] | null) ?? []);
                  return (
                    <div key={String(i["id"])} className="rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{String(ext?.["name"] ?? "—")}</span>
                        <span className="text-xs text-muted-foreground">
                          {granted.size}/{required.length} scopes granted
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {required.map((scope) => {
                          const on = granted.has(scope);
                          return (
                            <button
                              key={scope}
                              type="button"
                              onClick={() => {
                                const next = new Set(granted);
                                if (on) next.delete(scope);
                                else next.add(scope);
                                updateInstall.mutate({
                                  table: "extension_installs",
                                  id: String(i["id"]),
                                  values: { granted_scopes: Array.from(next) },
                                });
                              }}
                            >
                              <Badge variant={on ? "default" : "outline"} className="gap-1">
                                {on ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                {scope}
                              </Badge>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </TabsContent>

        <TabsContent value="ext-webhooks">
          <GlassCard title="Extension webhooks" icon={<Webhook className="h-4 w-4" />}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Extension</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Deliveries</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extensions
                  .filter((e) => e["webhook_url"])
                  .map((e) => {
                    const deliveries = events.filter(
                      (ev) => ev["extension_id"] === e["id"] && String(ev["event_type"]).startsWith("webhook"),
                    );
                    return (
                      <TableRow key={String(e["id"])}>
                        <TableCell className="font-medium">{String(e["name"])}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {String(e["webhook_url"])}
                        </TableCell>
                        <TableCell>{deliveries.length}</TableCell>
                        <TableCell className="text-right">
                          <StatusBadge value={String(e["status"])} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </GlassCard>
        </TabsContent>

        <TabsContent value="ext-activity">
          <GlassCard
            title="Extension activity"
            icon={<ScrollText className="h-4 w-4" />}
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadRows("extension-events", events)}
                disabled={!events.length}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" /> Export
              </Button>
            }
          >
            {events.length === 0 ? (
              <EmptyState message="No extension activity recorded yet." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Extension</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((ev) => (
                    <TableRow key={String(ev["id"])}>
                      <TableCell className="text-muted-foreground">{when(ev["occurred_at"] as string)}</TableCell>
                      <TableCell>{String(extById.get(String(ev["extension_id"]))?.["name"] ?? "—")}</TableCell>
                      <TableCell className="font-mono text-xs">{String(ev["event_type"])}</TableCell>
                      <TableCell className="max-w-[380px] truncate">{String(ev["message"] ?? "")}</TableCell>
                      <TableCell>{Number(ev["latency_ms"] ?? 0)} ms</TableCell>
                      <TableCell className="text-right">
                        <StatusBadge value={String(ev["status"])} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export type { Row };
