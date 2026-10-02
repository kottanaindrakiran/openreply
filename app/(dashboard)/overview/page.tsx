"use client";

/**
 * Instagram Overview Page
 *
 * Aggregate reach/engagement across your recent posts, plus a per-post table.
 * Views / reach / saved / shares come from Instagram media insights (requires
 * the insights permission); likes and comments are always available.
 */

import type { Locale } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";
import { useEffect, useState } from "react";
import AccountSelect from "@/components/account-select";
import StatCard from "@/components/stat-card";
import FollowerChart from "@/components/follower-chart";
import type { OverviewResponse } from "@/app/api/instagram/overview/route";

function formatNumber(n: number | null, locale: Locale): string {
  if (n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString(locale);
}

function formatDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

const COUNT_OPTIONS = [
  { value: "25", label: "Last 25" },
  { value: "50", label: "Last 50" },
  { value: "100", label: "Last 100" },
  { value: "all", label: "All time" },
] as const;

export default function OverviewPage() {
  const { t, locale } = useI18n();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [count, setCount] = useState("50");

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedAccountId !== "all") {
      params.set("instagramAccountId", selectedAccountId);
    }
    params.set("count", count);

    fetch(`/api/instagram/overview?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
          setError(null);
        } else {
          setError(res.error ?? "Failed to load overview");
        }
      })
      .catch(() => setError("Failed to load overview"))
      .finally(() => setLoading(false));
  }, [selectedAccountId, count]);

  function handleAccountChange(accountId: string) {
    setLoading(true);
    setSelectedAccountId(accountId);
  }

  function handleCountChange(next: string) {
    setLoading(true);
    setCount(next);
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="panel rounded p-4 h-24 sm:p-5">
            <div className="h-4 w-16 bg-zinc-200 rounded" />
            <div className="mt-3 h-6 w-20 bg-zinc-200/60 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel rounded-2xl p-10 text-center max-w-lg mx-auto border border-border my-8 space-y-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-2">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-foreground">
          {error.includes("connect") ? t("Instagram Not Connected") : t("Overview Unavailable")}
        </h3>
        <p className="text-sm text-muted max-w-sm mx-auto">
          {error === "Failed to load overview"
            ? t("Connect your Instagram professional account to view aggregate reach, impressions, and engagement metrics.")
            : error}
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <a
            href="/instagram"
            className="gradient-cta inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs"
          >
            <span>{t("Connect Instagram")}</span>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { totals, posts, accounts, insightsAvailable, followers, followerHistory } =
    data;

  return (
    <div className="space-y-6 animate-fade-in">
      {data.limitations?.map((note) => (
        <p key={note} className="text-sm text-muted">{note}</p>
      ))}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {t("Overview")}
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {data.provider !== "ZERNIO" && data.requestedCount === "all" ? t("All-time") : t("Recent")} —{" "}
            {t(totals.posts === 1 ? "{count} post" : "{count} posts", { count: totals.posts })} {t("from @")}
            {data.account.username}
            {data.truncated ? t(" (capped at {count})", { count: totals.posts }) : ""}
          </p>
          {followers !== null && (
            <p className="mt-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block">
              {followers.toLocaleString(locale)} {t("followers")}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 shadow-2xs">
            <span className="text-xs font-semibold text-muted">
              {t("Range")}:
            </span>
            <select
              value={count}
              onChange={(e) => handleCountChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-foreground outline-none cursor-pointer"
            >
              {COUNT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {t(o.label)}
                </option>
              ))}
            </select>
          </div>

          {accounts.length > 1 && (
            <AccountSelect
              accounts={accounts.map((a) => ({
                id: a.id,
                username: a.username,
                instagramId: a.id,
              }))}
              value={selectedAccountId}
              onChange={handleAccountChange}
            />
          )}
        </div>
      </div>

      {!insightsAvailable && (
        <div className="panel p-5 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-1">
          <p className="text-sm font-semibold text-amber-900">
            {t("Views, reach, saved and shares need the insights permission.")}
          </p>
          <p className="text-xs text-amber-700">
            {t("Reconnect your account to grant it — likes and comments are shown in the meantime.")}
          </p>
          <a
            href="/api/instagram/connect"
            className="mt-2 inline-block text-xs font-semibold text-[#e1306c] hover:underline"
          >
            {t("Reconnect Instagram")} →
          </a>
        </div>
      )}

      {/* Aggregate totals */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard label={t("Views")} value={formatNumber(totals.views, locale)} />
        <StatCard label={t("Reach")} value={formatNumber(totals.reach, locale)} />
        <StatCard label={t("Likes")} value={formatNumber(totals.likes, locale)} />
        <StatCard label={t("Comments")} value={formatNumber(totals.comments, locale)} />
        <StatCard label={t("Saved")} value={formatNumber(totals.saved, locale)} />
        <StatCard label={t("Shares")} value={formatNumber(totals.shares, locale)} />
      </div>

      {/* Follower trend — account-level, independent of the post range */}
      <FollowerChart data={followerHistory} followers={followers} />

      {/* Per-post table */}
      <div className="panel rounded p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">{t("Posts")}</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-muted py-8 text-center">{t("No posts found")}</p>
        ) : (
          // Eight metric columns can't compress into a phone; let the table keep
          // its natural width and scroll inside the panel instead.
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-zinc-500 border-b border-border">
                  <th className="py-2 pr-4 font-medium">{t("Post")}</th>
                  <th className="py-2 px-3 font-medium text-right">{t("Views")}</th>
                  <th className="py-2 px-3 font-medium text-right">{t("Reach")}</th>
                  <th className="py-2 px-3 font-medium text-right">{t("Likes")}</th>
                  <th className="py-2 px-3 font-medium text-right">{t("Comments")}</th>
                  <th className="py-2 px-3 font-medium text-right">{t("Saved")}</th>
                  <th className="py-2 px-3 font-medium text-right">{t("Shares")}</th>
                  <th className="py-2 pl-3 font-medium text-right">{t("Date")}</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-3 pr-4 max-w-xs">
                      {p.permalink ? (
                        <a
                          href={p.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground hover:text-accent truncate block"
                        >
                          {p.caption || t("{type} post", { type: p.mediaType })}
                        </a>
                      ) : (
                        <span className="text-foreground truncate block">
                          {p.caption || t("{type} post", { type: p.mediaType })}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-muted">
                      {formatNumber(p.views, locale)}
                    </td>
                    <td className="py-3 px-3 text-right text-muted">
                      {formatNumber(p.reach, locale)}
                    </td>
                    <td className="py-3 px-3 text-right text-muted">
                      {formatNumber(p.likes, locale)}
                    </td>
                    <td className="py-3 px-3 text-right text-muted">
                      {formatNumber(p.comments, locale)}
                    </td>
                    <td className="py-3 px-3 text-right text-muted">
                      {formatNumber(p.saved, locale)}
                    </td>
                    <td className="py-3 px-3 text-right text-muted">
                      {formatNumber(p.shares, locale)}
                    </td>
                    <td className="py-3 pl-3 text-right text-zinc-500">
                      {formatDate(p.timestamp, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
