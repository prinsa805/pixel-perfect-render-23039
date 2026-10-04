import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, IndianRupee, NotebookPen } from "lucide-react";
import { Glow, Logo } from "@/components/Glow";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alcove — Trading Journal for NSE, BSE & MCX Traders" },
      { name: "description", content: "Log NIFTY, BANKNIFTY, F&O and equity trades in rupees. Track win rate, drawdown and equity curve." },
      { property: "og:title", content: "Alcove — Trading Journal for Indian Traders" },
      { property: "og:description", content: "Journal your NSE, BSE & MCX trades in ₹ and find your edge." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: NotebookPen, title: "Log every trade", text: "Equity, F&O, commodity — with SL, target, charges and notes." },
  { icon: BarChart3, title: "See your edge", text: "Win rate, profit factor, drawdown and equity curve in ₹." },
  { icon: IndianRupee, title: "Built for India", text: "NSE, BSE, MCX sessions in IST with Indian number format." },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Glow />
      <div className="relative mx-auto max-w-[1200px] px-6 py-8">
        <header className="flex items-center justify-between">
          <Logo />
          <Link to="/auth" className="rounded-full border border-border bg-glass px-4 py-2 text-sm hover:bg-secondary">Sign in</Link>
        </header>
        <section className="py-24 md:py-32">
          <div className="label-caps">For NIFTY, BANKNIFTY & stock traders</div>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            Your trading journal, <span className="text-primary">in rupees.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Record every trade, review your mistakes and watch your equity curve grow — made for Indian markets.
          </p>
          <Link to="/auth" className="mt-10 inline-flex items-center gap-2 rounded-lg bg-cta px-6 py-3 font-semibold hover:brightness-110">
            Start journaling <ArrowRight className="size-4" />
          </Link>
        </section>
        <section className="grid gap-5 pb-16 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass-panel p-6">
              <f.icon className="size-5 text-primary" />
              <div className="mt-4 font-semibold">{f.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
