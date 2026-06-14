import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { BcmLogo } from "@/components/bcm-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  role: z.enum(["contractor", "recipient"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Bossman Construction Management" },
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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: brand */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-texture p-10 text-primary-foreground lg:flex">
        <Link to="/" className="inline-flex items-center gap-2 text-sm uppercase tracking-wider text-primary-foreground/80 hover:text-primary-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <div>
          <BcmLogo className="h-32 w-auto" />
          <h2 className="mt-8 max-w-md font-display text-4xl font-bold uppercase leading-tight">
            Donate it. Don't dump it.
          </h2>
          <p className="mt-3 max-w-md text-primary-foreground/80">
            Join the contractors and families closing the loop on construction waste — one pickup at a time.
          </p>
        </div>
        <div className="text-xs uppercase tracking-wider text-primary-foreground/60">
          © {new Date().getFullYear()} Bossman Construction Management
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
            <BcmLogo variant="mark" />
          </div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">
            Welcome to BCM
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your account or create a new one to get started.
          </p>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin"><SignInForm /></TabsContent>
            <TabsContent value="signup"><SignUpForm defaultRole={role ?? "contractor"} /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function GoogleButton() {
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
    <Button type="button" variant="outline" className="w-full" onClick={go} disabled={loading}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.48 12c0-.73.13-1.44.36-2.1V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.83z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
        </svg>
      )}
      Continue with Google
    </Button>
  );
}

function SignInForm() {
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
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in
      </Button>
      <div className="relative my-2 text-center">
        <span className="bg-background px-2 text-xs uppercase tracking-wider text-muted-foreground">or</span>
        <div className="absolute inset-x-0 top-1/2 -z-0 h-px bg-border" />
      </div>
      <GoogleButton />
    </form>
  );
}

function SignUpForm({ defaultRole }: { defaultRole: "contractor" | "recipient" }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"contractor" | "recipient">(defaultRole);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: { full_name: fullName, org_name: orgName, phone, role },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Account created!");
      navigate({ to: "/dashboard" });
    } else {
      toast.success("Check your email to confirm your account.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div className="space-y-1.5">
        <Label>I am a…</Label>
        <RadioGroup value={role} onValueChange={(v) => setRole(v as "contractor" | "recipient")} className="grid grid-cols-2 gap-2">
          {[
            { v: "contractor", label: "Contractor", sub: "I have surplus to donate" },
            { v: "recipient", label: "Recipient", sub: "Homeowner / nonprofit" },
          ].map((opt) => (
            <label
              key={opt.v}
              className={`flex cursor-pointer flex-col gap-1 rounded-sm border p-3 ${role === opt.v ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value={opt.v} id={`role-${opt.v}`} />
                <span className="font-display text-sm font-semibold uppercase">{opt.label}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">{opt.sub}</span>
            </label>
          ))}
        </RadioGroup>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="orgName">Organization {role === "contractor" ? "(company)" : "(optional)"}</Label>
          <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email2">Email</Label>
        <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password2">Password</Label>
        <Input id="password2" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="text-[11px] text-muted-foreground">At least 8 characters.</p>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create account
      </Button>
      <div className="relative my-2 text-center">
        <span className="bg-background px-2 text-xs uppercase tracking-wider text-muted-foreground">or</span>
        <div className="absolute inset-x-0 top-1/2 -z-0 h-px bg-border" />
      </div>
      <GoogleButton />
    </form>
  );
}