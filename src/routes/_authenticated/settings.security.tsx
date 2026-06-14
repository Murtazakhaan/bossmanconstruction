import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Lock, Eye, ShieldCheck, MailWarning } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/settings/security")({
  component: SecurityPage,
});

const items = [
  {
    icon: Lock,
    title: "Your password is private",
    body: "We never store your password in plain text. Change it any time from Settings.",
  },
  {
    icon: Eye,
    title: "What others can see",
    body: "Only your name and organization are shown to people you transact with. Your phone and address are shared only when a pickup is scheduled.",
  },
  {
    icon: ShieldCheck,
    title: "Account protection",
    body: "We monitor sign-ins and will email you if we notice anything unusual. Always sign out on shared devices.",
  },
  {
    icon: MailWarning,
    title: "Report a concern",
    body: "If you suspect someone is misusing the platform, contact us from the Settings menu and we'll investigate.",
  },
];

function SecurityPage() {
  return (
    <AppShell title="Security & Privacy">
      <div className="mx-auto max-w-2xl">
        <Link to="/settings" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to settings
        </Link>
        <PageHeader title="Security & Privacy" description="How we keep your account and information safe." />
        <div className="space-y-3">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <Card key={it.title}>
                <CardContent className="flex gap-3 p-4 sm:p-5">
                  <div className="mt-0.5 rounded-md bg-muted p-2">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold">{it.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{it.body}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}