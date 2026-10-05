import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, IndianRupee, NotebookPen, Radio, ShieldCheck, Terminal } from "lucide-react";
import { Glow, Logo } from "@/components/Glow";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alcove — Trading Journal for NSE, BSE & MCX Traders" },
      { name: "description", content: "Log NIFTY, BANKNIFTY, F&O and equity trades in rupees. Track win rate, drawdown and equity curve." },
      { property: "og:title", content: "Alcove — Trading Journal for Indian Traders" },
      { property: "og:description", content: "Journal your NSE, BSE & MCX trades in ₹ and find your edge." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
    <div className="scanlines relative min-h-screen overflow-hidden px-3 py-3 sm:px-6 sm:py-6">
      <Glow />
      <div className="terminal-frame relative mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1400px] flex-col bg-background/95 sm:min-h-[calc(100vh-3rem)]">
        <div className="flex h-8 items-center justify-between border-b border-border bg-primary/5 px-3 font-mono text-[9px] uppercase text-muted-foreground sm:px-5">
          <span>ALCOVE // TRADING_CORE_V3.0.4</span>
          <span className="hidden gap-5 sm:flex"><span>LATENCY: 14MS</span><span className="text-up">● SYSTEM ONLINE</span><span>REGION: NSE/BSE</span></span>
        </div>
        <header className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-8">
          <Logo />
          <Link to="/auth" className="border border-primary/40 px-4 py-2 font-mono text-[10px] uppercase text-primary hover:bg-primary/10">[ SIGN_IN ]</Link>
        </header>
        <main className="grid flex-1 lg:grid-cols-[1fr_320px]">
          <section className="flex flex-col justify-center border-b border-border px-6 py-16 sm:px-10 lg:border-r lg:border-b-0 lg:px-16 lg:py-20">
            <div className="label-caps flex items-center gap-2 text-primary"><Radio className="size-3 animate-pulse" /> India market intelligence online</div>
            <h1 className="mt-5 max-w-4xl font-mono text-4xl font-bold uppercase leading-[1.05] md:text-6xl lg:text-7xl">
              Decode your<br /><span className="text-primary">trading edge.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">Precision journaling and performance telemetry for NIFTY, BANKNIFTY, F&amp;O and Indian equities — measured in rupees.</p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link to="/auth" className="inline-flex items-center gap-3 bg-cta px-6 py-3 font-mono text-xs font-bold uppercase hover:brightness-110">Initialize journal <ArrowRight className="size-4" /></Link>
              <span className="font-mono text-[10px] text-muted-foreground"><ShieldCheck className="mr-2 inline size-4 text-up" />PRIVATE · ENCRYPTED · CLOUD SYNC</span>
            </div>
          </section>
          <aside className="flex flex-col bg-primary/[0.025] p-6 sm:p-8">
            <div className="label-caps mb-4">Market telemetry // IST</div>
            {[['NIFTY 50','24,853.40','+0.72%','text-up'],['BANKNIFTY','56,182.10','-0.18%','text-down'],['SENSEX','81,338.92','+0.44%','text-up']].map(([name,value,move,tone]) => <div key={name} className="border-t border-border py-4 font-mono"><div className="flex items-center justify-between text-[10px] text-muted-foreground"><span>{name}</span><span className={tone}>{move}</span></div><div className="mt-1 text-xl">{value}</div></div>)}
            <div className="mt-auto border border-border bg-primary/5 p-4 font-mono text-[10px] leading-6 text-muted-foreground"><div className="text-primary">&gt; PERFORMANCE ENGINE READY</div><div>&gt; INR FORMAT LOADED</div><div>&gt; NSE/BSE/MCX SESSIONS SYNCED</div><div className="animate-pulse">&gt; WAITING FOR TRADER_</div></div>
          </aside>
        </main>
        <section className="grid border-t border-border md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="border-b border-border p-5 last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0">
              <div className="flex items-center gap-3"><f.icon className="size-4 text-primary" /><div className="font-mono text-[11px] font-bold uppercase">{f.title}</div></div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </section>
        <footer className="flex items-center justify-between border-t border-border bg-primary/5 px-4 py-2 font-mono text-[9px] text-muted-foreground"><span><Terminal className="mr-2 inline size-3" />ALC_SYS_AUTH: READY</span><span>IST · INR · INDIA</span></footer>
      </div>
    </div>
  );
}
