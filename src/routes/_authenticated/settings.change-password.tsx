import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings/change-password")({
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    if (pw !== confirm) return toast.error("Passwords don't match.");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/settings" });
  }

  return (
    <AppShell title="Change Password">
      <div className="mx-auto max-w-md">
        <Link to="/settings" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to settings
        </Link>
        <PageHeader title="Change Password" description="Pick a strong password you don't use elsewhere." />
        <Card>
          <CardContent className="p-5">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>New password</Label>
                <div className="relative">
                  <Input
                    type={show ? "text" : "password"}
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    className="h-12 pr-10 text-base"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Confirm new password</Label>
                <Input
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="h-12 text-base"
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="h-12 w-full text-base" disabled={saving}>
                {saving ? "Updating…" : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}