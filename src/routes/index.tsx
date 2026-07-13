import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, GraduationCap, ShieldCheck, Building2, FileCheck2, CreditCard, ClipboardList } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

const APPLY_CATEGORIES = [
  {
    title: "Sri Viswa Jr College",
    description: "Intermediate, MPC, BiPC, long-term and residential admissions.",
    search: { type: "intermediate" as const },
  },
  {
    title: "Sri Viswa Degree College",
    description: "Degree programs including B.Sc, BBA and B.Com admissions.",
    search: { type: "degree" as const },
  },
  {
    title: "Sri Viswa Co Schools",
    description: "School day-scholar and hostler admissions from Class III to X.",
    search: { type: "school" as const },
  },
] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sri Viswa Admissions — Apply Online" },
      { name: "description", content: "Apply online to Sri Viswa Group of Institutions — School, Intermediate, Degree and hostel-linked admissions across our campuses." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Logo size={44} />
          <nav className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost">Staff Sign in</Button></Link>
            <Link to="/apply"><Button>Apply Now <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/12),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Admissions Open — Academic Year 2026-2027
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
              Your journey with <span className="text-primary">Sri Viswa</span> starts here.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              One centralized portal to apply to any Sri Viswa institution across our campuses. Fill your application,
              upload documents and track your admission from a single workflow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/apply">
                <Button size="lg" className="h-12 px-6 text-base">
                  Start Application <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#institutions">
                <Button size="lg" variant="outline" className="h-12 px-6 text-base">
                  Explore Programs
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="institutions" className="border-t border-border bg-surface-muted py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Apply to any of our institutions</h2>
          <p className="mt-2 text-muted-foreground">Choose the admission category to prefill the Sri Viswa start flow.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {APPLY_CATEGORIES.map((category) => (
              <Link
                key={category.title}
                to="/apply"
                search={category.search}
                className="group rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] hover:border-primary/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="mt-4 font-semibold">{category.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{category.description}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">How admissions work</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              { icon: ClipboardList, title: "1. Fill Application", desc: "Complete the guided multi-step application form." },
              { icon: FileCheck2, title: "2. Upload Documents", desc: "Submit your marks memos, TC, ID and other proofs." },
              { icon: CreditCard, title: "3. Pay Fee", desc: "Pay your admission fee securely online." },
              { icon: ShieldCheck, title: "4. Get Confirmation", desc: "Our team verifies and confirms your admission." },
            ].map((s) => (
              <div key={s.title} className="rounded-xl border border-border bg-card p-6">
                <s.icon className="h-6 w-6 text-accent" />
                <div className="mt-3 font-semibold">{s.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <Logo size={36} />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            © {new Date().getFullYear()} Sri Viswa Group of Institutions. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
