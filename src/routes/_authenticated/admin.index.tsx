import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Package, ListChecks, Tag, ArrowRight } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const [users, materials, txs, cats, recent, pending] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("materials").select("id", { count: "exact", head: true }),
        supabase.from("transactions").select("id", { count: "exact", head: true }),
        supabase.from("material_categories").select("id", { count: "exact", head: true }),
        supabase
          .from("transactions")
          .select("id, status, created_at, requested_quantity")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);
      return {
        users: users.count ?? 0,
        materials: materials.count ?? 0,
        transactions: txs.count ?? 0,
        categories: cats.count ?? 0,
        pending: pending.count ?? 0,
        recent: recent.data ?? [],
      };
    },
  });

  return (
    <AdminShell title="Admin">
      <PageHeader
        eyebrow="Program management"
        title="Admin dashboard"
        description="Overview of program activity and quick access to management tools."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={isLoading ? "—" : data!.users} icon={Users} to="/admin/users" />
        <StatCard label="Materials" value={isLoading ? "—" : data!.materials} icon={Package} to="/admin/materials" />
        <StatCard
          label="Transactions"
          value={isLoading ? "—" : data!.transactions}
          icon={ListChecks}
          to="/admin/transactions"
          hint={data?.pending ? `${data.pending} pending` : undefined}
        />
        <StatCard label="Categories" value={isLoading ? "—" : data!.categories} icon={Tag} to="/admin/categories" />
      </div>

      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display uppercase tracking-wide">Recent transactions</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/transactions">
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!data?.recent.length ? (
            <div className="rounded-sm border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              No transactions yet.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data.recent.map((t: any) => (
                <li key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">Transaction #{t.id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleString()} · Qty {t.requested_quantity}
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  to,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  hint?: string;
}) {
  return (
    <Link to={to} className="group">
      <Card className="h-full transition-colors group-hover:border-primary">
        <CardContent className="flex items-start justify-between p-6">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
            <div className="mt-2 font-display text-3xl font-bold text-foreground">{value}</div>
            {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary text-primary-foreground">
            <Icon className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}