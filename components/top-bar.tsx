"use client";

/**
 * Top Bar
 *
 * Page title, mobile hamburger, Instagram connection indicator, and primary action.
 */

import type { StaticMessageKey } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";
import { usePathname } from "next/navigation";
import Link from "next/link";

const pageTitles: Record<string, StaticMessageKey> = {
  "/dashboard": "Overview",
  "/overview": "Overview",
  "/inbox": "Inbox",
  "/campaigns/import": "Import campaigns",
  "/campaigns": "Campaigns",
  "/campaigns/new": "New Campaign",
  "/automations": "Campaigns",
  "/automations/new": "New Campaign",
  "/logs": "DM Logs",
  "/instagram": "Overview", // fallback translation key
  "/settings": "Settings",
  "/diagnostics": "Diagnostics",
};

interface TopBarProps {
  onMenuClick: () => void;
  instagramUsername: string | null;
  instagramAccountCount: number;
}

export default function TopBar({
  onMenuClick,
  instagramUsername,
  instagramAccountCount,
}: TopBarProps) {
  const { t } = useI18n();
  const pathname = usePathname();

  const isInstagramPage = pathname === "/instagram";
  const displayTitle = isInstagramPage
    ? "Instagram Connection"
    : (pageTitles[pathname] ??
      (pathname.endsWith("/edit")
        ? "Edit campaign"
        : pathname.startsWith("/campaigns/")
        ? "Campaign details"
        : "Overview"));

  const showCreateButton =
    pathname !== "/campaigns/new" && !pathname.endsWith("/edit");

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 border-b border-border bg-surface/90 backdrop-blur-md"
      style={{
        height: "calc(4rem + env(safe-area-inset-top))",
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden shrink-0 p-2 rounded-lg border border-border text-muted hover:text-foreground hover:bg-slate-100 transition-colors"
          aria-label={t("Toggle sidebar")}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>

        <div className="flex flex-col min-w-0">
          <h1 className="truncate text-base sm:text-lg font-bold text-foreground">
            {isInstagramPage ? "Instagram Connection" : t(displayTitle as StaticMessageKey)}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Instagram Account Connection Pill */}
        {instagramAccountCount > 0 ? (
          <Link
            href="/instagram"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs text-foreground transition-all group"
            title="View Instagram connection status"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-700 hidden sm:inline">
              Connected
            </span>
            <span className="text-muted group-hover:text-foreground font-medium truncate max-w-[130px]">
              {instagramAccountCount > 1
                ? t("{count} accounts", { count: instagramAccountCount })
                : `@${instagramUsername}`}
            </span>
          </Link>
        ) : (
          <a
            href="/api/instagram/connect"
            className="gradient-cta px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
            <span>{t("Connect Instagram")}</span>
          </a>
        )}

        {/* Primary CTA: + Create Campaign */}
        {showCreateButton && (
          <Link
            href="/campaigns/new"
            className="hidden sm:inline-flex items-center gap-1.5 gradient-cta text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-xs hover:shadow-sm"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>{t("New Campaign")}</span>
          </Link>
        )}
      </div>
    </header>
  );
}
