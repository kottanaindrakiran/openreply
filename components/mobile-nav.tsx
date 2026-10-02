"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";

export default function MobileNav() {
  const { t } = useI18n();
  const pathname = usePathname();

  const navItems = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: (active: boolean) => (
        <svg
          className={`h-5 w-5 ${active ? "text-[#e1306c]" : "text-muted"}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
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
      icon: (active: boolean) => (
        <svg
          className={`h-5 w-5 ${active ? "text-[#e1306c]" : "text-muted"}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m13 2-2 2.5V8l2-2 7 7-3.5 3.5-7-7H6L3.5 13 2 11l4.5-4.5" />
          <path d="m14 14-5 5" />
          <path d="M4 20h.01" />
        </svg>
      ),
    },
    {
      label: "DM Logs",
      href: "/logs",
      icon: (active: boolean) => (
        <svg
          className={`h-5 w-5 ${active ? "text-[#e1306c]" : "text-muted"}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          <path d="M8 12h8" />
          <path d="M8 8h5" />
        </svg>
      ),
    },
    {
      label: "Instagram",
      href: "/instagram",
      icon: (active: boolean) => (
        <svg
          className={`h-5 w-5 ${active ? "text-[#e1306c]" : "text-muted"}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      ),
    },
    {
      label: "Settings",
      href: "/settings",
      icon: (active: boolean) => (
        <svg
          className={`h-5 w-5 ${active ? "text-[#e1306c]" : "text-muted"}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-surface/95 backdrop-blur-md px-2 py-2 lg:hidden shadow-lg"
      style={{
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}
    >
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center justify-center min-w-[60px] py-1 px-2 rounded-lg text-[11px] font-medium transition-colors ${
              isActive
                ? "text-[#e1306c] font-semibold"
                : "text-muted hover:text-foreground active:scale-95"
            }`}
          >
            {item.icon(isActive)}
            <span className="mt-1 truncate">{t(item.label)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
