import React from "react";

interface StatusBadgeProps {
  status: string;
}

const STATUS_CONFIG: Record<string, { dot: string; badge: string; label: string }> = {
  draft:       { dot: "bg-slate-500",   badge: "border-slate-700 bg-slate-800 text-slate-400",         label: "Draft" },
  assigned:    { dot: "bg-sky-400",     badge: "border-sky-900 bg-sky-950 text-sky-400",               label: "Assigned" },
  in_progress: { dot: "bg-amber-400",   badge: "border-amber-900 bg-amber-950 text-amber-400",         label: "In Progress" },
  on_hold:     { dot: "bg-orange-400",  badge: "border-orange-900 bg-orange-950 text-orange-400",      label: "On Hold" },
  completed:   { dot: "bg-emerald-400", badge: "border-emerald-900 bg-emerald-950 text-emerald-400",   label: "Completed" },
  closed:      { dot: "bg-slate-600",   badge: "border-slate-700 bg-slate-800 text-slate-500",         label: "Closed" },
  cancelled:   { dot: "bg-red-500",     badge: "border-red-900 bg-red-950 text-red-400",               label: "Cancelled" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const label = config?.label ?? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const dot = config?.dot ?? "bg-slate-500";
  const badge = config?.badge ?? "border-slate-700 bg-slate-800 text-slate-400";

  return (
    <span className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-xs font-medium ${badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
      {label}
    </span>
  );
}
