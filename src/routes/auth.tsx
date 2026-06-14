import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { BcmLogo } from "@/components/bcm-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Eye, EyeOff, HardHat, Home, CheckCircle2, Mail, Lock } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  role: z.enum(["contractor", "recipient"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in - Bossman Construction Management" },
      { name: "description", content: "Sign in or create a free Bossman Construction Management account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { mode, role } = Route.useSearch();
  const [tab, setTab] = useState<"signin" | "signup">(mode ?? "signin");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-6 sm:px-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>

        <div className="mt-6 flex justify-center">
          <BcmLogo variant="full" className="h-24 w-auto sm:h-28" />
        </div>

        <div className="mt-8">
          <h1 className="text-2xl font-bold tracking-tight">
            {tab === "signin" ? "Sign In" : "Sign Up"}
          </h1>
          {tab === "signup" && (
            <p className="mt-1 text-[15px] text-muted-foreground">
              Who are you signing up as? Select your role to continue.
            </p>
          )}
        </div>

        {tab === "signin" ? (
          <SignInForm onSwitch={() => setTab("signup")} />
        ) : (
          <SignUpForm defaultRole={role ?? "contractor"} onSwitch={() => setTab("signin")} />
        )}

        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="mt-4">
          <GoogleSignInButton />
        </div>

        <p className="mt-auto pt-8 text-center text-[11px] text-muted-foreground">
          By continuing you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  async function go() {
    setLoading(true);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (r.error) {
      toast.error(r.error.message ?? "Google sign-in failed");
      setLoading(false);
      return;
    }
    if (r.redirected) return;
    window.location.href = "/dashboard";
  }
  return (
    <button
      type="button"
      onClick={go}
      disabled={loading}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-md border border-input bg-background text-sm font-medium text-foreground shadow-sm transition hover:bg-accent disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.48 12c0-.73.13-1.44.36-2.1V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.83z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z" />
          </svg>
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
}

function PasswordInput({ id, value, onChange, autoComplete, showLock = true }: { id: string; value: string; onChange: (v: string) => void; autoComplete?: string; showLock?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      {showLock && (
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <Input
        id={id}
        type={show ? "text" : "password"}
        required
        minLength={8}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className={`h-12 text-base pr-11 ${showLock ? "pl-10" : ""}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function SignInForm({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      const msg = /invalid/i.test(error.message)
        ? "That email and password don't match. Please try again."
        : error.message;
      toast.error(msg);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="email" type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 pl-10 text-base" placeholder="you@example.com" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" />
      </div>
      <Button type="submit" className="h-12 w-full text-base font-semibold bg-[#0a0f2c] hover:bg-[#0a0f2c]/90" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign In
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-foreground underline-offset-4 hover:underline">
          Sign Up
        </button>
      </p>
    </form>
  );
}

function SignUpForm({ defaultRole, onSwitch }: { defaultRole: "contractor" | "recipient"; onSwitch: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"contractor" | "recipient">(defaultRole);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"role" | "info">("role");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: { full_name: fullName, role },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Welcome aboard!");
      navigate({ to: "/dashboard" });
    } else {
      toast.success("Almost done — check your email to confirm.");
    }
  }

  const roleOptions = [
    { v: "contractor" as const, label: "I'm a contractor", sub: "I have materials to donate", Icon: HardHat },
    { v: "recipient" as const, label: "I need materials", sub: "Homeowner or nonprofit", Icon: Home },
  ];

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4">
      {step === "role" ? (
        <>
          <div className="space-y-2">
            <Label>I want to…</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {roleOptions.map(({ v, label, sub, Icon }) => {
                const active = role === v;
                return (
                  <button
                    type="button"
                    key={v}
                    onClick={() => setRole(v)}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                      active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className="block text-xs text-muted-foreground">{sub}</span>
                    </span>
                    {active && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
          <Button type="button" onClick={() => setStep("info")} className="h-12 w-full text-base font-semibold bg-[#0a0f2c] hover:bg-[#0a0f2c]/90">
            Continue
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button type="button" onClick={onSwitch} className="font-semibold text-foreground underline-offset-4 hover:underline">
              Sign In
            </button>
          </p>
        </>
      ) : (
        <>
          <button type="button" onClick={() => setStep("role")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Change role
          </button>
          <div className="space-y-1.5">
        <Label htmlFor="fullName">Your name</Label>
        <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" className="h-12 text-base" placeholder="Jane Smith" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email2">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="email2" type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 pl-10 text-base" placeholder="you@example.com" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password2">Password</Label>
        <PasswordInput id="password2" value={password} onChange={setPassword} autoComplete="new-password" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <PasswordInput id="confirmPassword" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
      </div>
      <Button type="submit" className="h-12 w-full text-base font-semibold bg-[#0a0f2c] hover:bg-[#0a0f2c]/90" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign Up
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-foreground underline-offset-4 hover:underline">
          Sign In
        </button>
      </p>
        </>
      )}
    </form>
  );
}