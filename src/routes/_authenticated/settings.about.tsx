import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { BcmLogo } from "@/components/bcm-logo";

export const Route = createFileRoute("/_authenticated/settings/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <AppShell title="About">
      <div className="mx-auto max-w-2xl">
        <Link to="/settings" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to settings
        </Link>
        <PageHeader title="About" description="Bossman Construction Management" />
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <BcmLogo variant="mark" className="bg-primary text-primary-foreground" />
              <div>
                <div className="font-display text-base font-bold uppercase tracking-wider">Bossman</div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Construction Mgmt</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Bossman connects U.S. contractors with low-income homeowners and nonprofits to donate surplus
              construction materials — turning leftover supplies into homes that get fixed and a tax-deductible
              receipt for the donor.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-border p-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Version</div>
                <div className="mt-1 font-semibold">1.0.0</div>
              </div>
              <div className="rounded-md border border-border p-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Built for</div>
                <div className="mt-1 font-semibold">Web & mobile</div>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <a href="#" className="text-primary hover:underline">Terms of Service</a>
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}