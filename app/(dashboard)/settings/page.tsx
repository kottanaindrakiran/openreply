"use client";

/**
 * Settings Page
 *
 * Modern segmented SaaS settings: Workspace & Team, Instagram, Language, and Security.
 */

import LanguageSwitcher from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n/provider";
import { Suspense, useEffect, useState } from "react";
import type { AccountOption } from "@/components/account-select";
import { ZernioConnection } from "@/components/zernio-connection";
import { InstagramConnectNotice } from "@/components/instagram-connect-notice";
import Link from "next/link";

interface SettingsData {
  workspace: {
    name: string;
    dmsSentThisPeriod: number;
  };
  instagramAccount: {
    id: string;
    username: string;
    instagramId: string;
    tokenExpiresAt: string | null;
    webhookSubscribed: boolean;
  } | null;
  instagramAccounts: Array<
    AccountOption & {
      provider?: "META" | "ZERNIO";
      tokenExpiresAt: string | null;
      webhookSubscribed: boolean;
    }
  >;
}

interface WorkspaceMembersData {
  currentUserRole: "OWNER" | "ADMIN" | "MEMBER";
  members: Array<{
    id: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
    createdAt: string;
    user: {
      id: string;
      email: string | null;
      name: string | null;
    };
  }>;
  invitations: Array<{
    id: string;
    email: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
    inviteUrl: string;
    expiresAt: string;
  }>;
}

type SettingsTab = "workspace" | "instagram" | "preferences" | "security";

export default function SettingsPage() {
  const { t, label, locale } = useI18n();
  const [activeTab, setActiveTab] = useState<SettingsTab>("workspace");
  const [data, setData] = useState<SettingsData | null>(null);
  const [membersData, setMembersData] = useState<WorkspaceMembersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [memberError, setMemberError] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/stats").then((res) => res.json()),
      fetch("/api/workspace/members").then((res) => res.json()),
    ])
      .then(([statsPayload, membersPayload]) => {
        if (statsPayload.success) setData(statsPayload.data);
        if (membersPayload.success) setMembersData(membersPayload.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function refreshMembers() {
    const res = await fetch("/api/workspace/members");
    const payload = await res.json();
    if (payload.success) setMembersData(payload.data);
  }

  async function disconnectInstagram(instagramAccountId: string) {
    if (
      !confirm(
        t("Disconnect Instagram? Campaigns for this account will stop sending DMs.")
      )
    ) {
      return;
    }

    setBusy(`disconnect:${instagramAccountId}`);
    await fetch("/api/instagram/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instagramAccountId }),
    });
    window.location.reload();
  }

  async function inviteMember(event: React.FormEvent) {
    event.preventDefault();
    setMemberError(null);
    setBusy("invite");
    const res = await fetch("/api/workspace/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const payload = await res.json();
    if (payload.success) {
      setMembersData(payload.data);
      setInviteEmail("");
    } else {
      setMemberError(payload.error ?? t("Could not invite member"));
    }
    setBusy(null);
  }

  async function removeInvitation(invitationId: string) {
    setBusy(`invite:${invitationId}`);
    await fetch("/api/workspace/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId }),
    });
    await refreshMembers();
    setBusy(null);
  }

  function copyInvite(id: string, url: string) {
    void navigator.clipboard?.writeText(url);
    setCopiedInviteId(id);
    setTimeout(() => setCopiedInviteId(null), 2000);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="panel h-64 rounded-2xl bg-slate-100/50" />
      </div>
    );
  }

  const accounts = data?.instagramAccounts ?? [];
  const canManageMembers =
    membersData?.currentUserRole === "OWNER" ||
    membersData?.currentUserRole === "ADMIN";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <Suspense fallback={null}>
        <InstagramConnectNotice />
      </Suspense>

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {t("Settings")}
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Workspace administration, team members, Instagram connections, and preferences
        </p>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border scrollbar-none">
        <button
          onClick={() => setActiveTab("workspace")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "workspace"
              ? "border-[#e1306c] text-[#e1306c]"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Workspace & Team</span>
        </button>

        <button
          onClick={() => setActiveTab("instagram")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "instagram"
              ? "border-[#e1306c] text-[#e1306c]"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
          <span>Instagram ({accounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("preferences")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "preferences"
              ? "border-[#e1306c] text-[#e1306c]"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" x2="22" y1="12" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>Preferences & Language</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "security"
              ? "border-[#e1306c] text-[#e1306c]"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Security & Privacy</span>
        </button>
      </div>

      {/* Tab: Workspace & Team */}
      {activeTab === "workspace" && (
        <div className="space-y-6 animate-fade-in">
          {/* Workspace Details */}
          <section className="panel p-6 rounded-2xl border border-border space-y-4">
            <h2 className="text-base font-bold text-foreground">Workspace Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="text-xs text-muted font-medium">Workspace Name</span>
                <p className="text-base font-bold text-foreground">{data?.workspace?.name ?? "OpenReply Workspace"}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="text-xs text-muted font-medium">DMs Delivered This Period</span>
                <p className="text-base font-bold text-foreground">
                  {data?.workspace?.dmsSentThisPeriod ?? 0}
                  <span className="text-xs font-normal text-muted ml-2">(Self-hosted, unmetered)</span>
                </p>
              </div>
            </div>
          </section>

          {/* Team Members */}
          <section className="panel p-6 rounded-2xl border border-border space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">{t("Team")}</h2>
                <p className="text-xs text-muted mt-0.5">Colleagues with access to this workspace</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {membersData?.members.length ?? 1} members
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {membersData?.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                      {(member.user.name?.[0] || member.user.email?.[0] || "U").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {member.user.name ?? member.user.email?.split("@")[0] ?? t("Unknown member")}
                      </p>
                      <p className="text-xs text-muted truncate">{member.user.email}</p>
                    </div>
                  </div>

                  <span className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                    {label(member.role)}
                  </span>
                </div>
              ))}
            </div>

            {/* Pending Invites */}
            {Boolean(membersData?.invitations.length) && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  {t("Pending invites")}
                </p>
                <div className="space-y-2.5">
                  {membersData?.invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-slate-50/70"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {invitation.email}
                        </p>
                        <p className="text-[11px] text-muted">
                          Role: {label(invitation.role)} · Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyInvite(invitation.id, invitation.inviteUrl)}
                          className="px-3 py-1 rounded-lg border border-border bg-surface text-xs font-medium text-foreground hover:bg-slate-50 transition-colors shadow-2xs"
                        >
                          {copiedInviteId === invitation.id ? "Copied!" : t("Copy")}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeInvitation(invitation.id)}
                          disabled={busy === `invite:${invitation.id}`}
                          className="px-3 py-1 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                        >
                          {t("Revoke")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invite Form */}
            {canManageMembers && (
              <form onSubmit={inviteMember} className="pt-4 border-t border-slate-100 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                  Invite Teammate
                </h3>
                <div className="grid gap-3 sm:grid-cols-[1fr_130px_auto]">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    className="rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-foreground focus:border-[#e1306c] focus:outline-none shadow-2xs"
                    required
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "MEMBER")}
                    className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-[#e1306c] focus:outline-none shadow-2xs"
                  >
                    <option value="MEMBER">{t("Member")}</option>
                    <option value="ADMIN">{t("Admin")}</option>
                  </select>
                  <button
                    type="submit"
                    disabled={busy === "invite"}
                    className="gradient-cta px-4 py-2 rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {busy === "invite" ? t("Inviting...") : t("Invite")}
                  </button>
                </div>
                {memberError && <p className="text-xs text-rose-600 font-medium">{memberError}</p>}
              </form>
            )}
          </section>
        </div>
      )}

      {/* Tab: Instagram Accounts */}
      {activeTab === "instagram" && (
        <div className="space-y-6 animate-fade-in">
          <section className="panel p-6 rounded-2xl border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {t("Instagram Connection")}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Connected profiles automating comments to direct messages
                </p>
              </div>
              <Link
                href="/instagram"
                className="text-xs font-semibold text-[#e1306c] hover:underline"
              >
                Detailed Connection Health →
              </Link>
            </div>

            <div className="space-y-3">
              {accounts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    No Instagram accounts connected
                  </p>
                  <a
                    href="/api/instagram/connect"
                    className="gradient-cta inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs"
                  >
                    {t("Connect Instagram")}
                  </a>
                </div>
              ) : (
                accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-slate-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl gradient-cta flex items-center justify-center text-white shrink-0">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">@{acc.username}</p>
                        <p className="text-xs text-muted">
                          {acc.tokenExpiresAt
                            ? `Valid until ${new Date(acc.tokenExpiresAt).toLocaleDateString(locale)}`
                            : "Auto-refreshing token"} · Webhook {acc.webhookSubscribed ? "Active" : "Pending"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href="/api/instagram/connect"
                        className="px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-foreground hover:bg-slate-50 transition-colors shadow-2xs"
                      >
                        {t("Reconnect Instagram")}
                      </a>
                      <button
                        onClick={() => disconnectInstagram(acc.id)}
                        disabled={busy === `disconnect:${acc.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                      >
                        {busy === `disconnect:${acc.id}` ? t("Disconnecting...") : t("Disconnect")}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2">
              <a
                href="/api/instagram/connect"
                className="text-xs font-semibold text-[#e1306c] hover:underline"
              >
                + Connect another account via Meta
              </a>
            </div>
          </section>

          <ZernioConnection canManage={canManageMembers} />
        </div>
      )}

      {/* Tab: Preferences */}
      {activeTab === "preferences" && (
        <div className="space-y-6 animate-fade-in">
          <section className="panel p-6 rounded-2xl border border-border space-y-4">
            <h2 className="text-base font-bold text-foreground">{t("Interface language")}</h2>
            <p className="text-xs text-muted">
              Choose your preferred display language. Campaign DM copy and Instagram replies remain in whatever language you compose them.
            </p>
            <div className="pt-2">
              <LanguageSwitcher />
            </div>
          </section>
        </div>
      )}

      {/* Tab: Security & Privacy */}
      {activeTab === "security" && (
        <div className="space-y-6 animate-fade-in">
          <section className="panel p-6 rounded-2xl border border-border space-y-4">
            <h2 className="text-base font-bold text-foreground">Security & Data Privacy</h2>
            <p className="text-sm text-muted">
              OpenReply is architected with strict enterprise-grade security standards to ensure absolute safety of creator accounts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  AES-256-GCM Token Encryption
                </span>
                <p className="text-xs text-muted">
                  Instagram access tokens are encrypted with military-grade AES-256 before writing to Postgres and decrypted solely inside the worker process.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Multi-Tenant Isolation
                </span>
                <p className="text-xs text-muted">
                  Every campaign, log, and Instagram credential is fully isolated within workspace boundaries enforced by session database checks.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  HMAC Webhook Verification
                </span>
                <p className="text-xs text-muted">
                  Incoming Meta comment webhooks are cryptographically authenticated via X-Hub-Signature-256 before any queue task is processed.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" x2="12" y1="8" y2="12" />
                    <line x1="12" x2="12.01" y1="16" y2="16" />
                  </svg>
                  Zero Client-Side Token Exposure
                </span>
                <p className="text-xs text-muted">
                  Access tokens, app secrets, and database strings are never delivered to the client browser or exposed in frontend component state.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
