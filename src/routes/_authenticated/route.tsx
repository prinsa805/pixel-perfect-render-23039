import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LogOut, Plus } from "lucide-react";
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
  { to: "/dashboard", label: "Dashboard" },
  { to: "/trades", label: "Trades" },
  { to: "/analytics", label: "Analytics" },
  { to: "/settings", label: "Settings" },
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
    <div className="hidden items-center gap-2 rounded-full border border-border bg-glass px-3 py-2 md:flex">
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
    <div className="relative min-h-screen overflow-hidden">
      <Glow />
      <div className="relative mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link to="/dashboard"><Logo /></Link>
          <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto text-sm md:order-none md:w-auto">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="whitespace-nowrap rounded-full px-4 py-2 text-muted-foreground hover:text-foreground"
                activeProps={{ className: "bg-secondary !text-foreground font-medium" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <IstClock />
            <Link to="/trades/new" className="hidden items-center gap-1 rounded-full bg-cta px-4 py-2 text-sm font-semibold sm:inline-flex">
              <Plus className="size-4" /> Add Trade
            </Link>
            <div className="grid size-9 place-items-center rounded-full bg-logo text-xs font-bold text-primary-foreground ring-1 ring-border">{initials}</div>
            <button onClick={signOut} aria-label="Sign out" className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <LogOut className="size-4" />
            </button>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
