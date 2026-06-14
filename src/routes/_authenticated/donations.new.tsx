import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/donations/new")({
  component: NewDonation,
});

function NewDonation() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [cats, setCats] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    title: "", description: "", category_id: "", quantity: 1, unit: "units",
    unit_value_usd: 0, pickup_address: "", pickup_city: "", pickup_state: "", pickup_zip: "",
    available_from: "", available_until: "",
  });

  useEffect(() => {
    supabase.from("material_categories").select("*").order("sort_order").then(({ data }) => setCats(data ?? []));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const payload = {
      ...form,
      contractor_id: user.id,
      quantity: Number(form.quantity),
      unit_value_usd: Number(form.unit_value_usd),
      available_from: form.available_from || null,
      available_until: form.available_until || null,
      category_id: form.category_id || null,
    };
    const { error } = await supabase.from("materials").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Donation posted!");
    navigate({ to: "/materials" });
  }

  const f = (k: string) => ({
    value: form[k] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value }),
  });

  return (
    <AppShell title="New donation">
      <PageHeader eyebrow="Contractor" title="Post a donation" description="Tell recipients what's available and when they can pick it up." />
      <Card className="max-w-3xl">
        <CardContent className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5"><Label>Title</Label><Input required placeholder="e.g. 12 sheets of 1/2” drywall" {...f("title")} /></div>
            <div className="space-y-1.5"><Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} {...f("description")} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Quantity</Label><Input type="number" min="0.01" step="0.01" required {...f("quantity")} /></div>
              <div className="space-y-1.5"><Label>Unit</Label><Input required placeholder="sheets / lbs / sq ft" {...f("unit")} /></div>
              <div className="space-y-1.5"><Label>Value / unit (USD)</Label><Input type="number" min="0" step="0.01" required {...f("unit_value_usd")} /></div>
            </div>
            <div className="space-y-1.5"><Label>Pickup address</Label><Input {...f("pickup_address")} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>City</Label><Input {...f("pickup_city")} /></div>
              <div className="space-y-1.5"><Label>State</Label><Input {...f("pickup_state")} placeholder="TX" /></div>
              <div className="space-y-1.5"><Label>ZIP</Label><Input {...f("pickup_zip")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Available from</Label><Input type="date" {...f("available_from")} /></div>
              <div className="space-y-1.5"><Label>Available until</Label><Input type="date" {...f("available_until")} /></div>
            </div>
            <Button type="submit" disabled={saving}>{saving ? "Posting…" : "Post donation"}</Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}