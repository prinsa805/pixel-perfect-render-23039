import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Glow, Logo } from "@/components/Glow";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Alcove Trading Journal" },
      { name: "description", content: "Sign in or create your Alcove trading journal account." },
      { property: "og:title", content: "Sign in — Alcove" },
      { property: "og:description", content: "Access your trading journal." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({ email: z.string().trim().email("Enter a valid email"), password: z.string().min(6, "At least 6 characters") });
type Mode = "signin" | "signup" | "forgot";

const inputCls = "mt-1 w-full rounded-lg border border-input bg-glass-strong px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && navigate({ to: "/dashboard" }));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => s && navigate({ to: "/dashboard" }));
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "forgot") {
        const r = z.string().email().safeParse(email.trim());
        if (!r.success) return toast.error("Enter a valid email");
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("Check your email for a reset link");
        return setMode("signin");
      }
      const p = schema.safeParse({ email, password });
      if (!p.success) return toast.error(p.error.issues[0]?.message ?? "Invalid input");
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: p.data.email,
          password: p.data.password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        if (!data.session) toast.success("Check your email to confirm your account");
      } else {
        const { error } = await supabase.auth.signInWithPassword(p.data);
        if (error) throw error;
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4">
      <Glow />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="glass-panel p-7">
          <h1 className="text-xl font-semibold">
            {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your journal" : "Reset password"}
          </h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <label className="label-caps block">Name<input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></label>
            )}
            <label className="label-caps block">Email<input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            {mode !== "forgot" && (
              <label className="label-caps block">Password<input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
            )}
            <button disabled={busy} className="w-full rounded-lg bg-cta py-2.5 text-sm font-semibold hover:brightness-110 disabled:opacity-60">
              {mode === "signin" ? "Sign in" : mode === "signup" ? "Sign up" : "Send reset link"}
            </button>
          </form>
          {mode !== "forgot" && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
              <button onClick={google} className="w-full rounded-lg border border-border bg-glass py-2.5 text-sm font-medium hover:bg-secondary">Continue with Google</button>
            </>
          )}
          <div className="mt-6 flex justify-between text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                <button onClick={() => setMode("signup")} className="hover:text-foreground">Create account</button>
                <button onClick={() => setMode("forgot")} className="hover:text-foreground">Forgot password?</button>
              </>
            ) : (
              <button onClick={() => setMode("signin")} className="hover:text-foreground">Back to sign in</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
