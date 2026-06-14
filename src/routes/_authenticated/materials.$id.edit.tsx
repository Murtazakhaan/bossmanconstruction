import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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

const MAX_PHOTOS = 5;

function shortIdFrom(uuid: string) {
  const digits = uuid.replace(/\D/g, "").slice(0, 10).padEnd(10, "0");
  return "#" + digits;
}

function EditMaterial() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const [cats, setCats] = useState<any[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<any>(null);
  const materialId = useMemo(() => shortIdFrom(id), [id]);

  useEffect(() => {
    supabase.from("material_categories").select("*").order("sort_order").then(({ data }) => setCats(data ?? []));
    supabase.from("materials").select("*").eq("id", id).maybeSingle().then(({ data, error }) => {
      if (error || !data) { toast.error(error?.message ?? "Not found"); navigate({ to: "/materials" }); return; }
      setForm({
        title: data.title ?? "",
        description: data.description ?? "",
        category_id: data.category_id ?? undefined,
        quantity: data.quantity ?? 1,
        contractor_id: data.contractor_id,
        location: data.location ?? "",
      });
      setPhotos(data.photo_urls ?? []);
      setLoading(false);
    });
  }, [id, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !form) return;
    if (!form.category_id) { toast.error("Please choose a material type"); return; }
    if (!form.quantity || Number(form.quantity) <= 0) { toast.error("Please enter a quantity"); return; }
    setSaving(true);
    const categoryName = cats.find((c) => c.id === form.category_id)?.name ?? "Material";
    const { data, error } = await supabase.from("materials").update({
      title: `${categoryName} ${materialId}`,
      description: form.description || null,
      category_id: form.category_id,
      quantity: Number(form.quantity),
      photo_urls: photos,
      location: form.location || null,
    }).eq("id", id).eq("contractor_id", user.id).select("id");
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (!data?.length) { toast.error("You can only edit your own donations."); return; }
    qc.invalidateQueries({ queryKey: ["material", id] });
    qc.invalidateQueries({ queryKey: ["my-donations", user.id] });
    qc.invalidateQueries({ queryKey: ["materials", "available"] });
    toast.success("Donation updated");
    navigate({ to: "/materials/$id", params: { id } });
  }

  async function remove() {
    if (!user) return;
    setDeleting(true);
    const { data, error } = await supabase.from("materials").delete().eq("id", id).eq("contractor_id", user.id).select("id");
    setDeleting(false);
    if (error) { toast.error(error.message); return; }
    if (!data?.length) { toast.error("You can only delete your own donations."); return; }
    qc.invalidateQueries({ queryKey: ["material", id] });
    qc.invalidateQueries({ queryKey: ["my-donations", user.id] });
    qc.invalidateQueries({ queryKey: ["materials", "available"] });
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
        eyebrow="Donor"
        title="Edit donation"
        description="Update photos or details."
        actions={<Button variant="outline" asChild><Link to="/materials/$id" params={{ id }}>← Back</Link></Button>}
      />
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
              <Input type="number" inputMode="decimal" min="0.01" step="0.01" required {...f("quantity")} />
            </div>

            <div className="space-y-1.5">
              <Label>Location <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                {...f("location")}
                placeholder="e.g. 123 Main St, New York, NY"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea rows={4} {...f("description")} />
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