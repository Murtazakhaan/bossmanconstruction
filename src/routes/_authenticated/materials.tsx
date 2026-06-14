import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/materials")({
  component: MaterialsList,
});

function MaterialsList() {
  const { roles } = useCurrentUser();
  const { data: materials, isLoading } = useQuery({
    queryKey: ["materials", "available"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("id, title, description, quantity, unit, total_value_usd, pickup_city, pickup_state, status, created_at, category_id, material_categories(name)")
        .eq("status", "available")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AppShell title="Materials">
      <PageHeader
        eyebrow="Browse"
        title="Available materials"
        description="Surplus construction materials available for pickup right now."
        actions={
          roles.includes("contractor") ? (
            <Button asChild>
              <Link to="/donations/new">
                <Plus className="mr-2 h-4 w-4" /> Post a donation
              </Link>
            </Button>
          ) : null
        }
      />
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : !materials?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="mb-3 h-10 w-10 text-concrete-dark" />
            <h3 className="font-display text-lg font-semibold uppercase">No materials yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Check back soon - new surplus is posted by contractors every week.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((m: any) => (
            <Link key={m.id} to="/materials/$id" params={{ id: m.id }} className="group">
              <Card className="h-full transition-colors group-hover:border-primary">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-concrete-dark">
                      {m.material_categories?.name ?? "Other"}
                    </span>
                    <StatusBadge status={m.status} />
                  </div>
                  <h3 className="font-display text-lg font-semibold uppercase">{m.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{m.description}</p>
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
                  {m.pickup_city ? (
                    <div className="mt-3 text-xs text-muted-foreground">
                      Pickup: {m.pickup_city}, {m.pickup_state}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}