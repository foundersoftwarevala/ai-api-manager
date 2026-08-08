import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  Bell,
  ChevronDown,
  Menu,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MANAGER_NAV, findGroup } from "@/lib/manager-nav";
import { inr, num } from "@/components/manager/primitives";
import { useManyRecords } from "@/lib/manager-queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/manager")({
  component: ManagerLayout,
});

function NavTree({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const activeSection = location.pathname.split("/")[2] ?? "dashboard";
  const activeView = (location.search as { view?: string })?.view;
  const [open, setOpen] = useState<string[]>([findGroup(activeSection)?.id ?? "dashboard"]);

  const toggle = (id: string) =>
    setOpen((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <nav className="space-y-1 p-3">
      {MANAGER_NAV.map((group) => {
        const isActive = activeSection === group.id;
        const isOpen = open.includes(group.id);
        const Icon = group.icon;
        return (
          <div key={group.id}>
            <div className="flex items-center gap-1">
              <Link
                to="/manager/$section"
                params={{ section: group.id }}
                onClick={onNavigate}
                className={cn(
                  "flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{group.label}</span>
              </Link>
              <button
                type="button"
                aria-label={`Toggle ${group.label}`}
                onClick={() => toggle(group.id)}
                className="rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
                />
              </button>
            </div>
            {isOpen ? (
              <div className="mt-1 ml-4 space-y-0.5 border-l border-sidebar-border pl-2">
                {group.children.map((child) => {
                  const ChildIcon = child.icon;
                  const childActive = isActive && activeView === child.id;
                  return (
                    <Link
                      key={child.id}
                      to="/manager/$section"
                      params={{ section: group.id }}
                      search={{ view: child.id }}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                        childActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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
  );
}

function TopBar() {
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

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 bg-sidebar p-0">
          <SheetTitle className="px-4 pt-4 text-sm">AI API Manager</SheetTitle>
          <ScrollArea className="h-[calc(100vh-3rem)]">
            <NavTree />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-gradient-to-br from-primary to-neon-violet p-1.5">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-sm font-bold text-foreground">Software Vala</p>
          <p className="text-[10px] text-muted-foreground">AI API Manager</p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 text-xs">
        <Badge variant="outline" className="hidden gap-1 border-status-success/40 text-status-success sm:flex">
          <Activity className="h-3 w-3" /> {num(stats.online)}/{num(stats.total)} online
        </Badge>
        <Badge variant="outline" className="hidden gap-1 border-neon-cyan/40 text-neon-cyan md:flex">
          <Wallet className="h-3 w-3" /> {inr(stats.balance)}
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            "gap-1",
            stats.alerts > 0
              ? "border-status-error/40 text-status-error"
              : "border-border/60 text-muted-foreground",
          )}
        >
          <Bell className="h-3 w-3" /> {num(stats.alerts)}
        </Badge>
        {stats.frozen ? (
          <Badge variant="outline" className="gap-1 border-status-error/40 text-status-error">
            <ShieldCheck className="h-3 w-3" /> Controls engaged
          </Badge>
        ) : null}
      </div>
    </header>
  );
}

function ManagerLayout() {
  return (
    <div className="min-h-screen bg-background bg-aurora-mesh text-foreground">
      <TopBar />
      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 border-r border-sidebar-border bg-sidebar/70 backdrop-blur-xl lg:block">
          <ScrollArea className="h-full">
            <NavTree />
          </ScrollArea>
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
