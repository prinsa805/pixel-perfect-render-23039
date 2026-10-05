import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { groupBy, tradesQuery } from "@/lib/trades";
import { fmtINR, fmtSigned } from "@/lib/format";
import { EmptyState } from "@/components/Kpi";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Alcove" }, { name: "description", content: "Breakdown of your trading performance." }] }),
  component: Analytics,
});

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Breakdown({ title, data }: { title: string; data: { name: string; pnl: number; count: number; winRate: number }[] }) {
  return (
    <section className="glass-panel p-6">
      <div className="mb-4 text-sm font-semibold">{title}</div>
      {data.length ? (
        <>
          <ResponsiveContainer width="100%" height={Math.max(140, data.length * 36)}>
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={130} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "var(--glass)" }} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [fmtINR(v), "Net P&L"]} />
              <Bar dataKey="pnl" radius={4}>
                {data.map((d) => <Cell key={d.name} fill={d.pnl >= 0 ? "var(--up)" : "var(--down)"} fillOpacity={0.7} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1 font-mono text-xs">
            {data.map((d) => (
              <div key={d.name} className="flex justify-between text-muted-foreground">
                <span>{d.name}</span>
                <span>{d.count} trades · {d.winRate}% win · <span className={d.pnl >= 0 ? "text-up" : "text-down"}>{fmtSigned(d.pnl)}</span></span>
              </div>
            ))}
          </div>
        </>
      ) : <div className="text-sm text-muted-foreground">No data</div>}
    </section>
  );
}

function Analytics() {
  const { data: trades = [], isLoading } = useQuery(tradesQuery);
  const g = useMemo(() => ({
    segment: groupBy(trades, (t) => t.segment),
    symbol: groupBy(trades, (t) => t.symbol).slice(0, 10),
    strategy: groupBy(trades, (t) => t.strategy ?? "Untagged"),
    session: groupBy(trades, (t) => t.session),
    day: groupBy(trades, (t) => DAYS[new Date(t.trade_date + "T00:00:00").getDay()] ?? ""),
    direction: groupBy(trades, (t) => t.direction),
    emotion: groupBy(trades, (t) => t.emotion ?? "Not logged"),
    month: groupBy(trades, (t) => t.trade_date.slice(0, 7)).sort((a, b) => a.name.localeCompare(b.name)),
  }), [trades]);

  if (isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!trades.length) return <EmptyState>Log some trades to unlock analytics. <Link to="/trades/new" className="text-primary hover:underline">Add trade</Link></EmptyState>;

  return (
    <div className="space-y-5">
      <section className="glass-panel p-6">
        <div className="mb-4 text-sm font-semibold">Monthly P&amp;L</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={g.month}>
            <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => fmtINR(v)} width={80} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: "var(--glass)" }} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [fmtINR(v), "Net P&L"]} />
            <Bar dataKey="pnl" radius={4}>{g.month.map((d) => <Cell key={d.name} fill={d.pnl >= 0 ? "var(--up)" : "var(--down)"} fillOpacity={0.7} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <Breakdown title="By Segment" data={g.segment} />
        <Breakdown title="By Strategy" data={g.strategy} />
        <Breakdown title="Top Symbols" data={g.symbol} />
        <Breakdown title="By Session (IST)" data={g.session} />
        <Breakdown title="By Weekday" data={g.day} />
        <Breakdown title="Long vs Short" data={g.direction} />
        <Breakdown title="By Emotion" data={g.emotion} />
      </div>
    </div>
  );
}
