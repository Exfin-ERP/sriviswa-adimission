import { STATUS_LABEL, STATUS_TONE, type ApplicationStatus } from "@/lib/roles";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<string, string> = {
  muted: "bg-muted text-muted-foreground border-border",
  info: "bg-primary-soft text-primary border-primary/20",
  warning: "bg-warning/15 text-warning-foreground border-warning/30",
  success: "bg-accent-soft text-accent border-accent/25",
  destructive: "bg-destructive/10 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const tone = STATUS_TONE[status] ?? "muted";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASS[tone],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABEL[status]}
    </span>
  );
}
