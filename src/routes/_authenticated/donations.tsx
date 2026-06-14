import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/donations")({
  component: () => (
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
      <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
        Donation management UI is coming in the next pass.
      </CardContent></Card>
    </AppShell>
  ),
});