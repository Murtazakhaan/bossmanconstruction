import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useCurrentUser();
  const [p, setP] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      setP(data ?? { id: user.id });
    });
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ ...p, id: user.id });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  }

  const f = (k: string) => ({
    value: p[k] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setP({ ...p, [k]: e.target.value }),
  });

  return (
    <AppShell title="Profile">
      <PageHeader eyebrow="Your account" title="Profile" description="Keep your contact details up to date." />
      <Card className="max-w-2xl">
        <CardContent className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Full name</Label><Input {...f("full_name")} /></div>
            <div className="space-y-1.5"><Label>Organization</Label><Input {...f("org_name")} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Phone</Label><Input {...f("phone")} /></div>
            <div className="space-y-1.5"><Label>ZIP</Label><Input {...f("zip")} /></div>
          </div>
          <div className="space-y-1.5"><Label>Address</Label><Input {...f("address_line")} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>City</Label><Input {...f("city")} /></div>
            <div className="space-y-1.5"><Label>State</Label><Input {...f("state")} placeholder="e.g. TX" /></div>
          </div>
          <div className="space-y-1.5"><Label>Bio / about</Label><Textarea {...f("bio")} rows={3} /></div>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}