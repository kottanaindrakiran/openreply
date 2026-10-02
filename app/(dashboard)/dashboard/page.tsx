"use client";

/**
 * OpenReply Overview Dashboard
 *
 * Modern SaaS command center: live automation status, primary KPIs,
 * active campaigns table, 7-day trend chart, and real-time activity feed.
 */

import { useI18n } from "@/lib/i18n/provider";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import AccountSelect, { type AccountOption } from "@/components/account-select";
import StatCard from "@/components/stat-card";
import StatusBadge from "@/components/status-badge";

interface DashboardStats {
  userName: string | null;
  contactsCount: number;
  totalAutomations: number;
  activeAutomations: number;
  dmsSentToday: number;
  dmsSentWeek: number;
  dmsSentMonth: number;
  dmsSkippedMonth: number;
  dmsFailedMonth: number;
  totalDMs: number;
  clicksThisMonth: number;
  totalClicks: number;
  ctrThisMonth: number;
  instagramAccounts: AccountOption[];
  selectedInstagramAccountId: string | null;
  topKeywords: { keyword: string; count: number }[];
  dailyDMs: { date: string; count: number }[];
  recentLogs: Array<{
    id: string;
    commenterName: string | null;
    commentText: string;
    status: string;
    createdAt: string;
    automation: { name: string };
    instagramAccount?: { username: string };
  }>;
}

interface CampaignSummary {
  id: string;
  name: string;
  keywords: string[];
  matchAnyWord: boolean;
  matchAnyPost: boolean;
  pendingNextReel: boolean;
  postId: string | null;
  postUrl: string | null;
  dmMessage: string;
  isActive: boolean;
  _count: { dmLogs: number };
  analytics: {
    sent: number;
    skipped: number;
    failed: number;
    clicks: number;
    ctr: number;
  };
}

export default function DashboardPage() {
  const { t, label } = useI18n();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedAccountId !== "all") {
      params.set("instagramAccountId", selectedAccountId);
    }
    const query = params.size ? `?${params}` : "";

    Promise.all([
      fetch(`/api/dashboard/stats${query}`).then((r) => r.json()),
      fetch(`/api/automations${query}`).then((r) => r.json()),
    ])
      .then(([statsRes, campRes]) => {
        if (statsRes.success) setStats(statsRes.data);
        if (campRes.success) setCampaigns(campRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedAccountId]);

  function handleAccountChange(accountId: string) {
    setLoading(true);
    setSelectedAccountId(accountId);
  }

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  // Compute key metrics
  const commentsTriggered = useMemo(() => {
    if (!stats) return 0;
    return (
      (stats.dmsSentMonth ?? 0) +
      (stats.dmsSkippedMonth ?? 0) +
      (stats.dmsFailedMonth ?? 0)
    );
  }, [stats]);

  const successRate = useMemo(() => {
    if (!stats) return 100;
    const sent = stats.dmsSentMonth ?? 0;
    const failed = stats.dmsFailedMonth ?? 0;
    const total = sent + failed;
    if (total === 0) return 100;
    return Math.round((sent / total) * 100);
  }, [stats]);

  const activeCampaigns = useMemo(() => {
    return campaigns.filter((c) => c.isActive);
  }, [campaigns]);

  const connectedAccount = stats?.instagramAccounts[0] ?? null;
  const maxDM = Math.max(...(stats?.dailyDMs.map((d) => d.count) ?? [1]), 1);

  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 w-80 bg-slate-200/60 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="panel h-28 p-5 bg-slate-100/50" />
          ))}
        </div>
        <div className="h-64 panel bg-slate-100/50" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner: Greeting, Live Status & Primary CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between panel p-6 bg-gradient-to-r from-surface via-surface to-slate-50 border-border">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {timeGreeting}, {stats?.userName || "there"}!
            </h1>
            {connectedAccount ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>@{connectedAccount.username}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Not connected</span>
              </span>
            )}
          </div>
          <p className="text-sm text-muted">
            {connectedAccount
              ? "Your Instagram comment-to-DM automation is running smoothly."
              : "Connect your Instagram account to start turning comments into automatic DMs."}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {stats && stats.instagramAccounts.length > 1 && (
            <AccountSelect
              accounts={stats.instagramAccounts}
              value={selectedAccountId}
              onChange={handleAccountChange}
            />
          )}

          <Link
            href="/campaigns/new"
            className="gradient-cta inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-xs"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>{t("New Campaign")}</span>
          </Link>
        </div>
      </div>

      {/* 4 Core SaaS Dashboard Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label={t("Comments Triggered")}
          value={commentsTriggered}
          subtitle="Total matched comments"
          icon={
            <svg className="h-4 w-4 text-[#e1306c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            </svg>
          }
        />
        <StatCard
          label={t("DMs Sent")}
          value={stats?.dmsSentMonth ?? 0}
          subtitle="Delivered this period"
          trendUp={true}
          icon={
            <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          }
        />
        <StatCard
          label={t("Active Campaigns")}
          value={stats?.activeAutomations ?? 0}
          subtitle={`${stats?.totalAutomations ?? 0} total campaigns`}
          icon={
            <svg className="h-4 w-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          }
        />
        <StatCard
          label={t("Success Rate")}
          value={`${successRate}%`}
          subtitle={stats?.dmsFailedMonth ? `${stats.dmsFailedMonth} failed` : "Optimal delivery"}
          trendUp={successRate >= 95}
          icon={
            <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
      </div>

      {/* Active Campaigns Section */}
      <div className="panel p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {t("Active Campaigns")}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Campaigns currently listening for keywords on your posts
            </p>
          </div>
          <Link
            href="/campaigns"
            className="text-xs font-semibold text-[#e1306c] hover:underline"
          >
            {t("View all")} ({campaigns.length}) →
          </Link>
        </div>

        {activeCampaigns.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
            <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-muted mb-3">
              <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-foreground">No active campaigns</p>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              Create your first campaign and automatically turn Instagram comments into DMs.
            </p>
            <Link
              href="/campaigns/new"
              className="mt-4 inline-flex items-center gap-1.5 gradient-cta text-xs font-semibold px-4 py-2 rounded-lg shadow-xs"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>{t("New Campaign")}</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {activeCampaigns.slice(0, 6).map((camp) => {
              const targetDesc = camp.matchAnyPost
                ? "Any post or reel"
                : camp.pendingNextReel
                ? "Next published reel"
                : "Specific post";

              return (
                <div
                  key={camp.id}
                  className="p-4 rounded-xl border border-border bg-surface hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm text-foreground truncate flex-1">
                        {camp.name}
                      </h3>
                      <StatusBadge status="active" size="sm" />
                    </div>
                    <p className="text-xs text-muted flex items-center gap-1">
                      <svg className="h-3 w-3 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      </svg>
                      <span className="truncate">{targetDesc}</span>
                    </p>
                  </div>

                  {/* Keywords pills */}
                  <div className="flex flex-wrap gap-1">
                    {camp.matchAnyWord ? (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                        Any comment
                      </span>
                    ) : (
                      camp.keywords.slice(0, 3).map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                        >
                          {kw}
                        </span>
                      ))
                    )}
                    {camp.keywords.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 text-[11px]">
                        +{camp.keywords.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Sent count & Action */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-muted">
                      <strong className="text-foreground font-semibold">
                        {camp.analytics?.sent ?? camp._count?.dmLogs ?? 0}
                      </strong>{" "}
                      DMs sent
                    </span>
                    <Link
                      href={`/campaigns/${camp.id}/edit`}
                      className="font-medium text-[#e1306c] hover:underline"
                    >
                      {t("Edit campaign")} →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7-Day Chart & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* 7-Day Bar Chart */}
        <div className="lg:col-span-3 panel p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">
              {t("DMs — Last 7 Days")}
            </h2>
            <span className="text-xs text-muted">
              {stats?.dmsSentWeek ?? 0} sent this week
            </span>
          </div>

          <div className="flex items-end gap-2 h-44 pt-4">
            {(stats?.dailyDMs ?? []).map((day) => (
              <div
                key={label(day.date)}
                className="min-w-0 flex-1 h-full flex flex-col items-center gap-2 group"
              >
                <span className="text-[11px] text-muted font-semibold group-hover:text-foreground">
                  {day.count}
                </span>
                <div className="w-full min-h-0 flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-[#833ab4] via-[#e1306c] to-[#fcb045] transition-all group-hover:brightness-110 min-h-[4px]"
                    style={{
                      height: `${Math.max((day.count / maxDM) * 100, 5)}%`,
                    }}
                  />
                </div>
                <span className="w-full truncate text-center text-[10px] text-slate-500 font-medium">
                  {label(day.date)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 panel p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">
              {t("Recent Activity")}
            </h2>
            <Link
              href="/logs"
              className="text-xs text-[#e1306c] font-semibold hover:underline"
            >
              {t("See activity")} →
            </Link>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {!stats || stats.recentLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted">
                {t("No activity yet")}
              </div>
            ) : (
              stats.recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs font-semibold text-foreground truncate">
                      @{log.commenterName ?? "user"}
                    </p>
                    <p className="text-xs text-slate-600 truncate">
                      commented &ldquo;{log.commentText}&rdquo;
                    </p>
                    <p className="text-[10px] text-muted truncate">
                      → {log.automation?.name}
                    </p>
                  </div>
                  <div className="shrink-0 pt-0.5">
                    <StatusBadge status={log.status} size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
