import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { useSignedPhotoUrls } from "@/components/material-photo-upload";
import { Pencil } from "lucide-react";

export const Route = createFileRoute("/_authenticated/materials/$id")({
  component: MaterialDetail,
});

function MaterialDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, roles } = useCurrentUser();
  const [qty, setQty] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  const { data: m } = useQuery({
    queryKey: ["material", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("*, material_categories(name), profiles!materials_contractor_id_fkey(full_name, org_name)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const photoUrls = useSignedPhotoUrls((m as any)?.photo_urls);

  async function request() {
    if (!user || !m) return;
    setSubmitting(true);
    const { error } = await supabase.from("transactions").insert({
      material_id: m.id,
      contractor_id: m.contractor_id,
      recipient_id: user.id,
      requested_quantity: qty,
      status: "requested",
      pickup_address: m.pickup_address,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Request sent to contractor.");
    qc.invalidateQueries({ queryKey: ["transactions"] });
    navigate({ to: "/transactions" });
  }

  if (!m) return <AppShell title="Material"><div className="text-sm text-muted-foreground">Loading…</div></AppShell>;

  const isOwner = user?.id === m.contractor_id;

  return (
    <AppShell title="Material">
      <PageHeader
        eyebrow={(m as any).material_categories?.name ?? "Material"}
        title={m.title}
        actions={
          <div className="flex gap-2">
            {isOwner ? (
              <Button asChild>
                <Link to="/materials/$id/edit" params={{ id: m.id }}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Link>
              </Button>
            ) : null}
            <Button variant="outline" asChild><Link to="/materials">← Back</Link></Button>
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-3 md:gap-6">
        <Card className="md:col-span-2">
          <CardContent className="space-y-4 p-4 sm:p-6">
            {photoUrls.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {photoUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-md border border-border">
                    <img src={url} alt={`${m.title} ${i + 1}`} className="h-full w-full object-cover transition-transform hover:scale-105" />
                  </a>
                ))}
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <StatusBadge status={m.status} />
              <span className="text-xs text-muted-foreground">Posted {new Date(m.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-foreground/80">{m.description || "No additional description."}</p>
            <dl className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
              <div><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Quantity</dt><dd className="font-display text-lg font-semibold">{Number(m.quantity)} {m.unit}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Fair-market value</dt><dd className="font-display text-lg font-semibold text-primary">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(m.total_value_usd ?? 0))}</dd></div>
              <div className="col-span-2"><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Pickup</dt><dd>{[m.pickup_address, m.pickup_city, m.pickup_state, m.pickup_zip].filter(Boolean).join(", ") || "TBD"}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Available from</dt><dd>{m.available_from ?? "Now"}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Available until</dt><dd>{m.available_until ?? "Open"}</dd></div>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider">Donor</h3>
            <div className="mt-1 text-sm">{(m as any).profiles?.org_name || (m as any).profiles?.full_name || "Contractor"}</div>

            {roles.includes("recipient") && m.status === "available" && m.contractor_id !== user?.id ? (
              <div className="mt-6 space-y-3 border-t border-border pt-4">
                <Label>Quantity to request</Label>
                <Input type="number" min="1" max={Number(m.quantity)} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
                <Button className="w-full" onClick={request} disabled={submitting}>
                  {submitting ? "Sending…" : "Request this material"}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}