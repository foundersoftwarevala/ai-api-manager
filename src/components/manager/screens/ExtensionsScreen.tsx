import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Blocks,
  Boxes,
  CheckCircle,
  Download,
  ExternalLink,
  GitBranch,
  Key,
  LayoutDashboard,
  Plug,
  RefreshCw,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
  Trash2,
  Users,
  Webhook,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

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
  ConfirmAction,
  DetailRow,
  FilterSelect,
  Pager,
  SearchField,
  Toolbar,
  usePaged,
} from "@/components/manager/data-ui";
import {
  useDeleteRecord,
  useInsertRecord,
  useManyRecords,
  useUpdateRecord,
  type Row,
} from "@/lib/manager-queries";

const SUBSECTIONS = [
  "ext-overview",
  "ext-marketplace",
  "ext-installed",
  "ext-updates",
  "ext-dependencies",
  "ext-permissions",
  "ext-config",
  "ext-webhooks",
  "ext-health",
  "ext-security",
  "ext-publishers",
  "ext-activity",
];

const str = (v: unknown) => String(v ?? "");
const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);

export default function ExtensionsScreen({ view }: { view?: string | undefined }) {
  const initial = view && SUBSECTIONS.includes(view) ? view : "ext-overview";
  const [tab, setTab] = useState(initial);
  useEffect(() => {
    if (view && SUBSECTIONS.includes(view)) setTab(view);
  }, [view]);

  const [detail, setDetail] = useState<Row | null>(null);

  const many = useManyRecords([
    { table: "extensions", orderBy: "name", ascending: true, limit: 300 },
    { table: "extension_installs", orderBy: "created_at", ascending: false, limit: 300 },
    { table: "extension_events", orderBy: "occurred_at", ascending: false, limit: 400 },
    { table: "extension_versions", orderBy: "released_at", ascending: false, limit: 400 },
  ]);

  const [extensions = [], installs = [], events = [], versions = []] = many.data ?? [];

  const extById = useMemo(() => new Map(extensions.map((e) => [str(e["id"]), e])), [extensions]);
  const installByExt = useMemo(
    () => new Map(installs.map((i) => [str(i["extension_id"]), i])),
    [installs],
  );

  const install = useInsertRecord("Extension installed");
  const updateInstall = useUpdateRecord("Extension install updated");
  const updateExtension = useUpdateRecord("Extension updated");
  const removeInstall = useDeleteRecord("Extension uninstalled");

  const monthlyCost = installs.reduce((s, i) => s + Number(i["monthly_cost_usd"] ?? 0), 0);
  const failing = events.filter((e) => e["status"] === "error").length;
  const updatesAvailable = extensions.filter(
    (e) => str(e["latest_version"]) && str(e["latest_version"]) !== str(e["version"]),
  );

  const header = (
    <PageHeader
      title="Extension Manager"
      eyebrow="Extensions"
      icon={<Blocks className="h-5 w-5" />}
      description="Discover, install, configure and monitor every extension that connects Software Vala to external platforms."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadRows("extensions.csv", extensions)}
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
        <LoadingBlock rows={8} />
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
        <StatCard label="Catalog extensions" value={extensions.length} icon={<Blocks className="h-4 w-4" />} />
        <StatCard label="Installed" value={installs.length} icon={<Plug className="h-4 w-4" />} tone="green" />
        <StatCard label="Updates available" value={updatesAvailable.length} icon={<RefreshCw className="h-4 w-4" />} tone="amber" />
        <StatCard label="Failed events" value={failing} icon={<XCircle className="h-4 w-4" />} tone="red" />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="ext-overview" className="gap-1.5"><LayoutDashboard className="h-3.5 w-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="ext-marketplace" className="gap-1.5"><Boxes className="h-3.5 w-3.5" />Marketplace</TabsTrigger>
          <TabsTrigger value="ext-installed" className="gap-1.5"><Plug className="h-3.5 w-3.5" />Installed</TabsTrigger>
          <TabsTrigger value="ext-updates" className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" />Updates</TabsTrigger>
          <TabsTrigger value="ext-dependencies" className="gap-1.5"><GitBranch className="h-3.5 w-3.5" />Dependencies</TabsTrigger>
          <TabsTrigger value="ext-permissions" className="gap-1.5"><Key className="h-3.5 w-3.5" />Permissions</TabsTrigger>
          <TabsTrigger value="ext-config" className="gap-1.5"><Settings className="h-3.5 w-3.5" />Configuration</TabsTrigger>
          <TabsTrigger value="ext-webhooks" className="gap-1.5"><Webhook className="h-3.5 w-3.5" />Webhooks</TabsTrigger>
          <TabsTrigger value="ext-health" className="gap-1.5"><Activity className="h-3.5 w-3.5" />Health</TabsTrigger>
          <TabsTrigger value="ext-security" className="gap-1.5"><Shield className="h-3.5 w-3.5" />Security</TabsTrigger>
          <TabsTrigger value="ext-publishers" className="gap-1.5"><Users className="h-3.5 w-3.5" />Publishers</TabsTrigger>
          <TabsTrigger value="ext-activity" className="gap-1.5"><ScrollText className="h-3.5 w-3.5" />Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="ext-overview">
          <OverviewTab
            extensions={extensions}
            installs={installs}
            events={events}
            monthlyCost={monthlyCost}
            updates={updatesAvailable}
            onOpen={setDetail}
            onGoTo={setTab}
          />
        </TabsContent>

        <TabsContent value="ext-marketplace">
          <MarketplaceTab
            extensions={extensions}
            installByExt={installByExt}
            onOpen={setDetail}
            onInstall={(ext) => {
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
                id: str(ext["id"]),
                values: { status: "installed" },
              });
            }}
            pending={install.isPending}
          />
        </TabsContent>

        <TabsContent value="ext-installed">
          <InstalledTab
            installs={installs}
            extById={extById}
            onOpen={setDetail}
            onToggle={(id, on) =>
              updateInstall.mutate({
                table: "extension_installs",
                id,
                values: { status: on ? "active" : "paused" },
              })
            }
            onUninstall={(row) => {
              removeInstall.mutate({ table: "extension_installs", id: str(row["id"]) });
              updateExtension.mutate({
                table: "extensions",
                id: str(row["extension_id"]),
                values: { status: "available" },
              });
            }}
            pending={removeInstall.isPending || updateInstall.isPending}
          />
        </TabsContent>

        <TabsContent value="ext-updates">
          <UpdatesTab
            extensions={extensions}
            versions={versions}
            onUpdate={(ext) =>
              updateExtension.mutate({
                table: "extensions",
                id: str(ext["id"]),
                values: { version: str(ext["latest_version"]), compatibility: "compatible" },
              })
            }
            pending={updateExtension.isPending}
          />
        </TabsContent>

        <TabsContent value="ext-dependencies">
          <DependenciesTab extensions={extensions} installByExt={installByExt} />
        </TabsContent>

        <TabsContent value="ext-permissions">
          <PermissionsTab
            installs={installs}
            extById={extById}
            onToggleScope={(installRow, scopes) =>
              updateInstall.mutate({
                table: "extension_installs",
                id: str(installRow["id"]),
                values: { granted_scopes: scopes },
              })
            }
          />
        </TabsContent>

        <TabsContent value="ext-config">
          <ConfigurationTab
            installs={installs}
            extById={extById}
            onSave={(id, values) => updateInstall.mutate({ table: "extension_installs", id, values })}
            pending={updateInstall.isPending}
          />
        </TabsContent>

        <TabsContent value="ext-webhooks">
          <WebhooksTab extensions={extensions} events={events} />
        </TabsContent>

        <TabsContent value="ext-health">
          <HealthTab extensions={extensions} installs={installs} events={events} extById={extById} />
        </TabsContent>

        <TabsContent value="ext-security">
          <SecurityTab extensions={extensions} installs={installs} extById={extById} />
        </TabsContent>

        <TabsContent value="ext-publishers">
          <PublishersTab extensions={extensions} />
        </TabsContent>

        <TabsContent value="ext-activity">
          <ActivityTab events={events} extById={extById} />
        </TabsContent>
      </Tabs>

      <DetailSheet
        row={detail}
        install={detail ? installByExt.get(str(detail["id"])) : undefined}
        versions={versions.filter((v) => str(v["extension_id"]) === str(detail?.["id"]))}
        events={events.filter((e) => str(e["extension_id"]) === str(detail?.["id"])).slice(0, 6)}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}

/* ------------------------------- Overview -------------------------------- */

function OverviewTab({
  extensions,
  installs,
  events,
  monthlyCost,
  updates,
  onOpen,
  onGoTo,
}: {
  extensions: Row[];
  installs: Row[];
  events: Row[];
  monthlyCost: number;
  updates: Row[];
  onOpen: (r: Row) => void;
  onGoTo: (t: string) => void;
}) {
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of extensions) map.set(str(e["category"]), (map.get(str(e["category"])) ?? 0) + 1);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [extensions]);

  const healthy = installs.filter((i) => i["health"] === "healthy").length;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <GlassCard title="Portfolio health" icon={<Activity className="h-4 w-4" />} className="lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Healthy installs</p>
            <p className="font-display text-2xl font-bold">
              {healthy}/{installs.length}
            </p>
            <Progress
              className="mt-2 h-1.5"
              value={installs.length ? (healthy / installs.length) * 100 : 0}
              aria-label="Healthy install ratio"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Monthly extension spend</p>
            <p className="font-display text-2xl font-bold">{usd(monthlyCost)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Events (last 400)</p>
            <p className="font-display text-2xl font-bold">{events.length}</p>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Categories
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map(([cat, count]) => (
              <Badge key={cat} variant="secondary" className="capitalize">
                {cat} · {count}
              </Badge>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard
        title="Pending updates"
        icon={<RefreshCw className="h-4 w-4" />}
        actions={
          <Button size="sm" variant="outline" onClick={() => onGoTo("ext-updates")}>
            Manage
          </Button>
        }
      >
        {updates.length === 0 ? (
          <EmptyState message="Every extension is on its latest version." />
        ) : (
          <ul className="space-y-2">
            {updates.map((e) => (
              <li key={str(e["id"])}>
                <button
                  type="button"
                  onClick={() => onOpen(e)}
                  className="flex w-full items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.04]"
                >
                  <span className="truncate">{str(e["name"])}</span>
                  <span className="ml-2 shrink-0 font-mono text-xs text-muted-foreground">
                    {str(e["version"])} → {str(e["latest_version"])}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}

/* ------------------------------ Marketplace ------------------------------ */

function MarketplaceTab({
  extensions,
  installByExt,
  onInstall,
  onOpen,
  pending,
}: {
  extensions: Row[];
  installByExt: Map<string, Row>;
  onInstall: (ext: Row) => void;
  onOpen: (ext: Row) => void;
  pending: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("name");

  const categories = useMemo(
    () => Array.from(new Set(extensions.map((e) => str(e["category"])))).sort(),
    [extensions],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = extensions.filter((e) => {
      if (category !== "all" && str(e["category"]) !== category) return false;
      if (status === "installed" && !installByExt.has(str(e["id"]))) return false;
      if (status === "available" && installByExt.has(str(e["id"]))) return false;
      if (status === "official" && !e["is_official"]) return false;
      if (!q) return true;
      return [e["name"], e["vendor"], e["category"], e["description"], ...arr(e["tags"])]
        .map((v) => str(v).toLowerCase())
        .some((v) => v.includes(q));
    });
    const sorted = [...rows];
    if (sort === "name") sorted.sort((a, b) => str(a["name"]).localeCompare(str(b["name"])));
    if (sort === "installs") sorted.sort((a, b) => Number(b["install_count"] ?? 0) - Number(a["install_count"] ?? 0));
    if (sort === "rating") sorted.sort((a, b) => Number(b["rating"] ?? 0) - Number(a["rating"] ?? 0));
    if (sort === "price") sorted.sort((a, b) => Number(a["price_usd_month"] ?? 0) - Number(b["price_usd_month"] ?? 0));
    return sorted;
  }, [extensions, query, category, status, sort, installByExt]);

  const paged = usePaged(filtered, 9);
  useEffect(() => {
    paged.setPage(1);
  }, [query, category, status, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <Toolbar>
        <SearchField
          value={query}
          onChange={setQuery}
          label="Search extensions"
          placeholder="Search by name, vendor, tag or category…"
        />
        <FilterSelect
          label="Category"
          value={category}
          onChange={setCategory}
          options={[{ value: "all", label: "All categories" }, ...categories.map((c) => ({ value: c, label: c }))]}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All" },
            { value: "installed", label: "Installed" },
            { value: "available", label: "Not installed" },
            { value: "official", label: "Official only" },
          ]}
        />
        <FilterSelect
          label="Sort"
          value={sort}
          onChange={setSort}
          options={[
            { value: "name", label: "Name" },
            { value: "installs", label: "Most installed" },
            { value: "rating", label: "Top rated" },
            { value: "price", label: "Lowest price" },
          ]}
        />
      </Toolbar>

      {filtered.length === 0 ? (
        <EmptyState message="No extensions match these filters. Try clearing the search or category." />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paged.rows.map((ext) => {
              const installed = installByExt.has(str(ext["id"]));
              return (
                <GlassCard key={str(ext["id"])}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpen(ext)}
                          className="truncate rounded font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {str(ext["name"])}
                        </button>
                        {ext["is_official"] ? (
                          <Badge variant="outline" className="gap-1 text-[10px]">
                            <ShieldCheck className="h-3 w-3" /> Official
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {str(ext["vendor"])} · v{str(ext["version"])} · {str(ext["category"])}
                      </p>
                    </div>
                    <StatusBadge value={str(ext["status"])} />
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{str(ext["description"])}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {arr(ext["tags"]).slice(0, 4).map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">
                        {t}
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
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => onOpen(ext)}>
                        Details
                      </Button>
                      {installed ? (
                        <Button size="sm" variant="outline" disabled>
                          <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Installed
                        </Button>
                      ) : (
                        <ConfirmAction
                          trigger={
                            <Button size="sm" disabled={pending}>
                              Install
                            </Button>
                          }
                          title={`Install ${str(ext["name"])}?`}
                          description={`This grants ${arr(ext["scopes"]).length} scope(s) and adds ${
                            Number(ext["price_usd_month"] ?? 0) > 0
                              ? `${usd(Number(ext["price_usd_month"]))}/month`
                              : "no additional cost"
                          } to the platform environment.`}
                          confirmLabel="Install extension"
                          pending={pending}
                          onConfirm={() => onInstall(ext)}
                        />
                      )}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
          <Pager
            page={paged.page}
            pageCount={paged.pageCount}
            total={paged.total}
            onPage={paged.setPage}
            unit="extensions"
          />
        </>
      )}
    </div>
  );
}

/* ------------------------------- Installed ------------------------------- */

function InstalledTab({
  installs,
  extById,
  onToggle,
  onUninstall,
  onOpen,
  pending,
}: {
  installs: Row[];
  extById: Map<string, Row>;
  onToggle: (id: string, on: boolean) => void;
  onUninstall: (row: Row) => void;
  onOpen: (ext: Row) => void;
  pending: boolean;
}) {
  const [query, setQuery] = useState("");
  const [env, setEnv] = useState("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return installs.filter((i) => {
      if (env !== "all" && str(i["environment"]) !== env) return false;
      if (!q) return true;
      const ext = extById.get(str(i["extension_id"]));
      return [ext?.["name"], i["product"], i["environment"]].map((v) => str(v).toLowerCase()).some((v) => v.includes(q));
    });
  }, [installs, query, env, extById]);

  const paged = usePaged(rows, 10);
  const envs = Array.from(new Set(installs.map((i) => str(i["environment"]))));

  return (
    <GlassCard title="Installed extensions" icon={<Plug className="h-4 w-4" />}>
      <Toolbar>
        <SearchField value={query} onChange={setQuery} label="Search installs" placeholder="Search installs…" />
        <FilterSelect
          label="Environment"
          value={env}
          onChange={setEnv}
          options={[{ value: "all", label: "All environments" }, ...envs.map((e) => ({ value: e, label: e }))]}
        />
      </Toolbar>

      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState message="No installed extensions match this filter. Install one from the Marketplace tab." />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Extension</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Last sync</TableHead>
                <TableHead className="text-right">Enabled</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.rows.map((i) => {
                const ext = extById.get(str(i["extension_id"]));
                return (
                  <TableRow key={str(i["id"])}>
                    <TableCell className="font-medium">
                      {ext ? (
                        <button type="button" className="rounded hover:underline" onClick={() => onOpen(ext)}>
                          {str(ext["name"])}
                        </button>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{str(i["product"])}</TableCell>
                    <TableCell className="capitalize">{str(i["environment"])}</TableCell>
                    <TableCell>
                      <StatusBadge value={str(i["health"])} />
                    </TableCell>
                    <TableCell>{usd(Number(i["monthly_cost_usd"] ?? 0))}</TableCell>
                    <TableCell className="text-muted-foreground">{when(i["last_sync_at"] as string)}</TableCell>
                    <TableCell className="text-right">
                      <Switch
                        aria-label={`Enable ${str(ext?.["name"] ?? "extension")}`}
                        checked={i["status"] === "active"}
                        onCheckedChange={(on) => onToggle(str(i["id"]), on)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <ConfirmAction
                        trigger={
                          <Button size="icon" variant="ghost" aria-label={`Uninstall ${str(ext?.["name"] ?? "extension")}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                        title={`Uninstall ${str(ext?.["name"] ?? "extension")}?`}
                        description="The install record, granted scopes and configuration are removed. Catalog history and past activity logs are kept."
                        confirmLabel="Uninstall"
                        pending={pending}
                        onConfirm={() => onUninstall(i)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pager page={paged.page} pageCount={paged.pageCount} total={paged.total} onPage={paged.setPage} unit="installs" />
        </div>
      )}
    </GlassCard>
  );
}

/* -------------------------------- Updates -------------------------------- */

function UpdatesTab({
  extensions,
  versions,
  onUpdate,
  pending,
}: {
  extensions: Row[];
  versions: Row[];
  onUpdate: (ext: Row) => void;
  pending: boolean;
}) {
  const pendingUpdates = extensions.filter(
    (e) => str(e["latest_version"]) && str(e["latest_version"]) !== str(e["version"]),
  );

  return (
    <div className="space-y-6">
      <GlassCard title="Available updates" icon={<RefreshCw className="h-4 w-4" />}>
        {pendingUpdates.length === 0 ? (
          <EmptyState message="All extensions are running their latest published version." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Extension</TableHead>
                  <TableHead>Installed</TableHead>
                  <TableHead>Latest</TableHead>
                  <TableHead>Compatibility</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUpdates.map((e) => {
                  const security = versions.some(
                    (v) => str(v["extension_id"]) === str(e["id"]) && v["is_security_update"],
                  );
                  return (
                    <TableRow key={str(e["id"])}>
                      <TableCell className="font-medium">
                        {str(e["name"])}
                        {security ? (
                          <Badge variant="outline" className="ml-2 border-status-error/40 text-status-error">
                            Security
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{str(e["version"])}</TableCell>
                      <TableCell className="font-mono text-xs">{str(e["latest_version"])}</TableCell>
                      <TableCell>
                        <StatusBadge value={str(e["compatibility"])} />
                      </TableCell>
                      <TableCell className="text-right">
                        <ConfirmAction
                          trigger={
                            <Button size="sm" disabled={pending}>
                              Update
                            </Button>
                          }
                          title={`Update ${str(e["name"])} to ${str(e["latest_version"])}?`}
                          description={`Requires platform ${str(e["min_platform_version"])} or later. The pinned catalog version is switched immediately.`}
                          confirmLabel="Apply update"
                          pending={pending}
                          onConfirm={() => onUpdate(e)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>

      <GlassCard title="Version history" icon={<GitBranch className="h-4 w-4" />}>
        <VersionHistory versions={versions} extensions={extensions} />
      </GlassCard>
    </div>
  );
}

function VersionHistory({ versions, extensions }: { versions: Row[]; extensions: Row[] }) {
  const nameById = useMemo(
    () => new Map(extensions.map((e) => [str(e["id"]), str(e["name"])])),
    [extensions],
  );
  const paged = usePaged(versions, 10);
  if (versions.length === 0) return <EmptyState message="No version history recorded yet." />;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Extension</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Released</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.rows.map((v) => (
            <TableRow key={str(v["id"])}>
              <TableCell className="font-medium">{nameById.get(str(v["extension_id"])) ?? "—"}</TableCell>
              <TableCell className="font-mono text-xs">{str(v["version"])}</TableCell>
              <TableCell className="capitalize">{str(v["channel"])}</TableCell>
              <TableCell className="text-muted-foreground">{when(v["released_at"] as string)}</TableCell>
              <TableCell>
                {v["is_current"] ? <StatusBadge value="current" /> : null}
                {v["is_security_update"] ? <StatusBadge value="critical" className="ml-1" /> : null}
              </TableCell>
              <TableCell className="text-right">
                {v["notes_url"] ? (
                  <a
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    href={str(v["notes_url"])}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Release notes <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pager page={paged.page} pageCount={paged.pageCount} total={paged.total} onPage={paged.setPage} unit="releases" />
    </div>
  );
}

/* ----------------------------- Dependencies ------------------------------ */

function DependenciesTab({
  extensions,
  installByExt,
}: {
  extensions: Row[];
  installByExt: Map<string, Row>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {extensions.map((e) => {
        const deps = arr(e["dependencies"]);
        const installed = installByExt.has(str(e["id"]));
        return (
          <GlassCard key={str(e["id"])}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{str(e["name"])}</p>
                <p className="text-xs text-muted-foreground">
                  Requires platform {str(e["min_platform_version"])} · license {str(e["license"])}
                </p>
              </div>
              <StatusBadge value={str(e["compatibility"])} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {deps.length === 0 ? (
                <span className="text-xs text-muted-foreground">No platform dependencies</span>
              ) : (
                deps.map((d) => (
                  <Badge key={d} variant="outline" className="gap-1 text-[11px]">
                    <GitBranch className="h-3 w-3" /> {d}
                  </Badge>
                ))
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {installed ? "Installed on this platform" : "Not installed"}
            </p>
          </GlassCard>
        );
      })}
    </div>
  );
}

/* ------------------------------ Permissions ------------------------------ */

function PermissionsTab({
  installs,
  extById,
  onToggleScope,
}: {
  installs: Row[];
  extById: Map<string, Row>;
  onToggleScope: (install: Row, scopes: string[]) => void;
}) {
  return (
    <GlassCard title="Granted scopes" icon={<Key className="h-4 w-4" />}>
      {installs.length === 0 ? (
        <EmptyState message="No installed extensions to review." />
      ) : (
        <div className="space-y-3">
          {installs.map((i) => {
            const ext = extById.get(str(i["extension_id"]));
            const required = arr(ext?.["scopes"]);
            const granted = new Set(arr(i["granted_scopes"]));
            return (
              <div key={str(i["id"])} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{str(ext?.["name"] ?? "—")}</span>
                  <span className="text-xs text-muted-foreground">
                    {granted.size}/{required.length} scopes granted
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {required.length === 0 ? (
                    <span className="text-xs text-muted-foreground">This extension requests no scopes.</span>
                  ) : (
                    required.map((scope) => {
                      const on = granted.has(scope);
                      return (
                        <button
                          key={scope}
                          type="button"
                          aria-pressed={on}
                          aria-label={`${on ? "Revoke" : "Grant"} ${scope}`}
                          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => {
                            const next = new Set(granted);
                            if (on) next.delete(scope);
                            else next.add(scope);
                            onToggleScope(i, Array.from(next));
                          }}
                        >
                          <Badge variant={on ? "default" : "outline"} className="gap-1">
                            {on ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {scope}
                          </Badge>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}

/* ----------------------------- Configuration ----------------------------- */

function ConfigurationTab({
  installs,
  extById,
  onSave,
  pending,
}: {
  installs: Row[];
  extById: Map<string, Row>;
  onSave: (id: string, values: Record<string, unknown>) => void;
  pending: boolean;
}) {
  const [selected, setSelected] = useState(str(installs[0]?.["id"] ?? ""));
  const active = installs.find((i) => str(i["id"]) === selected) ?? installs[0];
  const [draft, setDraft] = useState(() => JSON.stringify(active?.["config"] ?? {}, null, 2));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setDraft(JSON.stringify(active?.["config"] ?? {}, null, 2));
    setInvalid(false);
  }, [active?.["id"]]); // eslint-disable-line react-hooks/exhaustive-deps

  if (installs.length === 0) {
    return (
      <GlassCard title="Extension configuration" icon={<Settings className="h-4 w-4" />}>
        <EmptyState message="Install an extension to configure it." />
      </GlassCard>
    );
  }

  return (
    <GlassCard title="Extension configuration" icon={<Settings className="h-4 w-4" />}>
      <Toolbar>
        <FilterSelect
          label="Extension"
          value={str(active?.["id"])}
          onChange={setSelected}
          options={installs.map((i) => ({
            value: str(i["id"]),
            label: `${str(extById.get(str(i["extension_id"]))?.["name"] ?? "Extension")} · ${str(i["environment"])}`,
          }))}
        />
      </Toolbar>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="ext-config-json" className="mb-1.5 block text-xs text-muted-foreground">
            Configuration (JSON)
          </label>
          <Textarea
            id="ext-config-json"
            rows={12}
            value={draft}
            spellCheck={false}
            onChange={(e) => {
              setDraft(e.target.value);
              try {
                JSON.parse(e.target.value);
                setInvalid(false);
              } catch {
                setInvalid(true);
              }
            }}
            className="font-mono text-xs"
            aria-invalid={invalid}
          />
          {invalid ? (
            <p role="alert" className="mt-1.5 text-xs text-status-error">
              Invalid JSON — fix the syntax before saving.
            </p>
          ) : null}
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              disabled={invalid || pending}
              onClick={() => onSave(str(active?.["id"]), { config: JSON.parse(draft) })}
            >
              Save configuration
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDraft(JSON.stringify(active?.["config"] ?? {}, null, 2))}
            >
              Reset
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Install details</p>
          <dl className="rounded-xl border border-border p-4">
            <DetailRow label="Product" value={str(active?.["product"])} />
            <DetailRow label="Environment" value={str(active?.["environment"])} />
            <DetailRow label="Status" value={<StatusBadge value={str(active?.["status"])} />} />
            <DetailRow label="Health" value={<StatusBadge value={str(active?.["health"])} />} />
            <DetailRow label="Installed by" value={str(active?.["installed_by"])} />
            <DetailRow label="Monthly cost" value={usd(Number(active?.["monthly_cost_usd"] ?? 0))} />
            <DetailRow label="Last sync" value={when(active?.["last_sync_at"] as string)} />
          </dl>
        </div>
      </div>
    </GlassCard>
  );
}

/* -------------------------------- Webhooks ------------------------------- */

function WebhooksTab({ extensions, events }: { extensions: Row[]; events: Row[] }) {
  const rows = extensions.filter((e) => e["webhook_url"]);
  if (rows.length === 0) return <EmptyState message="No extension exposes a webhook endpoint yet." />;
  return (
    <GlassCard title="Extension webhooks" icon={<Webhook className="h-4 w-4" />}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Extension</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead className="text-right">Deliveries</TableHead>
              <TableHead className="text-right">Failures</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((e) => {
              const deliveries = events.filter(
                (ev) => str(ev["extension_id"]) === str(e["id"]) && str(ev["event_type"]).startsWith("webhook"),
              );
              const failures = deliveries.filter((d) => d["status"] === "error").length;
              return (
                <TableRow key={str(e["id"])}>
                  <TableCell className="font-medium">{str(e["name"])}</TableCell>
                  <TableCell className="max-w-[320px] truncate font-mono text-xs text-muted-foreground">
                    {str(e["webhook_url"])}
                  </TableCell>
                  <TableCell className="text-right">{deliveries.length}</TableCell>
                  <TableCell className="text-right text-status-error">{failures}</TableCell>
                  <TableCell className="text-right">
                    <StatusBadge value={str(e["status"])} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  );
}

/* --------------------------------- Health -------------------------------- */

function HealthTab({
  extensions,
  installs,
  events,
  extById,
}: {
  extensions: Row[];
  installs: Row[];
  events: Row[];
  extById: Map<string, Row>;
}) {
  const errors = events.filter((e) => e["status"] === "error");
  const avgLatency = events.length
    ? Math.round(events.reduce((s, e) => s + Number(e["latency_ms"] ?? 0), 0) / events.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Healthy installs" value={installs.filter((i) => i["health"] === "healthy").length} icon={<Activity className="h-4 w-4" />} tone="green" />
        <StatCard label="Avg event latency" value={`${avgLatency} ms`} icon={<Activity className="h-4 w-4" />} tone="cyan" />
        <StatCard label="Errors captured" value={errors.length} icon={<XCircle className="h-4 w-4" />} tone="red" />
      </div>

      <GlassCard title="Install health" icon={<Activity className="h-4 w-4" />}>
        {installs.length === 0 ? (
          <EmptyState message="No installs to monitor." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Extension</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Errors</TableHead>
                  <TableHead>Last sync</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installs.map((i) => (
                  <TableRow key={str(i["id"])}>
                    <TableCell className="font-medium">
                      {str(extById.get(str(i["extension_id"]))?.["name"] ?? "—")}
                    </TableCell>
                    <TableCell className="capitalize">{str(i["environment"])}</TableCell>
                    <TableCell>
                      <StatusBadge value={str(i["health"])} />
                    </TableCell>
                    <TableCell>
                      {errors.filter((e) => str(e["extension_id"]) === str(i["extension_id"])).length}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{when(i["last_sync_at"] as string)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>

      <GlassCard title="Recent errors" icon={<XCircle className="h-4 w-4 text-status-error" />}>
        {errors.length === 0 ? (
          <EmptyState message="No extension errors recorded — everything is running clean." />
        ) : (
          <ul className="space-y-2">
            {errors.slice(0, 10).map((e) => (
              <li key={str(e["id"])} className="rounded-lg border border-status-error/30 bg-status-error/5 p-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-medium">
                    {str(extById.get(str(e["extension_id"]))?.["name"] ?? "Extension")} · {str(e["event_type"])}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{when(e["occurred_at"] as string)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{str(e["message"])}</p>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <GlassCard title="Compatibility matrix" icon={<GitBranch className="h-4 w-4" />}>
        <div className="flex flex-wrap gap-2">
          {extensions.map((e) => (
            <Badge key={str(e["id"])} variant="outline" className="gap-1.5">
              {str(e["name"])}
              <StatusBadge value={str(e["compatibility"])} className="ml-1 text-[10px]" />
            </Badge>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

/* -------------------------------- Security ------------------------------- */

function SecurityTab({
  extensions,
  installs,
  extById,
}: {
  extensions: Row[];
  installs: Row[];
  extById: Map<string, Row>;
}) {
  const writeScopes = (scopes: string[]) => scopes.filter((s) => /write|send|delete/.test(s));
  return (
    <div className="space-y-6">
      <GlassCard title="Scope risk review" icon={<Shield className="h-4 w-4" />}>
        {installs.length === 0 ? (
          <EmptyState message="No installed extensions to assess." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Extension</TableHead>
                  <TableHead>Publisher</TableHead>
                  <TableHead>Official</TableHead>
                  <TableHead>Write scopes</TableHead>
                  <TableHead className="text-right">Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installs.map((i) => {
                  const ext = extById.get(str(i["extension_id"]));
                  const write = writeScopes(arr(i["granted_scopes"]));
                  const risk = write.length >= 2 ? "high" : write.length === 1 ? "warning" : "healthy";
                  return (
                    <TableRow key={str(i["id"])}>
                      <TableCell className="font-medium">{str(ext?.["name"] ?? "—")}</TableCell>
                      <TableCell>{str(ext?.["vendor"] ?? "—")}</TableCell>
                      <TableCell>{ext?.["is_official"] ? "Yes" : "No"}</TableCell>
                      <TableCell className="font-mono text-xs">{write.join(", ") || "—"}</TableCell>
                      <TableCell className="text-right">
                        <StatusBadge value={risk} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>

      <GlassCard title="Security updates" icon={<ShieldCheck className="h-4 w-4" />}>
        {extensions.filter((e) => str(e["compatibility"]) !== "compatible").length === 0 ? (
          <EmptyState message="No extension is flagged for a security or compatibility upgrade." />
        ) : (
          <ul className="space-y-2">
            {extensions
              .filter((e) => str(e["compatibility"]) !== "compatible")
              .map((e) => (
                <li
                  key={str(e["id"])}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 p-3 text-sm"
                >
                  <span className="font-medium">{str(e["name"])}</span>
                  <span className="text-xs text-muted-foreground">
                    {str(e["version"])} → {str(e["latest_version"])} · needs platform {str(e["min_platform_version"])}
                  </span>
                  <StatusBadge value={str(e["compatibility"])} />
                </li>
              ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}

/* ------------------------------- Publishers ------------------------------ */

function PublishersTab({ extensions }: { extensions: Row[] }) {
  const publishers = useMemo(() => {
    const map = new Map<string, { vendor: string; rows: Row[] }>();
    for (const e of extensions) {
      const key = str(e["vendor"]);
      const entry = map.get(key) ?? { vendor: key, rows: [] };
      entry.rows.push(e);
      map.set(key, entry);
    }
    return Array.from(map.values()).sort((a, b) => a.vendor.localeCompare(b.vendor));
  }, [extensions]);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {publishers.map((p) => {
        const first = p.rows[0]!;
        return (
          <GlassCard key={p.vendor}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{p.vendor}</p>
                <p className="text-xs text-muted-foreground">{p.rows.length} extension(s)</p>
              </div>
              {first["is_official"] ? (
                <Badge variant="outline" className="gap-1 text-[10px]">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </Badge>
              ) : null}
            </div>
            <dl className="mt-3">
              <DetailRow label="Support" value={str(first["publisher_email"]) || "—"} />
              <DetailRow label="License" value={str(first["license"])} />
              <DetailRow
                label="Website"
                value={
                  first["publisher_url"] ? (
                    <a
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                      href={str(first["publisher_url"])}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Visit <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
            </dl>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.rows.map((r) => (
                <Badge key={str(r["id"])} variant="secondary" className="text-[10px]">
                  {str(r["name"])}
                </Badge>
              ))}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

/* -------------------------------- Activity ------------------------------- */

function ActivityTab({ events, extById }: { events: Row[]; extById: Map<string, Row> }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (status !== "all" && str(e["status"]) !== status) return false;
      if (!q) return true;
      const name = str(extById.get(str(e["extension_id"]))?.["name"]).toLowerCase();
      return [name, str(e["event_type"]).toLowerCase(), str(e["message"]).toLowerCase()].some((v) => v.includes(q));
    });
  }, [events, query, status, extById]);

  const paged = usePaged(rows, 12);

  return (
    <GlassCard
      title="Extension activity"
      icon={<ScrollText className="h-4 w-4" />}
      actions={
        <Button variant="outline" size="sm" onClick={() => downloadRows("extension-events.csv", rows)} disabled={!rows.length}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> Export
        </Button>
      }
    >
      <Toolbar>
        <SearchField value={query} onChange={setQuery} label="Search activity" placeholder="Search events…" />
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All statuses" },
            { value: "success", label: "Success" },
            { value: "error", label: "Error" },
            { value: "warning", label: "Warning" },
          ]}
        />
      </Toolbar>

      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState message="No activity matches these filters." />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Extension</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="text-right">Latency</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.rows.map((e) => (
                <TableRow key={str(e["id"])}>
                  <TableCell className="font-medium">
                    {str(extById.get(str(e["extension_id"]))?.["name"] ?? "—")}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{str(e["event_type"])}</TableCell>
                  <TableCell className="max-w-[320px] truncate text-muted-foreground">{str(e["message"])}</TableCell>
                  <TableCell className="text-right">{Number(e["latency_ms"] ?? 0)} ms</TableCell>
                  <TableCell className="text-right">
                    <StatusBadge value={str(e["status"])} />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{when(e["occurred_at"] as string)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pager page={paged.page} pageCount={paged.pageCount} total={paged.total} onPage={paged.setPage} unit="events" />
        </div>
      )}
    </GlassCard>
  );
}

/* ------------------------------ Detail sheet ----------------------------- */

function DetailSheet({
  row,
  install,
  versions,
  events,
  onClose,
}: {
  row: Row | null;
  install?: Row | undefined;
  versions: Row[];
  events: Row[];
  onClose: () => void;
}) {
  return (
    <Sheet open={!!row} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {row ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {str(row["name"])}
                <StatusBadge value={str(row["status"])} />
              </SheetTitle>
              <SheetDescription>{str(row["description"])}</SheetDescription>
            </SheetHeader>

            <dl className="mt-4">
              <DetailRow label="Publisher" value={str(row["vendor"])} />
              <DetailRow label="Category" value={str(row["category"])} />
              <DetailRow label="Installed version" value={str(row["version"])} />
              <DetailRow label="Latest version" value={str(row["latest_version"])} />
              <DetailRow label="Compatibility" value={<StatusBadge value={str(row["compatibility"])} />} />
              <DetailRow label="Min platform" value={str(row["min_platform_version"])} />
              <DetailRow label="License" value={str(row["license"])} />
              <DetailRow
                label="Price"
                value={Number(row["price_usd_month"] ?? 0) > 0 ? `${usd(Number(row["price_usd_month"]))}/mo` : "Included"}
              />
              <DetailRow label="Rating" value={`${Number(row["rating"] ?? 0)} / 5`} />
              <DetailRow label="Installs" value={Number(row["install_count"] ?? 0)} />
              <DetailRow label="Base URL" value={<span className="font-mono text-xs">{str(row["base_url"]) || "—"}</span>} />
              <DetailRow label="Webhook" value={<span className="font-mono text-xs">{str(row["webhook_url"]) || "—"}</span>} />
              <DetailRow label="Install status" value={install ? <StatusBadge value={str(install["status"])} /> : "Not installed"} />
            </dl>

            <div className="mt-4">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Scopes</p>
              <div className="flex flex-wrap gap-1.5">
                {arr(row["scopes"]).map((s) => (
                  <Badge key={s} variant="secondary" className="text-[10px]">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Releases</p>
              {versions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No releases recorded.</p>
              ) : (
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {versions.map((v) => (
                    <li key={str(v["id"])} className="flex justify-between gap-2">
                      <span className="font-mono">{str(v["version"])}</span>
                      <span>{when(v["released_at"] as string)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent events</p>
              {events.length === 0 ? (
                <p className="text-xs text-muted-foreground">No events recorded.</p>
              ) : (
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {events.map((e) => (
                    <li key={str(e["id"])} className="flex justify-between gap-2">
                      <span className="truncate">{str(e["event_type"])}</span>
                      <span>{when(e["occurred_at"] as string)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {row["docs_url"] ? (
                <Button asChild size="sm" variant="outline">
                  <a href={str(row["docs_url"])} target="_blank" rel="noreferrer">
                    Documentation <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </a>
                </Button>
              ) : null}
              {row["support_url"] ? (
                <Button asChild size="sm" variant="outline">
                  <a href={str(row["support_url"])} target="_blank" rel="noreferrer">
                    Support <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </a>
                </Button>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
