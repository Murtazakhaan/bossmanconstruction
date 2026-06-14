import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Pencil, Plus, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

type AppRole = "admin" | "contractor" | "recipient";

function AdminPage() {
  const { roles, loading } = useCurrentUser();
  if (loading)
    return (
      <AppShell title="Admin">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  if (!roles.includes("admin")) {
    return (
      <AppShell title="Admin">
        <PageHeader eyebrow="Restricted" title="Admin area" />
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            You don't have access to this area.
          </CardContent>
        </Card>
      </AppShell>
    );
  }
  return (
    <AppShell title="Admin">
      <PageHeader
        eyebrow="Program management"
        title="Admin console"
        description="Full read/write access to users, materials, transactions, and categories."
      />
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4 flex w-full flex-wrap justify-start">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="materials"><MaterialsTab /></TabsContent>
        <TabsContent value="transactions"><TransactionsTab /></TabsContent>
        <TabsContent value="categories"><CategoriesTab /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

/* ------------------------------ USERS ------------------------------ */

function UsersTab() {
  const qc = useQueryClient();
  const { user: me } = useCurrentUser();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const [{ data: profiles, error: e1 }, { data: roles, error: e2 }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, org_name, phone, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      const roleMap = new Map<string, AppRole>();
      (roles ?? []).forEach((r: any) => roleMap.set(r.user_id, r.role));
      return (profiles ?? []).map((p: any) => ({ ...p, role: roleMap.get(p.id) ?? null }));
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to update role"),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      // Delete profile; auth.users row remains but app data is purged.
      const { error } = await supabase.from("profiles").delete().eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("User removed");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to delete"),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Org</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{u.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.org_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={u.role ?? undefined}
                      onValueChange={(v) => updateRole.mutate({ userId: u.id, role: v as AppRole })}
                      disabled={u.id === me?.id}
                    >
                      <SelectTrigger className="h-9 w-36"><SelectValue placeholder="No role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="recipient">Recipient</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ConfirmDelete
                      title="Delete this user?"
                      description="This removes the user's profile and app data. The auth account remains until you delete it from auth settings."
                      disabled={u.id === me?.id}
                      onConfirm={() => deleteUser.mutate(u.id)}
                    />
                  </td>
                </tr>
              ))}
              {!data?.length && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------------------- MATERIALS ---------------------------- */

function MaterialsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("id, title, status, quantity, unit, total_value_usd, pickup_city, pickup_state, created_at, material_categories(name)")
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

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((m: any) => (
                <tr key={m.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{m.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.material_categories?.name ?? "—"}</td>
                  <td className="px-4 py-3">{Number(m.quantity)} {m.unit}</td>
                  <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{m.pickup_city ? `${m.pickup_city}, ${m.pickup_state}` : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a href={`/materials/${m.id}/edit`}><Pencil className="h-3.5 w-3.5" /></a>
                      </Button>
                      <ConfirmDelete onConfirm={() => del.mutate(m.id)} title="Delete this material?" description="This cannot be undone." />
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No materials.</td></tr>}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/* --------------------------- TRANSACTIONS -------------------------- */

function TransactionsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, status, requested_quantity, created_at, material_id, contractor_id, recipient_id")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Transaction deleted");
      qc.invalidateQueries({ queryKey: ["admin", "transactions"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to delete"),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((t: any) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{t.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">{t.requested_quantity}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(t.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <ConfirmDelete onConfirm={() => del.mutate(t.id)} title="Delete this transaction?" description="This cannot be undone." />
                  </td>
                </tr>
              ))}
              {!data?.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No transactions.</td></tr>}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------------------- CATEGORIES --------------------------- */

function CategoriesTab() {
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
                  {editing?.id === c.id ? (
                    <>
                      <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="h-9 max-w-sm" />
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
  );
}

/* ----------------------------- HELPERS ----------------------------- */

function ConfirmDelete({
  onConfirm,
  title,
  description,
  disabled,
}: {
  onConfirm: () => void;
  title: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={disabled} className="text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}