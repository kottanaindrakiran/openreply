"use client";

import type { StaticMessageKey } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";

/**
 * Modern SaaS status badge with indicator dot and accessible colors.
 */
interface BadgeStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
  label: StaticMessageKey;
}

const statusConfig: Record<string, BadgeStyle> = {
  SENT: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    label: "Sent",
  },
  FAILED: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
    label: "Failed",
  },
  PENDING: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    label: "Pending",
  },
  QUEUED: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    label: "Pending",
  },
  SKIPPED_DEDUP: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
    label: "Dedup",
  },
  SKIPPED_RATE_LIMIT: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    label: "Rate limited",
  },
  SKIPPED_PLAN_LIMIT: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    label: "Skipped",
  },
  SKIPPED_NO_MATCH: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
    label: "No match",
  },
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    label: "Active",
  },
  paused: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
    label: "Paused",
  },
};

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const { t } = useI18n();
  const config = statusConfig[status] ?? statusConfig.PENDING;

  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium shrink-0 whitespace-nowrap ${
        isSmall ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      } ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`rounded-full shrink-0 ${isSmall ? "h-1.5 w-1.5" : "h-2 w-2"} ${config.dot}`} />
      <span>{t(config.label)}</span>
    </span>
  );
}
