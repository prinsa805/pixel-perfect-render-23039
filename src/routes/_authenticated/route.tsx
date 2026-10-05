import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BarChart3, BookOpen, ChartNoAxesCombined, LogOut, Plus, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Glow, Logo } from "@/components/Glow";
import { profileQuery } from "@/lib/trades";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppShell,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/trades", label: "Trades", icon: BookOpen },
  { to: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function IstClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const f = () =>
      setT(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }));
    f();
    const id = setInterval(f, 30000);
    return () => clearInterval(id);
  }, []);
  const [h, m] = t.split(":").map(Number);
  const mins = (h ?? 0) * 60 + (m ?? 0);
  const day = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", weekday: "short" });
  const open = !["Sat", "Sun"].includes(day) && mins >= 555 && mins <= 930;
  return (
    <div className="hidden items-center gap-2 border border-border bg-primary/5 px-3 py-2 font-mono md:flex">
      <span className={`size-1.5 rounded-full ${open ? "animate-pulse bg-up" : "bg-muted-foreground"}`} />
      <span className="text-xs text-muted-foreground">NSE {open ? "Open" : "Closed"} · {t} IST</span>
    </div>
  );
}

function AppShell() {
  const { data: profile } = useQuery(profileQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const initials = (profile?.display_name ?? "T").slice(0, 2).toUpperCase();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    await router.invalidate();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="scanlines relative min-h-screen overflow-hidden p-2 sm:p-4">
      <Glow />
      <div className="terminal-frame relative mx-auto min-h-[calc(100vh-1rem)] max-w-[1600px] bg-background/95 sm:min-h-[calc(100vh-2rem)]">
        <div className="flex h-7 items-center justify-between border-b border-border bg-primary/5 px-3 font-mono text-[8px] uppercase text-muted-foreground sm:px-5"><span>ALCOVE // COMMAND_DECK</span><span className="hidden sm:block">SECURE SESSION · CLOUD SYNC ACTIVE</span></div>
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
          <Link to="/dashboard"><Logo /></Link>
          <nav className="order-3 flex w-full items-center overflow-x-auto border border-border font-mono text-[10px] uppercase md:order-none md:w-auto">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="flex items-center gap-2 whitespace-nowrap border-r border-border px-4 py-2.5 text-muted-foreground last:border-r-0 hover:bg-primary/5 hover:text-foreground"
                activeProps={{ className: "bg-primary/10 !text-primary font-medium" }}
              >
                <n.icon className="size-3.5" />{n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <IstClock />
            <Link to="/trades/new" className="hidden items-center gap-1 bg-cta px-4 py-2 font-mono text-[10px] font-semibold uppercase sm:inline-flex">
              <Plus className="size-4" /> New Entry
            </Link>
            <div className="grid size-9 place-items-center border border-primary/40 bg-primary/10 font-mono text-xs font-bold text-primary">{initials}</div>
            <button onClick={signOut} aria-label="Sign out" className="border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <LogOut className="size-4" />
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-6"><Outlet /></main>
        <div className="flex h-6 items-center justify-between border-t border-border bg-primary/5 px-3 font-mono text-[8px] uppercase text-muted-foreground"><span>USER: {initials} · STATUS: AUTHENTICATED</span><span>REGION: NSE/BSE · GMT+5:30</span></div>
      </div>
    </div>
  );
}
