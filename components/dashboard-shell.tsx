"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/top-bar";
import MobileNav from "@/components/mobile-nav";

interface DashboardShellProps {
  children: React.ReactNode;
  workspaceName: string;
  instagramUsername: string | null;
  instagramAccountCount: number;
  userName?: string | null;
  userEmail?: string | null;
}

export default function DashboardShell({
  children,
  workspaceName,
  instagramUsername,
  instagramAccountCount,
  userName,
  userEmail,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        workspaceName={workspaceName}
        userName={userName}
        userEmail={userEmail}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          instagramUsername={instagramUsername}
          instagramAccountCount={instagramAccountCount}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* pb-20 on mobile ensures bottom nav does not overlap content */}
          <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-7xl mx-auto pb-24 lg:pb-8">
            {children}
          </div>
        </main>

        {/* Bottom Navigation on small screens */}
        <MobileNav />
      </div>
    </div>
  );
}
