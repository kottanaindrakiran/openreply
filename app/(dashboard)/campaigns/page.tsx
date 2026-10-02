"use client";

/**
 * Campaigns List Page
 *
 * Modern SaaS campaign management: visual campaign cards with live thumbnails,
 * keyword badges, quick status toggle, analytics summary, and lightbox reel player.
 */

import { useI18n } from "@/lib/i18n/provider";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AccountSelect, { type AccountOption } from "@/components/account-select";
import StatusBadge from "@/components/status-badge";
import { readCache, writeCache } from "@/lib/client-cache";

interface Campaign {
  id: string;
  name: string;
  goal: string | null;
  postId: string | null;
  postUrl: string | null;
  pendingNextReel: boolean;
  matchAnyPost: boolean;
  keywords: string[];
  matchAnyWord: boolean;
  dmMessage: string;
  openingDmEnabled: boolean;
  openingDmMessage: string | null;
  openingDmButtonLabel: string | null;
  publicReplyEnabled: boolean;
  publicReplyMessage: string | null;
  publicReplyMessages: string[];
  requireFollow: boolean;
  followPromptMessage: string | null;
  followPromptButtonLabel: string | null;
  isActive: boolean;
  wholeWordMatch: boolean;
  instagramAccountId: string;
  instagramAccount: {
    username: string;
    instagramId: string;
  };
  reportShareSlug: string | null;
  reportShareEnabled: boolean;
  reportUrl: string | null;
  createdAt: string;
  _count: { dmLogs: number };
  trackedLinks: Array<{
    id: string;
    slug: string;
    label: string | null;
    destinationUrl: string;
    trackedUrl: string;
    _count: { clicks: number };
  }>;
  analytics: {
    sent: number;
    skipped: number;
    failed: number;
    clicks: number;
    ctr: number;
    topKeywords: { keyword: string; count: number }[];
  };
}

export default function CampaignsPage() {
  const { t, label } = useI18n();
  const router = useRouter();
  const [automations, setAutomations] = useState<Campaign[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [videos, setVideos] = useState<Record<string, string>>({});
  const [playingVideo, setPlayingVideo] = useState<{
    url: string;
    postUrl: string | null;
  } | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">(
    "all"
  );

  const fetchAutomations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedAccountId !== "all") {
        params.set("instagramAccountId", selectedAccountId);
      }
      const res = await fetch(
        `/api/automations${params.size ? `?${params}` : ""}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data.success) setAutomations(data.data);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) setAccounts(payload.data.instagramAccounts ?? []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchAutomations();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchAutomations]);

  useEffect(() => {
    if (automations.length === 0) return;
    let cancelled = false;
    const accountIds = Array.from(
      new Set(automations.map((a) => a.instagramAccountId))
    ).sort();
    const cacheKey = `ig-media:${accountIds.join(",")}`;

    const cached = readCache<{
      thumbs: Record<string, string>;
      videos: Record<string, string>;
    }>(cacheKey, 15 * 60 * 1000);
    if (cached.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThumbnails(cached.data.thumbs);
      setVideos(cached.data.videos);
    }

    Promise.all(
      accountIds.map((accountId) =>
        fetch(`/api/instagram/posts?instagramAccountId=${accountId}&limit=50`)
          .then((res) => res.json())
          .then((payload) =>
            payload.success
              ? (payload.data as {
                  id: string;
                  media_type?: string;
                  media_url?: string;
                  thumbnail_url?: string;
                }[])
              : []
          )
          .catch(() => [])
      )
    ).then((lists) => {
      if (cancelled) return;
      const thumbs: Record<string, string> = {};
      const vids: Record<string, string> = {};
      for (const list of lists) {
        for (const media of list) {
          const url = media.thumbnail_url ?? media.media_url;
          if (url) thumbs[media.id] = url;
          if (media.media_type === "VIDEO" && media.media_url) {
            vids[media.id] = media.media_url;
          }
        }
      }
      setThumbnails(thumbs);
      setVideos(vids);
      writeCache(cacheKey, { thumbs, videos: vids });
    });

    return () => {
      cancelled = true;
    };
  }, [automations]);

  useEffect(() => {
    if (!playingVideo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPlayingVideo(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playingVideo]);

  function handleAccountChange(accountId: string) {
    setLoading(true);
    setSelectedAccountId(accountId);
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await fetch(`/api/automations?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive: !isActive } : a))
      );
    } catch (err) {
      console.error("Failed to toggle:", err);
    }
  }

  async function copyReelUrl(auto: Campaign) {
    setMenuOpenId(null);
    if (!auto.postUrl) return;
    try {
      await navigator.clipboard.writeText(auto.postUrl);
      setCopiedId(auto.id);
      window.setTimeout(
        () => setCopiedId((cur) => (cur === auto.id ? null : cur)),
        1500
      );
    } catch (err) {
      console.error("Failed to copy reel URL:", err);
    }
  }

  async function deleteAutomation(id: string) {
    if (!confirm(t("Delete this campaign? This cannot be undone."))) return;
    try {
      await fetch(`/api/automations?id=${id}`, { method: "DELETE" });
      setAutomations((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  }

  async function duplicateAutomation(id: string) {
    setMenuOpenId(null);
    try {
      const res = await fetch(`/api/automations/duplicate?id=${id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) void fetchAutomations();
      else console.error("Duplicate failed:", data.error);
    } catch (err) {
      console.error("Failed to duplicate:", err);
    }
  }

  if (loading && automations.length === 0) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 rounded-lg" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="panel p-6 h-36 bg-slate-100/50" />
        ))}
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const filtered = automations.filter((a) => {
    if (statusFilter === "active" && !a.isActive) return false;
    if (statusFilter === "paused" && a.isActive) return false;
    if (!query) return true;
    return (
      a.name.toLowerCase().includes(query) ||
      a.keywords.some((k) => k.toLowerCase().includes(query)) ||
      a.dmMessage.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {t("Campaigns")}
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {filtered.length !== automations.length
              ? t("{count} of {total} campaigns", { count: filtered.length, total: automations.length })
              : t(automations.length === 1 ? "{count} campaign" : "{count} campaigns", { count: automations.length })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {accounts.length > 1 && (
            <AccountSelect
              accounts={accounts}
              value={selectedAccountId}
              onChange={handleAccountChange}
            />
          )}

          <Link
            href="/campaigns/import"
            className="px-3.5 py-2 rounded-xl border border-border bg-surface hover:bg-slate-50 text-xs font-semibold text-foreground transition-colors shadow-2xs"
          >
            {t("Import")}
          </Link>

          <Link
            href="/campaigns/new"
            className="gradient-cta inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-xs"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>{t("New Campaign")}</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      {automations.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" x2="16.65" y1="21" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Search campaigns by name, keyword, or message…")}
              className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-slate-400 focus:border-[#e1306c] focus:outline-none transition-all shadow-2xs"
            />
          </div>

          <div className="inline-flex rounded-xl bg-slate-100/80 p-1 border border-slate-200/60 self-start sm:self-auto">
            {(["all", "active", "paused"] as const).map((s) => (
              <button
                key={label(s)}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                  statusFilter === s
                    ? "bg-surface text-foreground shadow-2xs"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {label(s)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {automations.length === 0 && (
        <div className="panel p-10 sm:p-14 text-center rounded-2xl">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-50 to-amber-50 border border-rose-100 flex items-center justify-center text-[#e1306c] mb-4 shadow-xs">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m13 2-2 2.5V8l2-2 7 7-3.5 3.5-7-7H6L3.5 13 2 11l4.5-4.5" />
              <path d="m14 14-5 5" />
              <path d="M4 20h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1.5">{t("No campaigns yet")}</h3>
          <p className="text-sm text-muted mb-6 max-w-md mx-auto">
            {t("Create your first comment-to-DM campaign to turn a post or reel into a measurable conversation flow.")}
          </p>
          <Link
            href="/campaigns/new"
            className="gradient-cta inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-xs"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>{t("Create Campaign")}</span>
          </Link>
        </div>
      )}

      {/* No Search Matches */}
      {automations.length > 0 && filtered.length === 0 && (
        <div className="panel p-10 text-center text-sm text-muted rounded-xl">
          {t("No campaigns match your search.")}
        </div>
      )}

      {/* Campaign Cards List */}
      <div className="space-y-3.5">
        {filtered.map((auto) => {
          const videoUrl = auto.postId ? videos[auto.postId] : undefined;
          const targetDesc = auto.matchAnyPost
            ? "Any post or reel"
            : auto.pendingNextReel
            ? "Next reel"
            : "Specific post";

          return (
            <div
              key={auto.id}
              onClick={() => router.push(`/campaigns/${auto.id}`)}
              className="panel panel-hover p-4 sm:p-5 rounded-xl cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Media Thumbnail + Core Info */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {auto.postId && thumbnails[auto.postId] ? (
                    videoUrl ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlayingVideo({ url: videoUrl, postUrl: auto.postUrl });
                        }}
                        aria-label={t("Play reel preview")}
                        className="relative shrink-0 group/thumb rounded-lg overflow-hidden border border-border"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumbnails[auto.postId]}
                          alt={t("Campaign reel")}
                          className="w-14 h-14 object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                          <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      </button>
                    ) : (
                      <a
                        href={auto.postUrl ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 rounded-lg overflow-hidden border border-border"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumbnails[auto.postId]}
                          alt={t("Campaign post")}
                          className="w-14 h-14 object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </a>
                    )
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                        {auto.name}
                      </h3>
                      <StatusBadge status={auto.isActive ? "active" : "paused"} size="sm" />
                      <span className="text-[11px] font-medium text-muted bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-full">
                        @{auto.instagramAccount.username}
                      </span>
                      {auto.pendingNextReel && (
                        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          {t("Waiting for next reel")}
                        </span>
                      )}
                      {auto.requireFollow && (
                        <span className="text-[11px] font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                          {t("Follow gate")}
                        </span>
                      )}
                    </div>

                    {/* Keywords pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-muted font-medium">Trigger:</span>
                      {auto.matchAnyWord ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                          Any comment
                        </span>
                      ) : (
                        auto.keywords.map((kw) => (
                          <span
                            key={kw}
                            className="px-2 py-0.5 rounded-md bg-rose-50 text-[#e1306c] text-xs font-semibold border border-rose-100"
                          >
                            {kw}
                          </span>
                        ))
                      )}
                      <span className="text-muted text-xs">·</span>
                      <span className="text-xs text-muted truncate">{targetDesc}</span>
                    </div>

                    {/* DM Snippet */}
                    <p className="text-xs text-slate-500 line-clamp-1 italic">
                      &ldquo;{auto.dmMessage}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Right side: Stats & Controls */}
                <div
                  className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Performance metrics */}
                  <div className="text-right text-xs space-y-0.5 pr-2">
                    <p className="font-bold text-foreground text-sm">
                      {auto.analytics?.sent ?? auto._count.dmLogs}{" "}
                      <span className="font-normal text-xs text-muted">DMs sent</span>
                    </p>
                    <p className="text-[11px] text-muted">
                      {auto.analytics?.ctr ?? 0}% CTR · {auto.analytics?.clicks ?? 0} clicks
                    </p>
                  </div>

                  {/* Toggle active switch */}
                  <button
                    type="button"
                    onClick={() => toggleActive(auto.id, auto.isActive)}
                    role="switch"
                    aria-checked={auto.isActive}
                    aria-label={`Toggle campaign ${auto.name}`}
                    className={`
                      relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                      ${auto.isActive ? "bg-emerald-500" : "bg-slate-200"}
                    `}
                  >
                    <span
                      className={`
                        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out
                        ${auto.isActive ? "translate-x-5" : "translate-x-0"}
                      `}
                    />
                  </button>

                  {/* Kebab action menu */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setMenuOpenId((cur) => (cur === auto.id ? null : auto.id))
                      }
                      aria-label={t("More actions")}
                      className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-slate-100 transition-colors"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </svg>
                    </button>

                    {menuOpenId === auto.id && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setMenuOpenId(null)}
                        />
                        <div className="absolute right-0 z-30 mt-1 w-44 rounded-xl border border-border bg-surface p-1.5 shadow-lg space-y-0.5">
                          <Link
                            href={`/campaigns/${auto.id}/edit`}
                            className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs font-medium text-foreground rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <svg className="h-3.5 w-3.5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            </svg>
                            <span>{t("Edit campaign")}</span>
                          </Link>

                          <button
                            onClick={() => void duplicateAutomation(auto.id)}
                            className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs font-medium text-foreground rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <svg className="h-3.5 w-3.5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                            </svg>
                            <span>{t("Duplicate")}</span>
                          </button>

                          {auto.postUrl && (
                            <button
                              onClick={() => void copyReelUrl(auto)}
                              className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs font-medium text-foreground rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              <svg className="h-3.5 w-3.5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                              </svg>
                              <span>{copiedId === auto.id ? t("Copied!") : t("Copy URL")}</span>
                            </button>
                          )}

                          <div className="border-t border-slate-100 my-1" />

                          <button
                            onClick={() => {
                              setMenuOpenId(null);
                              void deleteAutomation(auto.id);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs font-medium text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                            <span>{t("Delete")}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reel Lightbox Modal */}
      {playingVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
          onClick={() => setPlayingVideo(null)}
        >
          <div
            className="relative flex max-w-full flex-col items-end gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 text-xs font-semibold">
              {playingVideo.postUrl && (
                <a
                  href={playingVideo.postUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-300 hover:text-white"
                >
                  {t("Open on Instagram")}
                </a>
              )}
              <button
                type="button"
                onClick={() => setPlayingVideo(null)}
                className="text-slate-300 hover:text-white"
              >
                {t("Close")}
              </button>
            </div>
            <video
              src={playingVideo.url}
              controls
              autoPlay
              loop
              playsInline
              className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
