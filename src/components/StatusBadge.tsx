import { cn } from "@/lib/utils";

export type ProjectStatus = "upcoming" | "ready" | "ongoing";

const STYLES: Record<ProjectStatus, { label: string; classes: string }> = {
  upcoming: { label: "Upcoming", classes: "bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/30" },
  ready: { label: "Ready", classes: "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/30" },
  ongoing: { label: "Ongoing", classes: "bg-sky-500/15 text-sky-600 ring-1 ring-sky-500/30" },
};

const StatusBadge = ({ status, className }: { status: string; className?: string }) => {
  const key = (status as ProjectStatus) in STYLES ? (status as ProjectStatus) : "upcoming";
  const cfg = STYLES[key];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider", cfg.classes, className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
