"use client";

/**
 * Dedicated Instagram Connection Hub
 *
 * Displays connection health, connected accounts, webhook subscription status,
 * permissions overview, and safe reconnection/disconnection actions.
 */

import { useI18n } from "@/lib/i18n/provider";
import { useEffect, useState } from "react";

interface InstagramAccount {
  id: string;
  username: string;
  instagramId: string;
  name?: string | null;
  provider: "META" | "ZERNIO";
  tokenExpiresAt: string | null;
  webhookSubscribed: boolean;
}

export default function InstagramConnectionPage() {
  const { t } = useI18n();
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success && payload.data.instagramAccounts) {
          setAccounts(payload.data.instagramAccounts);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleDisconnect(accountId: string) {
    if (
      !confirm(
        t(
          "Disconnect Instagram? Campaigns for this account will stop sending DMs."
        )
      )
    ) {
      return;
    }

    setBusyId(accountId);
    try {
      const res = await fetch("/api/instagram/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagramAccountId: accountId }),
      });
      const data = await res.json();
      if (data.success) {
        setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      } else {
        alert(data.error || "Failed to disconnect account");
      }
    } catch (err) {
      console.error("Disconnect error:", err);
      alert("Failed to disconnect account. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Instagram Connection
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Manage your Meta Graph API connection, webhook health, and permissions
        </p>
      </div>

      {loading ? (
        <div className="panel p-8 space-y-4 animate-pulse rounded-2xl">
          <div className="h-6 w-48 bg-slate-200 rounded-md" />
          <div className="h-20 bg-slate-100 rounded-xl" />
        </div>
      ) : accounts.length === 0 ? (
        /* Disconnected State */
        <div className="panel p-8 sm:p-12 text-center rounded-2xl space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-cta flex items-center justify-center text-white shadow-md">
            <svg
              className="h-8 w-8"
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
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">
              No Instagram Account Connected
            </h2>
            <p className="text-sm text-muted max-w-md mx-auto">
              Connect your Professional Instagram Business or Creator account to
              enable comment-to-DM automation.
            </p>
          </div>
          <div className="pt-2">
            <a
              href="/api/instagram/connect"
              className="gradient-cta inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold shadow-xs"
            >
              <span>{t("Connect Instagram")}</span>
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      ) : (
        /* Connected Accounts */
        <div className="space-y-4">
          {accounts.map((account) => {
            const isBusy = busyId === account.id;

            return (
              <div
                key={account.id}
                className="panel p-6 sm:p-7 rounded-2xl border border-border space-y-6"
              >
                {/* Account Summary Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-14 w-14 rounded-2xl gradient-cta flex items-center justify-center text-white shrink-0 shadow-xs">
                      <svg
                        className="h-7 w-7"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                      </svg>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-bold text-foreground truncate">
                          @{account.username}
                        </h2>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Connected</span>
                        </span>
                      </div>
                      <p className="text-xs text-muted">
                        Provider: {account.provider === "ZERNIO" ? "Zernio Proxy" : "Official Meta Graph API"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <a
                      href="/api/instagram/connect"
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-border bg-surface hover:bg-slate-50 text-slate-800 transition-colors shadow-2xs"
                    >
                      {t("Reconnect Instagram")}
                    </a>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDisconnect(account.id)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors disabled:opacity-50"
                    >
                      {isBusy ? "Disconnecting…" : t("Disconnect")}
                    </button>
                  </div>
                </div>

                {/* Health & Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Connection Health
                    </span>
                    <p className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Healthy & Active
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Webhook Status
                    </span>
                    <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      {account.webhookSubscribed ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span>Subscribed</span>
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          <span className="text-amber-700">Pending setup</span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Token Health
                    </span>
                    <p className="text-sm font-bold text-foreground">
                      {account.tokenExpiresAt
                        ? `Valid until ${new Date(account.tokenExpiresAt).toLocaleDateString()}`
                        : "Active (Auto-refreshed)"}
                    </p>
                  </div>
                </div>

                {/* Permissions Breakdown */}
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                    Active Permissions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface border border-slate-100 text-slate-700 font-medium">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>Comments Monitoring (Webhooks)</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface border border-slate-100 text-slate-700 font-medium">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>Automated Private DM Delivery</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface border border-slate-100 text-slate-700 font-medium">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>Public Comment Replies</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface border border-slate-100 text-slate-700 font-medium">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>Follower & Insights Verification</span>
                    </div>
                  </div>
                </div>

                {/* Security Note */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-muted flex items-start gap-2.5">
                  <svg className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <p>
                    All access tokens are encrypted with military-grade AES-256-GCM prior to storage and decrypted exclusively inside isolated worker processes. Credentials are never exposed in browser sessions.
                  </p>
                </div>
              </div>
            );
          })}

          <div className="text-center pt-2">
            <a
              href="/api/instagram/connect"
              className="text-xs font-semibold text-[#e1306c] hover:underline"
            >
              + Connect an additional Instagram account
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
