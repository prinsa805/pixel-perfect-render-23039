import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Activity, Flame, Percent, Scale, Snowflake, Target, TrendingDown, TrendingUp, Trophy, Wallet, XCircle, CheckCircle2 } from "lucide-react";
import { computeStats, filterRange, netPnl, profileQuery, RANGES, rMultiple, tradesQuery, isClosed, type Range } from "@/lib/trades";
import { fmtINR, fmtNum, fmtPct, fmtSigned } from "@/lib/format";
import { Kpi, EmptyState } from "@/components/Kpi";
import { EquityChart, DrawdownChart } from "@/components/EquityChart";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Alcove" }, { name: "description", content: "Your trading performance overview in rupees." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: trades = [], isLoading } = useQuery(tradesQuery);
  const { data: profile } = useQuery(profileQuery);
  const [range, setRange] = useState<Range>("All");
  const capital = Number(profile?.starting_capital ?? 500000);
  const filtered = useMemo(() => filterRange(trades, range), [trades, range]);
  const s = useMemo(() => computeStats(filtered, capital), [filtered, capital]);
  const all = useMemo(() => computeStats(trades, capital), [trades, capital]);

  const last30 = useMemo(() => {
    const m = new Map<string, number>();
    trades.filter(isClosed).forEach((t) => m.set(t.trade_date, (m.get(t.trade_date) ?? 0) + netPnl(t)));
    return [...m.entries()].slice(-20);
  }, [trades]);
  const maxAbs = Math.max(1, ...last30.map(([, v]) => Math.abs(v)));

  if (isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!trades.length)
    return (
      <EmptyState>
        No trades yet. <Link to="/trades/new" className="text-primary hover:underline">Log your first trade</Link> to see your stats.
      </EmptyState>
    );

  const recent = [...trades].reverse().slice(0, 6);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-12 gap-5">
        <div className="col-span-12 grid grid-cols-1 gap-5 sm:grid-cols-3 lg:col-span-8">
          <Kpi label="Account Equity" icon={Wallet} value={fmtINR(all.equity)} sub={<span className={all.net >= 0 ? "text-up" : "text-down"}>{fmtSigned(all.net)} · {fmtPct(all.returnPct, 2)}</span>} />
          <Kpi label="Win Rate" icon={Percent} value={fmtPct(s.winRate)} sub={`${s.wins}W · ${s.losses}L · ${s.total} trades`} />
          <Kpi label="Profit Factor" icon={Scale} tone="accent" value={fmtNum(s.profitFactor)} sub={`R:R ${fmtNum(s.rr)}`} />
        </div>
        <div className="glass-panel col-span-12 p-5 lg:col-span-4">
          <div className="flex items-center justify-between">
            <div className="label-caps">Daily P&amp;L</div>
            <span className="font-mono text-xs text-muted-foreground">last {last30.length} days</span>
          </div>
          <div className="mt-4 flex h-24 items-end gap-1.5">
            {last30.map(([d, v]) => (
              <div key={d} title={`${d}: ${fmtSigned(v)}`} className={`flex-1 rounded-t ${v >= 0 ? "bg-up/50" : "bg-down/50"}`} style={{ height: `${Math.max(6, (Math.abs(v) / maxAbs) * 100)}%` }} />
            ))}
          </div>
        </div>
      </section>

      <section className="glass-panel p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Equity Curve</div>
            <div className="text-xs text-muted-foreground">balance · <span className="text-amber">high-water mark</span> · drawdown</div>
          </div>
          <div className="flex flex-wrap gap-1 text-xs">
            {RANGES.map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`rounded-full px-3 py-1 ${range === r ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{r}</button>
            ))}
          </div>
        </div>
        {s.curve.length ? (
          <>
            <EquityChart data={s.curve} />
            <div className="label-caps mt-4 mb-1">Drawdown</div>
            <DrawdownChart data={s.curve} />
          </>
        ) : (
          <div className="py-16 text-center text-sm text-muted-foreground">No closed trades in this period.</div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        <Kpi label="Total Trades" icon={Activity} value={s.total} sub={s.open ? `${s.open} open` : undefined} />
        <Kpi label="Winning Trades" icon={CheckCircle2} tone="up" value={s.wins} />
        <Kpi label="Losing Trades" icon={XCircle} tone="down" value={s.losses} />
        <Kpi label="Net P&L" icon={s.net >= 0 ? TrendingUp : TrendingDown} tone={s.net >= 0 ? "up" : "down"} value={fmtSigned(s.net)} />
        <Kpi label="Avg Profit / Trade" icon={TrendingUp} tone="up" value={fmtINR(s.avgWin)} />
        <Kpi label="Avg Loss / Trade" icon={TrendingDown} tone="down" value={fmtINR(s.avgLoss)} />
        <Kpi label="Risk / Reward" icon={Target} value={`1 : ${fmtNum(s.rr)}`} />
        <Kpi label="Max Drawdown" icon={TrendingDown} tone="down" value={fmtINR(s.maxDD)} sub={fmtPct(s.maxDDPct, 2)} />
        <Kpi label="Win Streak" icon={Flame} tone="up" value={s.winStreak} sub="current" />
        <Kpi label="Loss Streak" icon={Snowflake} tone="down" value={s.lossStreak} sub="current" />
        <Kpi label="Best Trade" icon={Trophy} tone="up" value={fmtSigned(s.best)} />
        <Kpi label="Worst Trade" icon={XCircle} tone="down" value={fmtSigned(s.worst)} />
      </section>

      <section className="glass-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="text-sm font-semibold">Recent Trades</div>
          <Link to="/trades" className="text-xs text-muted-foreground hover:text-foreground">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <tbody className="divide-y divide-border">
              {recent.map((t) => {
                const p = netPnl(t), r = rMultiple(t);
                return (
                  <tr key={t.id} className="hover:bg-glass">
                    <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground">{t.trade_date}</td>
                    <td className="px-6 py-3.5 font-medium">{t.symbol} <span className="text-xs text-muted-foreground">{t.exchange}</span></td>
                    <td className="px-6 py-3.5 text-xs text-muted-foreground">{t.segment}</td>
                    <td className={`px-6 py-3.5 text-xs ${t.direction === "Long" ? "text-up" : "text-down"}`}>{t.direction}</td>
                    <td className={`px-6 py-3.5 text-right font-mono ${p >= 0 ? "text-up" : "text-down"}`}>{isClosed(t) ? fmtSigned(p) : "Open"}</td>
                    <td className="px-6 py-3.5 text-right font-mono text-xs text-muted-foreground">{r != null ? `${r >= 0 ? "+" : ""}${r.toFixed(1)}R` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
