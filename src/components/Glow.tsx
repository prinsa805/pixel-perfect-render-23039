export function Glow() {
  return (
    <div className="pointer-events-none fixed inset-0 opacity-30 [background:linear-gradient(90deg,transparent_49.9%,var(--border)_50%,transparent_50.1%),linear-gradient(transparent_49.9%,var(--border)_50%,transparent_50.1%)] [background-size:96px_96px]" />
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid size-9 place-items-center border border-primary/50 bg-primary/10 font-mono text-sm font-bold text-primary before:absolute before:-top-px before:-left-px before:size-1.5 before:border-t before:border-l before:border-primary after:absolute after:-right-px after:-bottom-px after:size-1.5 after:border-r after:border-b after:border-primary">A</div>
      <div>
        <div className="font-mono text-sm font-bold uppercase text-foreground">ALCOVE<span className="text-primary">//</span></div>
        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">TRADING_CORE · INDIA</div>
      </div>
    </div>
  );
}
