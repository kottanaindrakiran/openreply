"use client";

/**
 * Stat Card — Modern SaaS metric panel with label, value, icon, and trend badge.
 */
interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: React.ReactNode;
  subtitle?: string;
}

export default function StatCard({
  label,
  value,
  trend,
  trendUp,
  icon,
  subtitle,
}: StatCardProps) {

  return (
    <div className="panel panel-hover p-4 sm:p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs sm:text-sm font-medium text-muted truncate">{label}</p>
        {icon && (
          <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{value}</p>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
              trendUp
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            <span>{trendUp ? "↑" : "↓"}</span>
            <span>{trend}</span>
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1.5 text-xs text-muted truncate">{subtitle}</p>}
    </div>
  );
}
