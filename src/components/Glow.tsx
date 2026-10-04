export function Glow() {
  return (
    <>
      <div className="pointer-events-none fixed -top-32 -left-24 h-[560px] w-[560px] rounded-full bg-primary/10 blur-[130px]" />
      <div className="pointer-events-none fixed top-40 -right-24 h-[520px] w-[520px] rounded-full bg-amber/10 blur-[130px]" />
      <div className="pointer-events-none fixed bottom-0 left-1/3 h-[420px] w-[640px] rounded-full bg-up/10 blur-[150px]" />
    </>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-9 place-items-center rounded-xl bg-logo text-lg font-bold text-primary-foreground shadow-lg shadow-primary/20">A</div>
      <div>
        <div className="text-lg font-semibold tracking-tight">Alcove</div>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">trading journal · India</div>
      </div>
    </div>
  );
}
