import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Glow, Logo } from "@/components/Glow";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Alcove" },
      { name: "description", content: "Choose a new password for your Alcove account." },
      { property: "og:title", content: "Reset password — Alcove" },
      { property: "og:description", content: "Choose a new password." },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) return toast.error("At least 6 characters");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4">
      <Glow />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <form onSubmit={submit} className="glass-panel space-y-4 p-7">
          <h1 className="text-xl font-semibold">Set a new password</h1>
          <label className="label-caps block">New password
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-glass-strong px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
          </label>
          <button disabled={busy} className="w-full rounded-lg bg-cta py-2.5 text-sm font-semibold disabled:opacity-60">Update password</button>
        </form>
      </div>
    </div>
  );
}
