"use client";

/**
 * DM Logs Page
 *
 * Searchable, filterable log of all triggered comments and DM delivery outcomes.
 * Features an accessible desktop table and an optimized mobile card list.
 */

import { useI18n } from "@/lib/i18n/provider";
import { useEffect, useState, useCallback, useMemo } from "react";
import AccountSelect, { type AccountOption } from "@/components/account-select";
import StatusBadge from "@/components/status-badge";

interface DmLog {
  id: string;
  commenterId: string;
  commenterName: string | null;
  commentText: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  automation: { name: string; keywords: string[] };
  instagramAccount: { username: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_FILTERS = [
  "ALL",
  "SENT",
  "FAILED",
  "PENDING",
  "SKIPPED_RATE_LIMIT",
  "SKIPPED_PLAN_LIMIT",
  "SKIPPED_DEDUP",
];

export default function LogsPage() {
  const { t, label, locale } = useI18n();
  const [logs, setLogs] = useState<DmLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (selectedAccountId !== "all") {
        params.set("instagramAccountId", selectedAccountId);
      }

      const res = await fetch(`/api/logs?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, selectedAccountId]);

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
      void fetchLogs();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchLogs]);

  function handleFilterChange(status: string) {
    setLoading(true);
    setStatusFilter(status);
    setPage(1);
  }

  function handleAccountChange(accountId: string) {
    setLoading(true);
    setSelectedAccountId(accountId);
    setPage(1);
  }

  const query = search.trim().toLowerCase();
  const filteredLogs = useMemo(() => {
    if (!query) return logs;
    return logs.filter(
      (log) =>
        (log.commenterName && log.commenterName.toLowerCase().includes(query)) ||
        log.commentText.toLowerCase().includes(query) ||
        log.automation.name.toLowerCase().includes(query)
    );
  }, [logs, query]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {t("DM Logs")}
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Real-time delivery history of every comment trigger and direct message
          </p>
        </div>

        {accounts.length > 1 && (
          <div className="shrink-0">
            <AccountSelect
              accounts={accounts}
              value={selectedAccountId}
              onChange={handleAccountChange}
            />
          </div>
        )}
      </div>

      {/* Search & Filter Chips Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none"
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
              placeholder="Search by commenter handle, comment text, or campaign…"
              className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-slate-400 focus:border-[#e1306c] focus:outline-none transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange(status)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                ${
                  statusFilter === status
                    ? "gradient-cta shadow-2xs"
                    : "bg-surface text-muted border border-border hover:border-slate-300 hover:text-foreground"
                }
              `}
            >
              {label(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table View (lg:block) */}
      <div className="hidden lg:block panel rounded-xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/60 text-xs font-semibold text-muted uppercase tracking-wider">
                <th className="px-5 py-3.5">{t("Commenter")}</th>
                <th className="px-5 py-3.5">{t("Comment")}</th>
                <th className="px-5 py-3.5">{t("Campaign")}</th>
                <th className="px-5 py-3.5">{t("Account")}</th>
                <th className="px-5 py-3.5">{t("Status")}</th>
                <th className="px-5 py-3.5 text-right">{t("Time")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <>
                  {[...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-5 py-4">
                        <div className="h-5 bg-slate-100 rounded-md" />
                      </td>
                    </tr>
                  ))}
                </>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted">
                    {t("No logs found")}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-700 shrink-0">
                          {(log.commenterName?.[0] || "U").toUpperCase()}
                        </div>
                        <span className="truncate max-w-[140px]">
                          @{log.commenterName ?? log.commenterId.slice(0, 8)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <span className="text-slate-700 truncate block font-medium">
                        &ldquo;{log.commentText}&rdquo;
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/60 truncate inline-block max-w-[160px]">
                        {log.automation.name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted text-xs">
                      @{log.instagramAccount.username}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString(locale, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View (lg:hidden) */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="panel h-28 p-4 bg-slate-100/60 rounded-xl" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="panel p-8 text-center text-sm text-muted rounded-xl">
            {t("No logs found")}
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="panel p-4 rounded-xl space-y-2.5 border border-border"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-700 shrink-0">
                    {(log.commenterName?.[0] || "U").toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm text-foreground truncate">
                    @{log.commenterName ?? log.commenterId.slice(0, 8)}
                  </span>
                </div>
                <StatusBadge status={log.status} size="sm" />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-800 line-clamp-2">
                  &ldquo;{log.commentText}&rdquo;
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted pt-1 border-t border-slate-100">
                <span className="truncate max-w-[160px] font-medium text-slate-600">
                  {log.automation.name}
                </span>
                <span>
                  {new Date(log.createdAt).toLocaleDateString(locale, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {log.errorMessage && (
                <div className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded-md">
                  {log.errorMessage}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-border bg-surface shadow-2xs">
          <p className="text-xs text-muted">
            {t("Showing {start}–{end} of {total}", {
              start: (pagination.page - 1) * pagination.limit + 1,
              end: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total,
            })}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => {
                setLoading(true);
                setPage(page - 1);
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-muted border border-border bg-surface hover:text-foreground hover:border-slate-300 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              {t("Previous")}
            </button>
            <span className="text-xs font-semibold text-slate-700 px-2">
              {page} / {pagination.totalPages}
            </span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => {
                setLoading(true);
                setPage(page + 1);
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-muted border border-border bg-surface hover:text-foreground hover:border-slate-300 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              {t("Next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
