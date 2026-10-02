"use client";

/**
 * Sidebar Navigation
 *
 * Modern SaaS sidebar with icons, active state pills, workspace details, and profile footer.
 */

import LanguageSwitcher from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n/provider";
import Link from "next/link";
import Image from "next/image";
import { zernioLink } from "@/lib/zernio-links";
import { usePathname } from "next/navigation";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceName: string;
  userEmail?: string | null;
  userName?: string | null;
}

export default function Sidebar({
  isOpen,
  onClose,
  workspaceName,
  userEmail,
  userName,
}: SidebarProps) {
  const { t } = useI18n();
  const pathname = usePathname();

  const mainNav = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      ),
    },
    {
      label: "Campaigns",
      href: "/campaigns",
      icon: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m13 2-2 2.5V8l2-2 7 7-3.5 3.5-7-7H6L3.5 13 2 11l4.5-4.5" />
          <path d="m14 14-5 5" />
          <path d="M4 20h.01" />
        </svg>
      ),
    },
    {
      label: "DM Logs",
      href: "/logs",
      icon: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          <path d="M8 12h8" />
          <path d="M8 8h5" />
        </svg>
      ),
    },
    {
      label: "Instagram",
      href: "/instagram",
      icon: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      ),
    },
    {
      label: "Inbox",
      href: "/inbox",
      icon: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
      ),
    },
  ];

  const toolsNav = [
    {
      label: "Analytics",
      href: "/overview",
      icon: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" x2="18" y1="20" y2="10" />
          <line x1="12" x2="12" y1="20" y2="4" />
          <line x1="6" x2="6" y1="20" y2="14" />
        </svg>
      ),
    },
    {
      label: "Diagnostics",
      href: "/diagnostics",
      icon: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
    },
    {
      label: "Settings",
      href: "/settings",
      icon: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-dvh w-64 max-w-[85vw] shrink-0 bg-surface border-r border-border flex flex-col justify-between
          transition-transform duration-200 ease-out shadow-sm
          lg:h-full lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div
            className="px-5 py-4 border-b border-border flex items-center justify-between"
            style={{ paddingTop: "max(1.25rem, calc(1rem + env(safe-area-inset-top)))" }}
          >
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 group"
              onClick={onClose}
            >
              <div className="h-8 w-8 rounded-lg gradient-cta flex items-center justify-center shadow-xs">
                <svg
                  className="h-4 w-4 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-foreground group-hover:text-slate-900 leading-tight">
                  OpenReply
                </span>
                <span className="text-[10px] text-muted font-medium">Comment to DM</span>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md text-muted hover:text-foreground hover:bg-slate-100"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Workspace Pill */}
          <div className="px-4 pt-3 pb-1">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/70 text-xs">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">{workspaceName}</p>
              </div>
              <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Active</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
            {/* Main Navigation */}
            <div>
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-light">
                {t("Menu")}
              </p>
              <nav className="space-y-0.5">
                {mainNav.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      aria-current={isActive ? "page" : undefined}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                        ${
                          isActive
                            ? "bg-slate-100 text-foreground font-semibold shadow-2xs border border-slate-200/60"
                            : "text-muted hover:text-foreground hover:bg-slate-50"
                        }
                      `}
                    >
                      <span className={isActive ? "text-[#e1306c]" : "text-muted"}>
                        {item.icon}
                      </span>
                      <span className="truncate">{t(item.label)}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Tools & Settings */}
            <div>
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-light">
                {t("Settings")}
              </p>
              <nav className="space-y-0.5">
                {toolsNav.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      aria-current={isActive ? "page" : undefined}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                        ${
                          isActive
                            ? "bg-slate-100 text-foreground font-semibold shadow-2xs border border-slate-200/60"
                            : "text-muted hover:text-foreground hover:bg-slate-50"
                        }
                      `}
                    >
                      <span className={isActive ? "text-[#e1306c]" : "text-muted"}>
                        {item.icon}
                      </span>
                      <span className="truncate">{t(item.label)}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border bg-slate-50/50 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-muted font-medium">{t("Language")}</span>
            <LanguageSwitcher />
          </div>

          {/* User Account / Logout row */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface border border-border shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 border border-slate-300 flex items-center justify-center text-xs font-semibold text-slate-700 shrink-0">
                {(userName?.[0] || userEmail?.[0] || "U").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">
                  {userName || userEmail?.split("@")[0] || t("Account")}
                </p>
                <p className="text-[10px] text-muted truncate">{userEmail || t("Self-hosted")}</p>
              </div>
            </div>

            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                title={t("Logout")}
                className="p-1.5 rounded-md text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                aria-label="Sign out"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" x2="9" y1="12" y2="12" />
                </svg>
              </button>
            </form>
          </div>

          <a
            href={zernioLink({ placement: "sidebar" })}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="flex items-center justify-center gap-2 text-[11px] text-muted hover:text-foreground py-1 transition-colors"
          >
            <span>{t("Supported by")}</span>
            <Image
              src="/brand/zernio-primary.svg"
              alt="Zernio"
              width={54}
              height={16}
              className="opacity-75 hover:opacity-100"
            />
          </a>
        </div>
      </aside>
    </>
  );
}
