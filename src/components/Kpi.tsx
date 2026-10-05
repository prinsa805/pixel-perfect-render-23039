import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function Kpi({ label, value, sub, icon: Icon, tone }: { label: string; value: ReactNode; sub?: ReactNode; icon: LucideIcon; tone?: "up" | "down" | "accent" }) {
  const toneCls = tone === "up" ? "text-up" : tone === "down" ? "text-down" : tone === "accent" ? "text-primary" : "";
  return (
    <div className="glass-panel p-4 before:absolute before:top-0 before:left-0 before:h-px before:w-10 before:bg-primary/70">
      <div className="flex items-center justify-between">
        <div className="label-caps">{label}</div>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className={`mt-3 font-mono text-xl font-semibold md:text-2xl ${toneCls}`}>{value}</div>
      {sub && <div className="mt-2 font-mono text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="glass-panel p-10 text-center font-mono text-xs text-muted-foreground">{children}</div>;
}
