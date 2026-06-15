import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersPage,
});

type AppRole = "admin" | "contractor" | "recipient";

function UsersPage() {
  const qc = useQueryClient();
  const { user: me } = useCurrentUser();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const [{ data: profiles, error: e1 }, { data: roles, error: e2 }, { data: contacts, error: e3 }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, org_name, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("profile_contacts").select("id, phone"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      if (e3) throw e3;
      const roleMap = new Map<string, AppRole>();
      (roles ?? []).forEach((r: any) => roleMap.set(r.user_id, r.role));
      const phoneMap = new Map<string, string | null>();
      (contacts ?? []).forEach((c: any) => phoneMap.set(c.id, c.phone ?? null));
      return (profiles ?? []).map((p: any) => ({ ...p, phone: phoneMap.get(p.id) ?? null, role: roleMap.get(p.id) ?? null }));
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
      const { error } = await supabase.from("profiles").delete().eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("User removed");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to delete"),
  });

  return (
    <AdminShell title="Admin · Users">
      <PageHeader eyebrow="Admin" title="Users" description="View, assign roles, and remove user accounts." />
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
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
                          description="This removes the user's profile and app data."
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
      )}
    </AdminShell>
  );
}