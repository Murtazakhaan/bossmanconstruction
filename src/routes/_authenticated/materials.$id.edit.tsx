import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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
import { MaterialPhotoUpload } from "@/components/material-photo-upload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/materials/$id/edit")({
  component: EditMaterial,
});

function EditMaterial() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [cats, setCats] = useState<any[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    supabase.from("material_categories").select("*").order("sort_order").then(({ data }) => setCats(data ?? []));
    supabase.from("materials").select("*").eq("id", id).maybeSingle().then(({ data, error }) => {
      if (error || !data) { toast.error(error?.message ?? "Not found"); navigate({ to: "/materials" }); return; }
      setForm({
        title: data.title ?? "",
        description: data.description ?? "",
        category_id: data.category_id ?? undefined,
        quantity: data.quantity ?? 1,
        unit: data.unit ?? "units",
        unit_value_usd: data.unit_value_usd ?? 0,
        pickup_address: data.pickup_address ?? "",
        pickup_city: data.pickup_city ?? "",
        pickup_state: data.pickup_state ?? "",
        pickup_zip: data.pickup_zip ?? "",
        available_from: data.available_from ?? "",
        available_until: data.available_until ?? "",
        status: data.status,
        contractor_id: data.contractor_id,
      });
      setPhotos(data.photo_urls ?? []);
      setLoading(false);
    });
  }, [id, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !form) return;
    setSaving(true);
    const { error } = await supabase.from("materials").update({
      title: form.title,
      description: form.description,
      category_id: form.category_id || null,
      quantity: Number(form.quantity),
      unit: form.unit,
      unit_value_usd: Number(form.unit_value_usd),
      pickup_address: form.pickup_address,
      pickup_city: form.pickup_city,
      pickup_state: form.pickup_state,
      pickup_zip: form.pickup_zip,
      available_from: form.available_from || null,
      available_until: form.available_until || null,
      status: form.status,
      photo_urls: photos,
    }).eq("id", id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Donation updated");
    navigate({ to: "/materials/$id", params: { id } });
  }

  async function remove() {
    setDeleting(true);
    const { error } = await supabase.from("materials").delete().eq("id", id);
    setDeleting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Donation deleted");
    navigate({ to: "/materials" });
  }

  const f = (k: string) => ({
    value: form?.[k] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value }),
  });

  if (loading || !form) return <AppShell title="Edit donation"><div className="text-sm text-muted-foreground">Loading…</div></AppShell>;

  return (
    <AppShell title="Edit donation">
      <PageHeader
        eyebrow="Contractor"
        title="Edit donation"
        description="Update details, photos, or availability."
        actions={<Button variant="outline" asChild><Link to="/materials/$id" params={{ id }}>← Back</Link></Button>}
      />
      <Card className="max-w-3xl">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5"><Label>Title</Label><Input required {...f("title")} /></div>
            <div className="space-y-1.5"><Label>Category</Label>
              <Select value={form.category_id ?? undefined} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} {...f("description")} /></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5"><Label>Quantity</Label><Input type="number" inputMode="decimal" min="0.01" step="0.01" required {...f("quantity")} /></div>
              <div className="space-y-1.5"><Label>Unit</Label><Input required {...f("unit")} /></div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1"><Label>Value / unit (USD)</Label><Input type="number" inputMode="decimal" min="0" step="0.01" required {...f("unit_value_usd")} /></div>
            </div>
            <div className="space-y-1.5"><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="claimed">Claimed</SelectItem>
                  <SelectItem value="picked_up">Picked up</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Pickup address</Label><Input {...f("pickup_address")} /></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5 col-span-2 sm:col-span-1"><Label>City</Label><Input {...f("pickup_city")} /></div>
              <div className="space-y-1.5"><Label>State</Label><Input {...f("pickup_state")} /></div>
              <div className="space-y-1.5"><Label>ZIP</Label><Input inputMode="numeric" {...f("pickup_zip")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Available from</Label><Input type="date" {...f("available_from")} /></div>
              <div className="space-y-1.5"><Label>Available until</Label><Input type="date" {...f("available_until")} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Photos</Label>
              {user ? <MaterialPhotoUpload userId={user.id} value={photos} onChange={setPhotos} /> : null}
            </div>
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={deleting} className="w-full sm:w-auto">
                    {deleting ? "Deleting…" : "Delete donation"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this donation?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove the donation. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={remove}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">{saving ? "Saving…" : "Save changes"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}