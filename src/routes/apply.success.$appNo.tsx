import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Printer } from "lucide-react";

export const Route = createFileRoute("/apply/success/$appNo")({
  head: () => ({ meta: [{ title: "Application Submitted — Sri Viswa Admissions" }] }),
  component: Success,
});

function Success() {
  const { appNo } = Route.useParams();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Logo />
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Card><CardContent className="p-8 text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-bold">Application submitted</h1>
          <p className="text-sm text-muted-foreground">
            Your application has been received. Please note your application number for future reference.
          </p>
          <div className="mx-auto inline-block rounded-md border border-border bg-muted px-4 py-2 font-mono text-lg font-bold">{appNo}</div>
          <div className="rounded-md border border-border bg-surface p-4 text-left text-sm">
            <div className="font-medium mb-1">What happens next?</div>
            <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>Our admissions team will review your application and documents.</li>
              <li>If everything is in order, you'll receive a confirmation on your registered email/phone.</li>
              <li>Please pay the application fee at the campus to complete the process.</li>
            </ol>
          </div>
          <div className="flex justify-center gap-2 no-print">
            <Button variant="outline" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" /> Print</Button>
            <Link to="/"><Button>Return home</Button></Link>
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}
