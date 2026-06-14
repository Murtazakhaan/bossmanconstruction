import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { MaterialThumb } from "@/components/material-thumb";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/materials")({
  component: MaterialsPage,
});

function MaterialsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("id, title, status, quantity, unit, total_value_usd, pickup_city, pickup_state, created_at, photo_urls, material_categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Material deleted");
      qc.invalidateQueries({ queryKey: ["admin", "materials"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to delete"),
  });

  return (
    <AdminShell title="Admin · Materials">
      <PageHeader eyebrow="Admin" title="Materials" description="All donated materials across the platform." />
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(data ?? []).map((m: any) => (
            <Card key={m.id} className="overflow-hidden">
              <MaterialThumb paths={m.photo_urls} alt={m.title} />
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">{m.title}</h3>
                    <p className="text-xs text-muted-foreground">{m.material_categories?.name ?? "—"}</p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{Number(m.quantity)} {m.unit}</span>
                  {m.pickup_city ? ` · ${m.pickup_city}, ${m.pickup_state}` : null}
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to="/materials/$id" params={{ id: m.id }}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                    </Link>
                  </Button>
                  <ConfirmDelete
                    onConfirm={() => del.mutate(m.id)}
                    title="Delete this material?"
                    description="This cannot be undone."
                  >
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </ConfirmDelete>
                </div>
              </CardContent>
            </Card>
          ))}
          {!data?.length && (
            <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
              No materials yet.
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}