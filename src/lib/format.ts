const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtINR = (n: number) => inr.format(n || 0);
export const fmtINR2 = (n: number) => inr2.format(n || 0);
export const fmtSigned = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "") + inr.format(Math.abs(n || 0));
export const fmtNum = (n: number, d = 2) =>
  Number.isFinite(n) ? n.toLocaleString("en-IN", { maximumFractionDigits: d }) : "∞";
export const fmtPct = (n: number, d = 1) => `${Number.isFinite(n) ? n.toFixed(d) : "0"}%`;
