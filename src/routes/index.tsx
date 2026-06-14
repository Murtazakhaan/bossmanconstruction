import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, HardHat, Recycle, Receipt, MessagesSquare, Truck, BadgeCheck } from "lucide-react";
import { BcmLogo } from "@/components/bcm-logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bossman Construction Management - Donate & Receive Surplus Materials" },
      {
        name: "description",
        content:
          "Bossman Construction Management routes contractors' surplus materials to U.S. homeowners and nonprofits that need them - with tracking, pickups, and tax-deductible documentation.",
      },
      { property: "og:title", content: "Bossman Construction Management" },
      {
        property: "og:description",
        content:
          "Cut construction waste. Lower building costs for families. Document every donation for tax season.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* NAV */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <BcmLogo variant="mark" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium uppercase tracking-wide text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#who" className="hover:text-foreground">Who it's for</a>
            <a href="#impact" className="hover:text-foreground">Impact</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth" search={{ mode: "signup" }}>Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border bg-concrete-texture">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/40" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div>
            <h1 className="font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-primary md:text-7xl">
              Don't dump it.
              <br />
              <span className="text-foreground">Donate it.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/80">
              Bossman Construction Management connects contractors with leftover materials to
              homeowners and nonprofits who need them. Track every pickup, message in-app, and
              document tax-deductible donations - all in one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-12 px-6 text-sm font-semibold uppercase tracking-wider">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Start donating <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 border-primary bg-transparent px-6 text-sm font-semibold uppercase tracking-wider">
                <Link to="/auth" search={{ mode: "signup", role: "recipient" }}>
                  I need materials
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12 max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-concrete-dark">
              How it works
            </div>
            <h2 className="mt-2 font-display text-4xl font-bold uppercase tracking-tight text-foreground">
              From job site to family - in four steps.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { icon: HardHat, title: "List surplus", body: "Contractors post leftover lumber, drywall, insulation, doors - with quantities, value, and a photo." },
              { icon: Recycle, title: "Get requested", body: "Recipients browse available materials and request what they need with a preferred pickup time." },
              { icon: Truck, title: "Schedule pickup", body: "Confirm pickup location and time. Status updates keep both sides in the loop in real time." },
              { icon: Receipt, title: "Document the value", body: "Every completed donation rolls into an annual tax summary, ready to download in January." },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative rounded-sm border border-border bg-background p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-display text-3xl font-bold text-concrete">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="font-display text-lg font-semibold uppercase text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section id="who" className="border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-20 md:grid-cols-2">
          <div className="rounded-sm border border-border bg-card p-8">
            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-concrete-dark">
              For contractors
            </div>
            <h3 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight">
              Turn waste into a write-off.
            </h3>
            <ul className="mt-6 space-y-3 text-sm text-foreground/80">
              {[
                "Skip the dumpster fee on leftover materials.",
                "Document fair-market value of every donation automatically.",
                "One-click annual tax summary for your accountant.",
                "Build goodwill in the communities you build in.",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-sm border border-border bg-card p-8">
            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-concrete-dark">
              For homeowners & nonprofits
            </div>
            <h3 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight">
              Build for less. Build with dignity.
            </h3>
            <ul className="mt-6 space-y-3 text-sm text-foreground/80">
              {[
                "Browse real surplus from real local contractors.",
                "Request exactly what you need - no minimums.",
                "Coordinate pickup in-app, no phone tag.",
                "Free of charge. No catch.",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* IMPACT / CTA */}
      <section id="impact" className="bg-navy-texture text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-20 md:grid-cols-3 md:items-center">
          <div className="md:col-span-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-warning">
              Why it matters
            </div>
            <h2 className="mt-2 font-display text-4xl font-bold uppercase leading-tight tracking-tight md:text-5xl">
              Construction is the largest single source of waste in America.
            </h2>
            <p className="mt-4 max-w-2xl text-primary-foreground/80">
              Roughly 600 million tons of construction and demolition debris hit U.S. landfills
              every year. A meaningful slice of that is brand-new material a family across town
              could put straight into a wall. BCM closes the loop.
            </p>
          </div>
          <div className="rounded-sm border border-warning bg-card p-6 text-foreground">
            <MessagesSquare className="mb-3 h-6 w-6 text-primary" />
            <h3 className="font-display text-xl font-bold uppercase">Ready to start?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your account in under a minute. No fees, ever.
            </p>
            <Button asChild className="mt-4 w-full">
              <Link to="/auth" search={{ mode: "signup" }}>
                Get started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 py-8 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              © {new Date().getFullYear()} Bossman Construction Management
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
