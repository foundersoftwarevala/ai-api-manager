import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  ChevronDown,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import SchemaGuard from "@/components/manager/SchemaGuard";
import { MANAGER_NAV, findGroup } from "@/lib/manager-nav";
import { inr, num } from "@/components/manager/primitives";
import { useManyRecords } from "@/lib/manager-queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/manager")({
  component: ManagerLayout,
});

const COLLAPSE_KEY = "sv:manager:sidebar:collapsed";

function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () =>
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });

  return { collapsed, toggleCollapsed, mobileOpen, setMobileOpen };
}

function NavTree({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const activeSection = location.pathname.split("/")[2] ?? "dashboard";
  const activeView = (location.search as { view?: string })?.view;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MANAGER_NAV;
    return MANAGER_NAV.map((g) => ({
      ...g,
      children: g.children.filter(
        (c) => c.label.toLowerCase().includes(q) || g.label.toLowerCase().includes(q),
      ),
    })).filter((g) => g.children.length > 0 || g.label.toLowerCase().includes(q));
  }, [query]);

  const searching = query.trim().length > 0;
  const isOpen = (id: string) =>
    searching ? true : (openGroups[id] ?? (findGroup(activeSection)?.id ?? "dashboard") === id);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!collapsed ? (
        <div className="shrink-0 px-3 pt-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a module…"
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      ) : null}

      <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto px-2 py-3">
        {groups.map((group) => {
          const active = activeSection === group.id;
          const open = isOpen(group.id);
          const Icon = group.icon;
          return (
            <div key={group.id} className={cn(collapsed && "border-t border-border/60 pt-2 first:border-0")}>
              <div className="flex items-center gap-1">
                <Link
                  to="/manager/$section"
                  params={{ section: group.id }}
                  onClick={onNavigate}
                  title={group.label}
                  className={cn(
                    "group/item relative flex flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors duration-150",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-primary/18 font-medium text-foreground"
                      : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                  )}
                >
                  {active ? (
                    <span className="absolute bottom-1.5 left-0 top-1.5 w-[2px] rounded-full bg-primary" />
                  ) : null}
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed ? <span className="truncate">{group.label}</span> : null}
                </Link>
                {!collapsed ? (
                  <button
                    type="button"
                    aria-label={`Toggle ${group.label}`}
                    onClick={() => setOpenGroups((s) => ({ ...s, [group.id]: !open }))}
                    className="rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ChevronDown
                      className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")}
                    />
                  </button>
                ) : null}
              </div>

              {open && !collapsed ? (
                <div className="mt-0.5 space-y-0.5 pl-3.5">
                  {group.children.map((child) => {
                    const ChildIcon = child.icon;
                    const childActive = active && activeView === child.id;
                    return (
                      <Link
                        key={child.id}
                        to="/manager/$section"
                        params={{ section: group.id }}
                        search={{ view: child.id }}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors duration-150",
                          childActive
                            ? "bg-primary/12 font-medium text-foreground"
                            : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                        )}
                      >
                        <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

function SidebarContent({
  collapsed,
  onToggleCollapsed,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2 border-b border-border px-3",
          collapsed && "justify-center px-0",
        )}
      >
        <Link
          to="/manager/$section"
          params={{ section: "dashboard" }}
          onClick={onCloseMobile}
          className="flex min-w-0 items-center gap-2"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          {!collapsed ? (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold tracking-tight">Software Vala</span>
              <span className="block truncate text-[11px] text-muted-foreground">AI API Manager</span>
            </span>
          ) : null}
        </Link>
        {!collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="ml-auto hidden h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground lg:grid"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onCloseMobile}
          className="ml-auto grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {collapsed ? (
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="mx-auto mt-3 hidden h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground lg:grid"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      ) : null}

      <NavTree collapsed={collapsed} onNavigate={onCloseMobile} />
    </div>
  );
}

function StatusBar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { data } = useManyRecords([
    { table: "api_services", select: "id,status" },
    { table: "wallets", select: "id,name,balance,status" },
    { table: "security_alerts", select: "id,status", filters: [{ column: "status", value: "open" }] },
    { table: "emergency_controls", select: "id,engaged" },
  ]);

  const stats = useMemo(() => {
    const [services = [], wallets = [], alerts = [], controls = []] = data ?? [];
    const online = services.filter((s) => s['status'] === "active" || s['status'] === "healthy").length;
    const primary = wallets[0];
    return {
      online,
      total: services.length,
      balance: Number(primary?.['balance'] ?? 0),
      alerts: alerts.length,
      frozen: controls.some((c) => c['engaged']),
    };
  }, [data]);

  const ICON_BTN =
    "icon3d grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition-transform duration-200 hover:text-foreground active:scale-[0.96]";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-1.5 px-3 lg:px-5">
        <button
          type="button"
          className={cn(ICON_BTN, "lg:hidden")}
          aria-label="Open navigation"
          onClick={onOpenMobile}
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>

        <div className="flex-1" />

        <nav className="flex items-center gap-1.5 text-xs" aria-label="Status">
          <Badge variant="outline" className="hidden gap-1 border-status-success/40 text-status-success sm:flex">
            <Activity className="h-3 w-3" /> {num(stats.online)}/{num(stats.total)} online
          </Badge>
          <Badge variant="outline" className="hidden gap-1 border-primary-glow/40 text-primary-glow md:flex">
            <Wallet className="h-3 w-3" /> {inr(stats.balance)}
          </Badge>
          {stats.frozen ? (
            <Badge variant="outline" className="gap-1 border-status-error/40 text-status-error">
              <ShieldCheck className="h-3 w-3" /> Controls engaged
            </Badge>
          ) : null}

          <Link
            to="/manager/$section"
            params={{ section: "alerts" }}
            search={{ view: "alert-security" }}
            className={cn(ICON_BTN, "relative")}
            aria-label="Alerts"
          >
            <Bell className="h-[18px] w-[18px]" />
            {stats.alerts > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
                {stats.alerts}
              </span>
            ) : null}
          </Link>


          <span className="relative ml-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-[11px] font-bold text-primary-foreground ring-1 ring-white/15">
            SV
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent-emerald ring-2 ring-background" />
          </span>
        </nav>
      </div>
    </header>
  );

}

function ManagerLayout() {
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebarState();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-background/80 backdrop-blur-xl transition-[width] duration-200 lg:flex",
          collapsed ? "w-[72px]" : "w-[264px]",
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          onCloseMobile={() => setMobileOpen(false)}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu overlay"
          />
          <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-border bg-background shadow-2xl">
            <ScrollArea className="h-full">
              <SidebarContent
                collapsed={false}
                onToggleCollapsed={toggleCollapsed}
                onCloseMobile={() => setMobileOpen(false)}
              />
            </ScrollArea>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <StatusBar onOpenMobile={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <SchemaGuard />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
