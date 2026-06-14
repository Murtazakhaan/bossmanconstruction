import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/transactions/")({
  component: TransactionsList,
});

function TransactionsList() {
  const { user } = useCurrentUser();
  const { data, isLoading } = useQuery({
    queryKey: ["transactions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("id, status, created_at, requested_quantity, pickup_scheduled_at, materials(title, unit)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <AppShell title="Transactions">
      <PageHeader eyebrow="Pickups & deliveries" title="Transactions" description="Every donation request, scheduled pickup, and completed delivery." />
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : !data?.length ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No transactions yet.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {data.map((t: any) => (
                <li key={t.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <div className="font-medium">{t.materials?.title ?? "Material"}</div>
                    <div className="text-xs text-muted-foreground">
                      {Number(t.requested_quantity)} {t.materials?.unit} · {new Date(t.created_at).toLocaleString()}
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}