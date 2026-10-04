import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/trades";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Alcove" }, { name: "description", content: "Profile and account settings." }] }),
  component: Settings,
});

const inp = "mt-1 w-full rounded-lg border border-input bg-glass-strong px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

function Settings() {
  const { data: profile } = useQuery(profileQuery);
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [capital, setCapital] = useState("");
  const [risk, setRisk] = useState("");
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");

  useEffect(() => {
    if (!profile) return;
    setName(profile.display_name ?? "");
    setCapital(String(profile.starting_capital));
    setRisk(String(profile.default_risk_pct));
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      const c = Number(capital), r = Number(risk);
      if (!(c > 0)) throw new Error("Capital must be positive");
      const { error } = await supabase.from("profiles").update({ display_name: name.trim().slice(0, 80), starting_capital: c, default_risk_pct: r || 1, updated_at: new Date().toISOString() }).eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); toast.success("Settings saved"); },
    onError: (e) => toast.error((e as Error).message),
  });

  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    if (newPw.length < 6) return toast.error("At least 6 characters");
    const { error } = await supabase.auth.updateUser({ password: newPw, current_password: curPw } as never);
    if (error) return toast.error(error.message);
    setCurPw(""); setNewPw("");
    toast.success("Password changed");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="glass-panel space-y-4 p-6">
        <div className="text-sm font-semibold">Profile</div>
        <label className="label-caps block">Display name<input className={inp} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="label-caps block">Starting capital (₹)<input type="number" className={`${inp} font-mono`} value={capital} onChange={(e) => setCapital(e.target.value)} /></label>
        <label className="label-caps block">Default risk per trade (%)<input type="number" step="0.1" className={`${inp} font-mono`} value={risk} onChange={(e) => setRisk(e.target.value)} /></label>
        <button disabled={save.isPending} className="rounded-lg bg-cta px-5 py-2 text-sm font-semibold disabled:opacity-60">Save</button>
      </form>
      <form onSubmit={changePw} className="glass-panel space-y-4 p-6">
        <div className="text-sm font-semibold">Change password</div>
        <label className="label-caps block">Current password<input type="password" className={inp} value={curPw} onChange={(e) => setCurPw(e.target.value)} /></label>
        <label className="label-caps block">New password<input type="password" className={inp} value={newPw} onChange={(e) => setNewPw(e.target.value)} /></label>
        <button className="rounded-lg border border-border bg-glass px-5 py-2 text-sm font-medium hover:bg-secondary">Update password</button>
      </form>
    </div>
  );
}
