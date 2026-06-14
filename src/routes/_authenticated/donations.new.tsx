import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import { MaterialPhotoUpload } from "@/components/material-photo-upload";

export const Route = createFileRoute("/_authenticated/donations/new")({
  component: NewDonation,
});

const MAX_PHOTOS = 5;

function NewDonation() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [cats, setCats] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const materialId = useMemo(
    () => "#" + Math.floor(1000000000 + Math.random() * 9000000000).toString(),
    [],
  );
  const [form, setForm] = useState<any>({
    description: "",
    category_id: undefined as string | undefined,
    quantity: "",
  });

  useEffect(() => {
    supabase.from("material_categories").select("*").order("sort_order").then(({ data }) => setCats(data ?? []));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.category_id) { toast.error("Please choose a material type"); return; }
    if (!form.quantity || Number(form.quantity) <= 0) { toast.error("Please enter a quantity"); return; }
    setSaving(true);
    const categoryName = cats.find((c) => c.id === form.category_id)?.name ?? "Material";
    const payload = {
      contractor_id: user.id,
      title: `${categoryName} ${materialId}`,
      description: form.description || null,
      category_id: form.category_id,
      quantity: Number(form.quantity),
      unit: "units",
      unit_value_usd: 0,
      photo_urls: photos,
    };
    const { error } = await supabase.from("materials").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Donation posted!");
    navigate({ to: "/donations" });
  }

  return (
    <AppShell title="New donation">
      <PageHeader eyebrow="Donor" title="New donation" description="Add a few details so recipients can find your surplus." />
      <Card className="max-w-xl">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Photos <span className="text-muted-foreground font-normal">(maximum {MAX_PHOTOS} images)</span></Label>
              {user ? (
                <MaterialPhotoUpload
                  userId={user.id}
                  value={photos}
                  onChange={(next) => setPhotos(next.slice(0, MAX_PHOTOS))}
                />
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>Material type</Label>
              <Select value={form.category_id ?? undefined} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Choose a material type" /></SelectTrigger>
                <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Material ID <span className="text-muted-foreground font-normal">(auto-generated)</span></Label>
              <Input value={materialId} readOnly className="bg-muted/50" />
            </div>

            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Adding…" : "Add Donation"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}