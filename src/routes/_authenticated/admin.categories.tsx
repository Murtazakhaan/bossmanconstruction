import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("material_categories").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (n: string) => {
      const { error } = await supabase.from("material_categories").insert({ name: n });
      if (error) throw error;
    },
    onSuccess: () => { setName(""); toast.success("Category added"); qc.invalidateQueries({ queryKey: ["admin", "categories"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const update = useMutation({
    mutationFn: async ({ id, n }: { id: string; n: string }) => {
      const { error } = await supabase.from("material_categories").update({ name: n }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { setEditing(null); toast.success("Category renamed"); qc.invalidateQueries({ queryKey: ["admin", "categories"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("material_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Category deleted"); qc.invalidateQueries({ queryKey: ["admin", "categories"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <AdminShell title="Admin · Categories">
      <PageHeader eyebrow="Admin" title="Categories" description="Manage material categories used across listings." />
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="newcat">New category</Label>
              <Input id="newcat" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lumber" />
            </div>
            <Button onClick={() => name.trim() && create.mutate(name.trim())} disabled={create.isPending || !name.trim()}>
              {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-sm text-muted-foreground">Loading…</div>
            ) : !data?.length ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No categories yet.</div>
            ) : (
              <ul className="divide-y divide-border">
                {data.map((c: any) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    {editing && editing.id === c.id ? (
                      <>
                        <Input value={editing.name} onChange={(e) => setEditing({ id: c.id, name: e.target.value })} className="h-9 max-w-sm" />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => update.mutate({ id: c.id, n: editing.name.trim() })} disabled={!editing.name.trim()}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="font-medium">{c.name}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditing({ id: c.id, name: c.name })}><Pencil className="h-3.5 w-3.5" /></Button>
                          <ConfirmDelete onConfirm={() => del.mutate(c.id)} title="Delete category?" description="Materials using it will become uncategorized." />
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}