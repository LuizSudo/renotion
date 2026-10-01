"use client";

import { Check } from "lucide-react";
import { Priority } from "@/lib/types";

export function Checkbox({
  checked,
  onChange,
  size = 15,
  ariaLabel = 'Checkbox',
}: {
  checked: boolean;
  onChange?: () => void;
  size?: number;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      aria-label={ariaLabel}
      style={{ width: size, height: size }}
      className={`
        flex shrink-0 items-center justify-center rounded-[4px] border transition-colors
        ${checked
          ? "border-primary bg-primary"
          : "border-border bg-card hover:border-ring/50"
        }
      `}
    >
      {checked && <Check size={size - 5} strokeWidth={3} className="text-primary-foreground" />}
    </button>
  );
}

const priorityStyles: Record<Priority, string> = {
  HIGH: "bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400",
  MED: "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400",
  LOW: "bg-muted text-muted-foreground",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${priorityStyles[priority]}`}>
      {priority}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: Priority }) {
  const dot: Record<Priority, string> = {
    HIGH: "bg-red-500",
    MED: "bg-amber-500",
    LOW: "bg-muted-foreground",
  };
  const labels: Record<Priority, string> = {
    HIGH: "Alta",
    MED: "Média",
    LOW: "Baixa",
  };
  return (
    <span className="flex items-center gap-1.5 text-[13px] text-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${dot[priority]}`} />
      {labels[priority]}
    </span>
  );
}

export function SectionLabel({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-wide text-muted-foreground">
      <span>{children}</span>
      {count !== undefined && (
        <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {count}
        </span>
      )}
    </div>
  );
}