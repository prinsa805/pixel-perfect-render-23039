import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isClosed, netPnl, rMultiple, tradesQuery, SEGMENTS, type Trade } from "@/lib/trades";
import { fmtINR2, fmtSigned } from "@/lib/format";
import { EmptyState } from "@/components/Kpi";

export const Route = createFileRoute("/_authenticated/trades/")({
  head: () => ({ meta: [{ title: "Trade Log — Alcove" }, { name: "description", content: "All your logged trades." }] }),
  component: TradesPage,
});

type Filter = "All" | "Winners" | "Losers" | "Open";

function toCsv(rows: Trade[]) {
  const cols = ["trade_date", "trade_time", "exchange", "symbol", "segment", "direction", "entry_price", "exit_price", "stop_loss", "take_profit", "quantity", "charges", "strategy", "notes"] as const;
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(",") + ",net_pnl_inr", ...rows.map((r) => cols.map((c) => esc(r[c])).join(",") + "," + netPnl(r).toFixed(2))].join("\n");
}

function TradesPage() {
  const { data: trades = [], isLoading } = useQuery(tradesQuery);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("All");
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState("");

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["trades"] }); toast.success("Trade deleted"); },
    onError: (e) => toast.error((e as Error).message),
  });

  const rows = useMemo(
    () =>
      [...trades].reverse().filter((t) => {
        if (q && !t.symbol.toLowerCase().includes(q.toLowerCase())) return false;
        if (seg && t.segment !== seg) return false;
        if (filter === "Open") return !isClosed(t);
        if (filter === "Winners") return isClosed(t) && netPnl(t) > 0;
        if (filter === "Losers") return isClosed(t) && netPnl(t) < 0;
        return true;
      }),
    [trades, filter, q, seg],
  );

  function exportCsv() {
    const blob = new Blob([toCsv(rows)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "alcove-trades.csv";
    a.click();
  }

  if (isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!trades.length) return <EmptyState>No trades yet. <Link to="/trades/new" className="text-primary hover:underline">Add a trade</Link>.</EmptyState>;

  const ctl = "rounded-lg border border-input bg-glass-strong px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary";

  return (
    <section className="glass-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <div className="text-sm font-semibold">Trade Log <span className="text-muted-foreground">· {rows.length}</span></div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input placeholder="Search symbol" value={q} onChange={(e) => setQ(e.target.value)} className={ctl} />
          <select value={seg} onChange={(e) => setSeg(e.target.value)} className={ctl}>
            <option value="">All segments</option>
            {SEGMENTS.map((s) => <option key={s}>{s}</option>)}
          </select>
          {(["All", "Winners", "Losers", "Open"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 ${filter === f ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{f}</button>
          ))}
          <button onClick={exportCsv} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-muted-foreground hover:text-foreground"><Download className="size-3" /> CSV</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <th className="px-6 py-2.5 font-normal">Date</th>
              <th className="px-4 py-2.5 font-normal">Instrument</th>
              <th className="px-4 py-2.5 font-normal">Segment</th>
              <th className="px-4 py-2.5 font-normal">Side</th>
              <th className="px-4 py-2.5 text-right font-normal">Qty</th>
              <th className="px-4 py-2.5 text-right font-normal">Entry</th>
              <th className="px-4 py-2.5 text-right font-normal">Exit</th>
              <th className="px-4 py-2.5 font-normal">Setup</th>
              <th className="px-4 py-2.5 text-right font-normal">Net P&amp;L</th>
              <th className="px-4 py-2.5 text-right font-normal">R</th>
              <th className="px-6 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((t) => {
              const p = netPnl(t), r = rMultiple(t);
              return (
                <tr key={t.id} className="hover:bg-glass">
                  <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{t.trade_date}{t.trade_time ? ` ${t.trade_time.slice(0, 5)}` : ""}</td>
                  <td className="px-4 py-3 font-medium">{t.symbol} <span className="text-xs text-muted-foreground">{t.exchange}</span></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.segment}</td>
                  <td className={`px-4 py-3 text-xs ${t.direction === "Long" ? "text-up" : "text-down"}`}>{t.direction}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{Number(t.quantity).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{fmtINR2(Number(t.entry_price))}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{t.exit_price != null ? fmtINR2(Number(t.exit_price)) : "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.strategy ?? "—"}</td>
                  <td className={`px-4 py-3 text-right font-mono ${!isClosed(t) ? "text-amber" : p >= 0 ? "text-up" : "text-down"}`}>{isClosed(t) ? fmtSigned(p) : "Open"}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">{r != null ? `${r >= 0 ? "+" : ""}${r.toFixed(1)}R` : "—"}</td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-1">
                      <Link to="/trades/new" search={{ id: t.id }} aria-label="Edit" className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"><Pencil className="size-3.5" /></Link>
                      <button aria-label="Delete" onClick={() => confirm(`Delete ${t.symbol} trade?`) && del.mutate(t.id)} className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-down"><Trash2 className="size-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
