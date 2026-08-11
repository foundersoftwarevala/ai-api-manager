import { useEffect, useMemo, useState } from "react";
import { Cloud, Copy, FileText, FlaskConical, Play, Webhook } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import {
  EmptyState,
  ErrorState,
  GlassCard,
  LoadingBlock,
  PageHeader,
  StatusBadge,
  usd,
  when,
} from "@/components/manager/primitives";
import { FilterSelect, Pager, SearchField, Toolbar, usePaged } from "@/components/manager/data-ui";
import { useManyRecords, useModelTest, type Row } from "@/lib/manager-queries";

const SUBSECTIONS = ["dev-playground", "dev-docs", "dev-webhooks", "dev-environments"];
const str = (v: unknown) => String(v ?? "");

export default function DeveloperScreen({ view }: { view?: string | undefined }) {
  const initial = view && SUBSECTIONS.includes(view) ? view : "dev-playground";
  const [tab, setTab] = useState(initial);
  useEffect(() => {
    if (view && SUBSECTIONS.includes(view)) setTab(view);
  }, [view]);

  const many = useManyRecords([
    { table: "ai_models", orderBy: "name", ascending: true, limit: 300 },
    { table: "api_services", orderBy: "name", ascending: true, limit: 300 },
    { table: "ai_decision_logs", orderBy: "created_at", ascending: false, limit: 100 },
    { table: "extensions", orderBy: "name", ascending: true, limit: 200 },
    { table: "extension_events", orderBy: "occurred_at", ascending: false, limit: 200 },
    { table: "api_keys", orderBy: "created_at", ascending: false, limit: 300 },
    { table: "rate_limits", limit: 200 },
  ]);

  const [models = [], services = [], decisions = [], extensions = [], extEvents = [], keys = [], limits = []] =
    many.data ?? [];

  const header = (
    <PageHeader
      title="Developer & Docs"
      eyebrow="Developer"
      icon={<FlaskConical className="h-5 w-5" />}
      description="Test live models, browse generated API documentation, inspect webhook deliveries and review per-environment configuration."
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
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="dev-playground" className="gap-1.5"><Play className="h-3.5 w-3.5" />Playground</TabsTrigger>
          <TabsTrigger value="dev-docs" className="gap-1.5"><FileText className="h-3.5 w-3.5" />API Documentation</TabsTrigger>
          <TabsTrigger value="dev-webhooks" className="gap-1.5"><Webhook className="h-3.5 w-3.5" />Webhooks & Events</TabsTrigger>
          <TabsTrigger value="dev-environments" className="gap-1.5"><Cloud className="h-3.5 w-3.5" />Environments</TabsTrigger>
        </TabsList>

        <TabsContent value="dev-playground">
          <Playground models={models} decisions={decisions} />
        </TabsContent>
        <TabsContent value="dev-docs">
          <ApiDocs services={services} />
        </TabsContent>
        <TabsContent value="dev-webhooks">
          <WebhookEvents extensions={extensions} events={extEvents} />
        </TabsContent>
        <TabsContent value="dev-environments">
          <Environments keys={keys} limits={limits} services={services} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Playground({ models, decisions }: { models: Row[]; decisions: Row[] }) {
  const [modelId, setModelId] = useState(str(models[0]?.["id"] ?? ""));
  const [prompt, setPrompt] = useState("Summarise the health of our payment APIs in two sentences.");
  const test = useModelTest();

  if (models.length === 0) return <EmptyState message="No AI models registered yet." />;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GlassCard title="Live model test" icon={<Play className="h-4 w-4" />}>
        <Toolbar>
          <FilterSelect
            label="Model"
            value={modelId}
            onChange={setModelId}
            options={models.map((m) => ({ value: str(m["id"]), label: str(m["name"]) }))}
          />
        </Toolbar>
        <label htmlFor="dev-prompt" className="mt-4 mb-1.5 block text-xs text-muted-foreground">
          Prompt
        </label>
        <Textarea id="dev-prompt" rows={6} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <Button
          className="mt-3"
          size="sm"
          disabled={!prompt.trim() || test.isPending}
          onClick={() => test.mutate({ modelRowId: modelId, prompt })}
        >
          {test.isPending ? "Running…" : "Run request"}
        </Button>

        {test.isPending ? <div className="mt-4"><LoadingBlock rows={3} /></div> : null}
        {test.error ? <div className="mt-4"><ErrorState error={test.error} /></div> : null}
        {test.data ? (
          <div className="mt-4 rounded-xl border border-border p-4">
            <div className="mb-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{test.data.model}</Badge>
              <Badge variant="outline">{test.data.latencyMs} ms</Badge>
              <Badge variant="outline">{test.data.tokensIn + test.data.tokensOut} tokens</Badge>
              <Badge variant="outline">{usd(test.data.costUsd)}</Badge>
            </div>
            <p className="whitespace-pre-wrap text-sm">{test.data.reply}</p>
          </div>
        ) : null}
      </GlassCard>

      <GlassCard title="Recent AI decisions" icon={<FlaskConical className="h-4 w-4" />}>
        {decisions.length === 0 ? (
          <EmptyState message="No AI calls logged yet — run a request to populate this feed." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Decision</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                  <TableHead className="text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decisions.slice(0, 10).map((d) => (
                  <TableRow key={str(d["id"])}>
                    <TableCell className="max-w-[260px] truncate">{str(d["decision"] ?? d["action"] ?? d["rationale"])}</TableCell>
                    <TableCell className="text-right">{Number(d["latency_ms"] ?? 0)} ms</TableCell>
                    <TableCell className="text-right text-muted-foreground">{when(d["created_at"] as string)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function ApiDocs({ services }: { services: Row[] }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) =>
      [s["name"], s["slug"], s["category"], s["endpoint_url"]].map((v) => str(v).toLowerCase()).some((v) => v.includes(q)),
    );
  }, [services, query]);
  const paged = usePaged(rows, 6);

  return (
    <div className="space-y-4">
      <Toolbar>
        <SearchField value={query} onChange={setQuery} label="Search endpoints" placeholder="Search services and endpoints…" />
      </Toolbar>
      {rows.length === 0 ? (
        <EmptyState message="No services match this search." />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {paged.rows.map((s) => {
              const url = str(s["endpoint_url"]) || "—";
              const snippet = `curl -X GET "${url}" \\\n  -H "Authorization: Bearer $SV_API_KEY" \\\n  -H "Accept: application/json"`;
              return (
                <GlassCard key={str(s["id"])}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{str(s["name"])}</p>
                      <p className="text-xs text-muted-foreground">
                        {str(s["category"])} · v{str(s["version"])} · owned by {str(s["owner_team"])}
                      </p>
                    </div>
                    <StatusBadge value={str(s["status"])} />
                  </div>
                  <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-muted/20 p-3 text-[11px] leading-relaxed">
                    {snippet}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => {
                      void navigator.clipboard.writeText(snippet);
                      toast.success("Request snippet copied");
                    }}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy snippet
                  </Button>
                </GlassCard>
              );
            })}
          </div>
          <Pager page={paged.page} pageCount={paged.pageCount} total={paged.total} onPage={paged.setPage} unit="services" />
        </>
      )}
    </div>
  );
}

function WebhookEvents({ extensions, events }: { extensions: Row[]; events: Row[] }) {
  const rows = extensions.filter((e) => e["webhook_url"]);
  return (
    <div className="space-y-6">
      <GlassCard title="Registered webhook endpoints" icon={<Webhook className="h-4 w-4" />}>
        {rows.length === 0 ? (
          <EmptyState message="No webhook endpoints registered." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((e) => (
                  <TableRow key={str(e["id"])}>
                    <TableCell className="font-medium">{str(e["name"])}</TableCell>
                    <TableCell className="max-w-[340px] truncate font-mono text-xs text-muted-foreground">
                      {str(e["webhook_url"])}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge value={str(e["status"])} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>

      <GlassCard title="Recent deliveries" icon={<Webhook className="h-4 w-4" />}>
        {events.length === 0 ? (
          <EmptyState message="No webhook deliveries recorded." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.slice(0, 12).map((e) => (
                  <TableRow key={str(e["id"])}>
                    <TableCell className="font-mono text-xs">{str(e["event_type"])}</TableCell>
                    <TableCell className="max-w-[280px] truncate text-muted-foreground">{str(e["message"])}</TableCell>
                    <TableCell className="text-right">{Number(e["latency_ms"] ?? 0)} ms</TableCell>
                    <TableCell className="text-right">
                      <StatusBadge value={str(e["status"])} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{when(e["occurred_at"] as string)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function Environments({ keys, limits, services }: { keys: Row[]; limits: Row[]; services: Row[] }) {
  const envs = useMemo(() => Array.from(new Set(keys.map((k) => str(k["environment"])))).sort(), [keys]);
  const serviceName = useMemo(() => new Map(services.map((s) => [str(s["id"]), str(s["name"])])), [services]);

  if (envs.length === 0) return <EmptyState message="No API keys registered yet." />;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {envs.map((env) => {
        const envKeys = keys.filter((k) => str(k["environment"]) === env);
        const active = envKeys.filter((k) => str(k["status"]) === "active").length;
        return (
          <GlassCard key={env} title={env} icon={<Cloud className="h-4 w-4" />}>
            <p className="text-sm text-muted-foreground">
              {envKeys.length} key(s) · {active} active
            </p>
            <ul className="mt-3 space-y-1.5 text-xs">
              {envKeys.slice(0, 6).map((k) => (
                <li key={str(k["id"])} className="flex items-center justify-between gap-2">
                  <span className="truncate">{str(k["label"])}</span>
                  <span className="font-mono text-muted-foreground">
                    {str(k["key_prefix"])}…{str(k["last_four"])}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              {limits.filter((l) => serviceName.has(str(l["service_id"]))).length} rate-limit policies applied
            </p>
          </GlassCard>
        );
      })}
    </div>
  );
}
