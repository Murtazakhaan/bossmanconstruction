import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Mail, Phone, MessageSquare } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/settings/contact")({
  component: ContactPage,
});

function ContactPage() {
  return (
    <AppShell title="Contact Us">
      <div className="mx-auto max-w-2xl">
        <Link to="/settings" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to settings
        </Link>
        <PageHeader title="Contact Us" description="We're here to help — usually within one business day." />
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4 sm:p-5">
              <a href="mailto:support@bossman.app" className="flex items-center gap-3">
                <div className="rounded-md bg-muted p-2"><Mail className="h-5 w-5" /></div>
                <div>
                  <div className="font-semibold">Email support</div>
                  <div className="text-sm text-muted-foreground">support@bossman.app</div>
                </div>
              </a>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-5">
              <a href="tel:+18005551234" className="flex items-center gap-3">
                <div className="rounded-md bg-muted p-2"><Phone className="h-5 w-5" /></div>
                <div>
                  <div className="font-semibold">Call us</div>
                  <div className="text-sm text-muted-foreground">+1 (800) 555-1234 · Mon–Fri, 9am–5pm CT</div>
                </div>
              </a>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 p-4 sm:p-5">
              <div className="rounded-md bg-muted p-2"><MessageSquare className="h-5 w-5" /></div>
              <div>
                <div className="font-semibold">In-app chat</div>
                <p className="text-sm text-muted-foreground">
                  Already have a transaction in progress? Message the other party directly from the transaction page.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}