import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { MaterialThumb } from "@/components/material-thumb";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/donations/")({
  component: DonationsPage,
});

function DonationsPage() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();

  const { data: materials, isLoading } = useQuery({
    queryKey: ["my-donations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("id, title, description, quantity, unit, total_value_usd, status, created_at, pickup_city, pickup_state, photo_urls, material_categories(name)")
        .eq("contractor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function handleDelete(id: string) {
    if (!confirm("Delete this donation? This cannot be undone.")) return;
    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Donation deleted");
    qc.invalidateQueries({ queryKey: ["my-donations", user?.id] });
    qc.invalidateQueries({ queryKey: ["materials", "available"] });
  }

  return (
    <AppShell title="My Donations">
      <PageHeader
        eyebrow="Contractor"
        title="My donations"
        description="Manage the surplus you've posted to the community."
        actions={
          <Button asChild>
            <Link to="/donations/new"><Plus className="mr-2 h-4 w-4" /> Post a donation</Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : !materials?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="mb-3 h-10 w-10 text-concrete-dark" />
            <h2 className="font-display text-lg font-semibold uppercase">No donations yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Post your first material donation to start routing surplus to the community.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((m: any) => (
            <Card key={m.id} className="h-full">
              <CardContent className="flex h-full flex-col p-5">
                <div className="mb-4">
                  <MaterialThumb paths={m.photo_urls} alt={m.title} />
                </div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-concrete-dark">
                    {m.material_categories?.name ?? "Other"}
                  </span>
                  <StatusBadge status={m.status} />
                </div>

                <Link to="/materials/$id" params={{ id: m.id }} className="block">
                  <h3 className="font-display text-lg font-semibold uppercase hover:text-primary">
                    {m.title}
                  </h3>
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{m.description || "No description added."}</p>

                <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Quantity</div>
                    <div className="font-display text-sm font-semibold">
                      {Number(m.quantity)} {m.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Value</div>
                    <div className="font-display text-sm font-semibold text-primary">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(m.total_value_usd ?? 0))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  {m.pickup_city ? `Pickup: ${m.pickup_city}, ${m.pickup_state}` : "Pickup location not added"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Posted {new Date(m.created_at).toLocaleDateString()}
                </div>

                <div className="mt-5 flex gap-2 pt-2">
                  <Button asChild className="flex-1">
                    <Link to="/materials/$id/edit" params={{ id: m.id }}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Link>
                  </Button>
                  <Button type="button" variant="destructive" size="icon" onClick={() => handleDelete(m.id)} aria-label={`Delete ${m.title}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}