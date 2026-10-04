import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtINR } from "@/lib/format";

type Pt = { idx: number; date: string; equity: number; peak: number; drawdown: number };

export function EquityChart({ data, height = 260 }: { data: Pt[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--up)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--up)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={40} />
        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} width={80} tickFormatter={(v) => fmtINR(v)} domain={["auto", "auto"]} />
        <Tooltip
          contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
          formatter={(v: number, n: string) => [fmtINR(v), n === "equity" ? "Balance" : n === "peak" ? "High-water mark" : "Drawdown"]}
        />
        <Area type="monotone" dataKey="equity" stroke="var(--up)" strokeWidth={2} fill="url(#eq)" />
        <Line type="monotone" dataKey="peak" stroke="var(--amber)" strokeDasharray="4 4" dot={false} strokeWidth={1} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DrawdownChart({ data }: { data: Pt[] }) {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
        <XAxis dataKey="date" hide />
        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} width={80} tickFormatter={(v) => fmtINR(v)} />
        <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [fmtINR(v), "Drawdown"]} />
        <Area type="monotone" dataKey="drawdown" stroke="var(--down)" fill="var(--down)" fillOpacity={0.2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
