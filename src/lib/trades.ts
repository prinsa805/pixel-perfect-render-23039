import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Trade = Tables<"trades">;
export type Profile = Tables<"profiles">;

export const EXCHANGES = ["NSE", "BSE", "MCX", "NCDEX", "CDS"] as const;
export const SEGMENTS = [
  "Equity Intraday",
  "Equity Delivery",
  "Index Futures",
  "Index Options",
  "Stock Futures",
  "Stock Options",
  "Commodity",
  "Currency",
] as const;
export const SESSIONS = ["Pre-open (9:00–9:15)", "Opening (9:15–10:30)", "Mid-day (10:30–13:30)", "Closing (13:30–15:30)", "MCX Evening (17:00–23:30)"] as const;
export const SYMBOL_SUGGESTIONS = ["NIFTY", "BANKNIFTY", "FINNIFTY", "SENSEX", "MIDCPNIFTY", "RELIANCE", "HDFCBANK", "ICICIBANK", "INFY", "TCS", "SBIN", "TATAMOTORS", "CRUDEOIL", "GOLD", "USDINR"];
export const STRATEGIES = ["Breakout", "Pullback", "ORB", "VWAP Reversal", "Option Selling", "Gap Fill", "Trend Following", "Scalping"];
export const EMOTIONS = ["Calm", "Confident", "Fearful", "Greedy", "FOMO", "Revenge", "Impatient"];

export const tradesQuery = queryOptions({
  queryKey: ["trades"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("trade_date", { ascending: true })
      .order("trade_time", { ascending: true, nullsFirst: true });
    if (error) throw error;
    return data as Trade[];
  },
});

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
    if (error) throw error;
    return data as Profile | null;
  },
});

export function grossPnl(t: Trade) {
  if (t.exit_price == null) return 0;
  const diff = Number(t.exit_price) - Number(t.entry_price);
  return (t.direction === "Short" ? -diff : diff) * Number(t.quantity);
}
export const netPnl = (t: Trade) => (t.exit_price == null ? 0 : grossPnl(t) - Number(t.charges || 0));
export function rMultiple(t: Trade) {
  if (t.stop_loss == null || t.exit_price == null) return null;
  const risk = Math.abs(Number(t.entry_price) - Number(t.stop_loss)) * Number(t.quantity);
  return risk > 0 ? netPnl(t) / risk : null;
}
export const isClosed = (t: Trade) => t.exit_price != null;

export type Range = "Today" | "Week" | "Month" | "3M" | "6M" | "1Y" | "All";
export const RANGES: Range[] = ["Today", "Week", "Month", "3M", "6M", "1Y", "All"];
export function filterRange(trades: Trade[], r: Range) {
  if (r === "All") return trades;
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (r === "Week") start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  if (r === "Month") start.setDate(1);
  if (r === "3M") start.setMonth(start.getMonth() - 3);
  if (r === "6M") start.setMonth(start.getMonth() - 6);
  if (r === "1Y") start.setFullYear(start.getFullYear() - 1);
  return trades.filter((t) => new Date(t.trade_date + "T00:00:00") >= start);
}

export function computeStats(all: Trade[], capital: number) {
  const trades = all.filter(isClosed);
  const pnls = trades.map(netPnl);
  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);
  const grossWin = wins.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));
  const net = grossWin - grossLoss;
  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;

  let equity = capital, peak = capital, maxDD = 0, maxDDPct = 0;
  const curve = trades.map((t, i) => {
    equity += pnls[i];
    peak = Math.max(peak, equity);
    const dd = peak - equity;
    if (dd > maxDD) { maxDD = dd; maxDDPct = peak ? (dd / peak) * 100 : 0; }
    return { idx: i + 1, date: t.trade_date, equity: Math.round(equity), peak: Math.round(peak), drawdown: -Math.round(dd), pnl: Math.round(pnls[i]) };
  });

  let winStreak = 0, lossStreak = 0;
  for (let i = pnls.length - 1; i >= 0; i--) {
    if (pnls[i] > 0 && lossStreak === 0) winStreak++;
    else if (pnls[i] < 0 && winStreak === 0) lossStreak++;
    else break;
  }

  return {
    total: trades.length,
    open: all.length - trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: trades.length ? (wins.length / trades.length) * 100 : 0,
    net,
    avgWin,
    avgLoss,
    profitFactor: grossLoss ? grossWin / grossLoss : grossWin ? Infinity : 0,
    rr: avgLoss ? avgWin / avgLoss : 0,
    maxDD,
    maxDDPct,
    winStreak,
    lossStreak,
    equity,
    returnPct: capital ? (net / capital) * 100 : 0,
    curve,
    best: pnls.length ? Math.max(...pnls) : 0,
    worst: pnls.length ? Math.min(...pnls) : 0,
  };
}

export function groupBy(trades: Trade[], key: (t: Trade) => string) {
  const m = new Map<string, { name: string; pnl: number; count: number; wins: number }>();
  trades.filter(isClosed).forEach((t) => {
    const k = key(t) || "—";
    const e = m.get(k) ?? { name: k, pnl: 0, count: 0, wins: 0 };
    const p = netPnl(t);
    e.pnl += p; e.count++; if (p > 0) e.wins++;
    m.set(k, e);
  });
  return [...m.values()].map((e) => ({ ...e, pnl: Math.round(e.pnl), winRate: e.count ? Math.round((e.wins / e.count) * 100) : 0 })).sort((a, b) => b.pnl - a.pnl);
}
