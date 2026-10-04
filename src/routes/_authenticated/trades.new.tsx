import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { EMOTIONS, EXCHANGES, SEGMENTS, SESSIONS, STRATEGIES, SYMBOL_SUGGESTIONS, profileQuery, tradesQuery } from "@/lib/trades";
import { fmtINR2, fmtNum, fmtSigned } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/trades/new")({
  validateSearch: (s: Record<string, unknown>) => ({ id: typeof s.id === "string" ? s.id : undefined }),
  head: () => ({ meta: [{ title: "Add Trade — Alcove" }, { name: "description", content: "Log a new trade." }] }),
  component: AddTrade,
});

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const nowTime = () => new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });

const empty = {
  trade_date: today(), trade_time: nowTime(), exchange: "NSE", symbol: "", segment: "Equity Intraday", direction: "Long",
  session: SESSIONS[1] as string, entry_price: "", exit_price: "", stop_loss: "", take_profit: "", quantity: "",
  charges: "", strategy: "", emotion: "", mistakes: "", notes: "", rating: "",
};
type F = typeof empty;

const num = (v: string) => (v.trim() === "" ? null : Number(v));
const schema = z.object({
  symbol: z.string().trim().min(1, "Symbol is required").max(40),
  entry_price: z.number({ invalid_type_error: "Entry price is required" }).positive("Entry price must be positive"),
  quantity: z.number({ invalid_type_error: "Quantity is required" }).positive("Quantity must be positive"),
});

const inp = "mt-1 w-full rounded-lg border border-input bg-glass-strong px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="label-caps block">{label}{children}</label>;
}

function AddTrade() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: trades } = useQuery(tradesQuery);
  const { data: profile } = useQuery(profileQuery);
  const [f, setF] = useState<F>(empty);
  const set = (k: keyof F) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    const t = id && trades?.find((x) => x.id === id);
    if (!t) return;
    const s = (v: unknown) => (v == null ? "" : String(v));
    setF({
      trade_date: t.trade_date, trade_time: s(t.trade_time).slice(0, 5), exchange: t.exchange, symbol: t.symbol, segment: t.segment,
      direction: t.direction, session: t.session, entry_price: s(t.entry_price), exit_price: s(t.exit_price), stop_loss: s(t.stop_loss),
      take_profit: s(t.take_profit), quantity: s(t.quantity), charges: s(t.charges), strategy: s(t.strategy), emotion: s(t.emotion),
      mistakes: s(t.mistakes), notes: s(t.notes), rating: s(t.rating),
    });
  }, [id, trades]);

  const calc = useMemo(() => {
    const e = num(f.entry_price), x = num(f.exit_price), sl = num(f.stop_loss), tp = num(f.take_profit), q = num(f.quantity) ?? 0, c = num(f.charges) ?? 0;
    const sign = f.direction === "Short" ? -1 : 1;
    const gross = e != null && x != null ? (x - e) * sign * q : null;
    const net = gross != null ? gross - c : null;
    const risk = e != null && sl != null ? Math.abs(e - sl) * q : null;
    const reward = e != null && tp != null ? Math.abs(tp - e) * q : null;
    const cap = Number(profile?.starting_capital ?? 0);
    return {
      gross, net, risk, plannedRR: risk && reward ? reward / risk : null,
      r: net != null && risk ? net / risk : null,
      riskPct: risk && cap ? (risk / cap) * 100 : null,
      value: e != null ? e * q : null,
    };
  }, [f, profile]);

  const save = useMutation({
    mutationFn: async () => {
      const p = schema.safeParse({ symbol: f.symbol, entry_price: num(f.entry_price), quantity: num(f.quantity) });
      if (!p.success) throw new Error(p.error.issues[0].message);
      const row = {
        trade_date: f.trade_date, trade_time: f.trade_time || null, exchange: f.exchange, symbol: f.symbol.trim().toUpperCase(),
        segment: f.segment, direction: f.direction, session: f.session, entry_price: p.data.entry_price, exit_price: num(f.exit_price),
        stop_loss: num(f.stop_loss), take_profit: num(f.take_profit), quantity: p.data.quantity, charges: num(f.charges) ?? 0,
        strategy: f.strategy || null, emotion: f.emotion || null, mistakes: f.mistakes || null, notes: f.notes || null,
        rating: f.rating ? Number(f.rating) : null,
      };
      const { error } = id ? await supabase.from("trades").update(row).eq("id", id) : await supabase.from("trades").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trades"] });
      toast.success(id ? "Trade updated" : "Trade logged");
      navigate({ to: "/trades" });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid grid-cols-12 gap-5">
      <div className="col-span-12 space-y-5 lg:col-span-8">
        <section className="glass-panel p-6">
          <div className="mb-4 text-sm font-semibold">{id ? "Edit Trade" : "Add Trade"} · Basic</div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Field label="Date"><input type="date" className={inp} value={f.trade_date} onChange={set("trade_date")} required /></Field>
            <Field label="Time (IST)"><input type="time" className={inp} value={f.trade_time} onChange={set("trade_time")} /></Field>
            <Field label="Exchange"><select className={inp} value={f.exchange} onChange={set("exchange")}>{EXCHANGES.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Segment"><select className={inp} value={f.segment} onChange={set("segment")}>{SEGMENTS.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Symbol">
              <input list="symbols" className={inp} value={f.symbol} onChange={set("symbol")} placeholder="NIFTY 24500 CE" maxLength={40} />
              <datalist id="symbols">{SYMBOL_SUGGESTIONS.map((s) => <option key={s} value={s} />)}</datalist>
            </Field>
            <Field label="Direction">
              <div className="mt-1 grid grid-cols-2 gap-1 rounded-lg border border-input bg-glass-strong p-1">
                {["Long", "Short"].map((d) => (
                  <button type="button" key={d} onClick={() => setF({ ...f, direction: d })} className={`rounded-md py-1 text-xs normal-case tracking-normal ${f.direction === d ? (d === "Long" ? "bg-up/20 text-up" : "bg-down/20 text-down") : "text-muted-foreground"}`}>{d === "Long" ? "Buy / Long" : "Sell / Short"}</button>
                ))}
              </div>
            </Field>
            <div className="col-span-2"><Field label="Session"><select className={inp} value={f.session} onChange={set("session")}>{SESSIONS.map((x) => <option key={x}>{x}</option>)}</select></Field></div>
          </div>
        </section>

        <section className="glass-panel p-6">
          <div className="mb-4 text-sm font-semibold">Prices &amp; Size (₹)</div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Field label="Entry Price"><input type="number" step="any" className={inp} value={f.entry_price} onChange={set("entry_price")} /></Field>
            <Field label="Exit Price"><input type="number" step="any" className={inp} value={f.exit_price} onChange={set("exit_price")} placeholder="blank = open" /></Field>
            <Field label="Stop Loss"><input type="number" step="any" className={inp} value={f.stop_loss} onChange={set("stop_loss")} /></Field>
            <Field label="Target"><input type="number" step="any" className={inp} value={f.take_profit} onChange={set("take_profit")} /></Field>
            <Field label="Quantity / Lots × Size"><input type="number" step="any" className={inp} value={f.quantity} onChange={set("quantity")} placeholder="e.g. 75" /></Field>
            <Field label="Brokerage + Taxes"><input type="number" step="any" className={inp} value={f.charges} onChange={set("charges")} placeholder="STT, GST, stamp…" /></Field>
          </div>
        </section>

        <section className="glass-panel p-6">
          <div className="mb-4 text-sm font-semibold">Journal</div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <Field label="Strategy"><input list="strats" className={inp} value={f.strategy} onChange={set("strategy")} maxLength={60} /><datalist id="strats">{STRATEGIES.map((s) => <option key={s} value={s} />)}</datalist></Field>
            <Field label="Emotion"><select className={inp} value={f.emotion} onChange={set("emotion")}><option value="">—</option>{EMOTIONS.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Rating (1–5)"><select className={inp} value={f.rating} onChange={set("rating")}><option value="">—</option>{[1, 2, 3, 4, 5].map((x) => <option key={x}>{x}</option>)}</select></Field>
            <div className="col-span-2 md:col-span-3"><Field label="Mistakes"><input className={inp} value={f.mistakes} onChange={set("mistakes")} maxLength={300} placeholder="Moved SL, early exit…" /></Field></div>
            <div className="col-span-2 md:col-span-3"><Field label="Notes"><textarea rows={3} className={inp} value={f.notes} onChange={set("notes")} maxLength={2000} /></Field></div>
          </div>
        </section>
      </div>

      <aside className="col-span-12 lg:col-span-4">
        <div className="glass-panel sticky top-6 space-y-3 p-6">
          <div className="text-sm font-semibold">Auto-calculated</div>
          {[
            ["Position value", calc.value != null ? fmtINR2(calc.value) : "—"],
            ["Risk amount", calc.risk != null ? fmtINR2(calc.risk) : "—"],
            ["Risk % of capital", calc.riskPct != null ? `${fmtNum(calc.riskPct)}%` : "—"],
            ["Planned R:R", calc.plannedRR != null ? `1 : ${fmtNum(calc.plannedRR)}` : "—"],
            ["Gross P&L", calc.gross != null ? fmtSigned(calc.gross) : "—"],
            ["R multiple", calc.r != null ? `${calc.r >= 0 ? "+" : ""}${calc.r.toFixed(2)}R` : "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-border pb-2 text-sm"><span className="text-muted-foreground">{k}</span><span className="font-mono">{v}</span></div>
          ))}
          <div className="pt-2">
            <div className="label-caps">Net P&amp;L</div>
            <div className={`mt-1 text-3xl font-semibold ${calc.net == null ? "text-muted-foreground" : calc.net >= 0 ? "text-up" : "text-down"}`}>{calc.net != null ? fmtSigned(calc.net) : "Open"}</div>
          </div>
          <button disabled={save.isPending} className="mt-2 w-full rounded-lg bg-cta py-2.5 text-sm font-semibold hover:brightness-110 disabled:opacity-60">{id ? "Save Changes" : "Log Trade"}</button>
        </div>
      </aside>
    </form>
  );
}
