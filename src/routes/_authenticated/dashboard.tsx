import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, ListChecks, HandHeart, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, roles } = useCurrentUser();
  const isContractor = roles.includes("contractor");
  const isRecipient = roles.includes("recipient");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const displayName = profile?.full_name?.trim() || (user?.email ? user.email.split("@")[0] : "");

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [materialsCount, myDonations, myTransactions] = await Promise.all([
        supabase.from("materials").select("id", { count: "exact", head: true }).eq("status", "available"),
        isContractor
          ? supabase.from("materials").select("id, total_value_usd").eq("contractor_id", user!.id)
          : Promise.resolve({ data: [], count: 0 } as any),
        supabase
          .from("transactions")
          .select("id, status, created_at, requested_quantity")
          .or(`contractor_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      const totalDonatedValue = (myDonations.data ?? []).reduce(
        (s: number, r: any) => s + Number(r.total_value_usd ?? 0),
        0,
      );
      return {
        availableCount: materialsCount.count ?? 0,
        myDonationCount: myDonations.data?.length ?? 0,
        totalDonatedValue,
        recent: myTransactions.data ?? [],
      };
    },
  });

  return (
    <AppShell title="Dashboard">
      <PageHeader
        eyebrow={isContractor ? "Contractor" : isRecipient ? "Recipient" : "Member"}
        title={`Welcome back${user?.email ? ", " + user.email.split("@")[0] : ""}.`}
        description="Here's a snapshot of your activity in BCM."
        actions={
          isContractor ? (
            <Button asChild>
              <Link to="/donations/new">
                <HandHeart className="mr-2 h-4 w-4" /> Post a donation
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/materials">
                <Package className="mr-2 h-4 w-4" /> Browse materials
              </Link>
            </Button>
          )
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Materials available"
          value={stats?.availableCount ?? "-"}
          icon={Package}
          to="/materials"
        />
        {isContractor && (
          <>
            <StatCard label="Your donations" value={stats?.myDonationCount ?? "-"} icon={HandHeart} to="/donations" />
            <StatCard
              label="Lifetime value donated"
              value={
                stats
                  ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
                      stats.totalDonatedValue,
                    )
                  : "-"
              }
              icon={ListChecks}
              to="/reports"
            />
          </>
        )}
        {!isContractor && (
          <StatCard label="Your transactions" value={stats?.recent.length ?? "-"} icon={ListChecks} to="/transactions" />
        )}
      </div>

      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display uppercase tracking-wide">Recent transactions</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/transactions">
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!stats?.recent.length ? (
            <div className="rounded-sm border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              No transactions yet. {isContractor ? "Post your first donation to get started." : "Browse available materials to make your first request."}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {stats.recent.map((t: any) => (
                <li key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">Transaction #{t.id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>
                  </div>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  to,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
}) {
  return (
    <Link to={to} className="group">
      <Card className="h-full transition-colors group-hover:border-primary">
        <CardContent className="flex items-start justify-between p-6">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
            <div className="mt-2 font-display text-3xl font-bold text-foreground">{value}</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary text-primary-foreground">
            <Icon className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}