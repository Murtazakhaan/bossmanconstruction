import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings/delete-account")({
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (confirm !== "DELETE") return toast.error("Type DELETE to confirm.");
    setSubmitting(true);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setSubmitting(false);
    toast.success("Request received. Our team will close your account within 1 business day.");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell title="Delete Account">
      <div className="mx-auto max-w-md">
        <Link to="/settings" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to settings
        </Link>
        <PageHeader title="Delete Account" description="This permanently removes your account and data." />
        <Card className="border-destructive/40">
          <CardContent className="space-y-4 p-5">
            <div className="flex gap-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                Deleting your account removes your profile, donations, and transaction history. This cannot be undone.
              </div>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Type DELETE to confirm</Label>
                <Input
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="h-12 text-base"
                />
              </div>
              <Button
                type="submit"
                variant="destructive"
                className="h-12 w-full text-base"
                disabled={submitting || confirm !== "DELETE"}
              >
                {submitting ? "Submitting…" : "Delete my account"}
              </Button>
              <Button asChild type="button" variant="outline" className="h-12 w-full text-base">
                <Link to="/settings">Cancel</Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}