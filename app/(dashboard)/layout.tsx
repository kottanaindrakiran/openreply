import { I18nProvider } from "@/lib/i18n/provider";
import { getI18n } from "@/lib/i18n/server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard-shell";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { ensureWorkspaceForUser } from "@/lib/workspace";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("OpenReply - Open source Instagram comment-to-DM automation") };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = await getI18n();
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  let workspaceName = "OpenReply Workspace";
  let instagramUsername: string | null = null;
  let instagramAccountCount = 0;

  try {
    const workspace = await ensureWorkspaceForUser(
      session.user.id,
      session.user.email
    );
    workspaceName = workspace.name;
    const accounts = await prisma.instagramAccount.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { connectedAt: "desc" },
      select: { username: true },
    });
    instagramUsername = accounts[0]?.username ?? null;
    instagramAccountCount = accounts.length;
  } catch (err) {
    console.warn("Could not load workspace for user:", err);
  }

  return (
    <I18nProvider locale={locale}>
      <DashboardShell
        workspaceName={workspaceName}
        instagramUsername={instagramUsername}
        instagramAccountCount={instagramAccountCount}
        userName={session.user.name ?? null}
        userEmail={session.user.email ?? null}
      >
        {children}
      </DashboardShell>
    </I18nProvider>
  );
}
